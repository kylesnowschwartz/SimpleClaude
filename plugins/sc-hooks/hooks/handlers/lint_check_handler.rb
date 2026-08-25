#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require_relative '../concerns/file_handler_support'
require_relative '../concerns/lint_runner_support'
require_relative '../concerns/stop_handler_support'
require 'open3'

# Runs linters and type-checkers on files Claude modified, reporting errors
# back so Claude can fix them before the user notices.
#
# Only reports errors in files Claude actually modified (git diff + untracked).
# Retry guard prevents infinite loops when errors can't be auto-fixed.
class LintCheckHandler < ClaudeHooks::Stop
  include FileHandlerSupport
  include LintRunnerSupport
  include StopHandlerSupport

  MAX_ERROR_OUTPUT_LENGTH = 3000

  # Per-file linters to run for each extension group, in report order.
  LINTERS_BY_GROUP = {
    js: %w[eslint biome],
    rb: %w[rubocop],
    py: %w[ruff]
  }.freeze

  # Project-wide checks, keyed by the extension group that triggers them.
  PROJECT_CHECKS_BY_GROUP = {
    rs: 'cargo check',
    go: 'go vet'
  }.freeze

  def call
    log 'Lint check handler triggered'
    return skip_and_stop('retry - allowing stop despite remaining errors') if stop_hook_active
    return skip_and_stop('no modified files to lint') if (modified = git_modified_files).empty?

    log "Checking #{modified.length} modified files"
    check_and_report(modified)
    output
  end

  private

  def check_and_report(modified)
    errors = collect_lint_errors(modified)

    if errors.empty?
      log 'All lint checks passed'
      allow_clean_stop!
    else
      log 'Found lint/type errors - forcing continuation', level: :warn
      report_errors!(errors)
    end
  end

  def collect_lint_errors(files)
    groups = group_by_extension(files)
    errors = LINTERS_BY_GROUP.flat_map do |group, linters|
      linters.flat_map { |linter| run_per_file_linter(linter, groups[group]) }
    end

    errors += run_tsc(files) if groups[:js]&.any?
    errors += PROJECT_CHECKS_BY_GROUP.filter_map do |group, check|
      run_project_check(check) if groups[group]&.any?
    end.flatten
    errors
  end

  # Extension grouping — inherent complexity from many file types.
  def group_by_extension(files)
    groups = {}
    files.each do |f|
      key = ext_to_group(File.extname(f).downcase)
      (groups[key] ||= []) << f if key
    end
    groups
  end

  def ext_to_group(ext)
    case ext
    when '.ts', '.tsx', '.js', '.jsx' then :js
    when '.rb' then :rb
    when '.py' then :py
    when '.rs' then :rs
    when '.go' then :go
    end
  end

  def report_errors!(errors)
    combined = errors.join("\n\n")
    combined = truncate_output(combined) if combined.length > MAX_ERROR_OUTPUT_LENGTH

    continue_with_instructions!(<<~MSG.strip)
      Lint/type errors found in modified files. Fix these before finishing:

      #{combined}
    MSG
  end

  def truncate_output(text)
    "#{text[0...MAX_ERROR_OUTPUT_LENGTH]}\n... (truncated, #{text.length} total chars)"
  end
end

# Testing support
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(LintCheckHandler) do |input_data|
    input_data['session_id'] = 'lint-check-test'
    input_data['stop_hook_active'] = false
  end
end
