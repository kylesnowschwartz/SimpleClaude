#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require_relative '../concerns/file_handler_support'
require 'open3'

# Lint Check Handler (Stop hook)
#
# PURPOSE: Run linters and type-checkers on files Claude modified, report errors
#          back so Claude can fix them before the user has to notice.
# TRIGGERS: When Claude Code finishes responding (Stop event).
# ACTION: If errors found, force continuation with lint output.
#         If clean (or on retry), allow stop.
#
# DESIGN DECISIONS:
# - Lint on Stop, not on Edit: work-in-progress edits would be too noisy.
# - Only report errors in files Claude actually modified (git diff + untracked).
# - tsc --noEmit output filtered to modified files only, preventing pre-existing
#   type errors from blocking indefinitely.
# - Retry guard: if stop_hook_active (Stop already fired once), allow stop even
#   with remaining errors to prevent infinite loops.
# - MAX_ERROR_OUTPUT_LENGTH prevents token explosion from verbose linter output.

class LintCheckHandler < ClaudeHooks::Stop
  include FileHandlerSupport

  MAX_ERROR_OUTPUT_LENGTH = 3000

  def call
    log 'Lint check handler triggered'

    # Retry guard: if the Stop hook already fired once this turn, let it go.
    # Prevents infinite continue loops when errors can't be auto-fixed.
    if stop_hook_active
      log 'Stop hook already active (retry) - allowing stop despite any remaining errors'
      allow_clean_stop!
      return output
    end

    modified = git_modified_files
    if modified.empty?
      log 'No modified files to lint'
      allow_clean_stop!
      return output
    end

    log "Checking #{modified.length} modified files"
    errors = collect_lint_errors(modified)

    if errors.empty?
      log 'All lint checks passed'
      allow_clean_stop!
    else
      log 'Found lint/type errors - forcing continuation', level: :warn
      report_errors!(errors)
    end

    output
  end

  private

  # Returns absolute paths of files Claude modified, filtered through skip checks.
  # Includes both tracked changes (staged + unstaged) and untracked new files.
  def git_modified_files
    return [] unless cwd
    return [] unless File.directory?(File.join(cwd, '.git'))

    # Staged + unstaged changes to tracked files
    diff_output, diff_status = Open3.capture2(
      'git', 'diff', '--name-only', 'HEAD',
      chdir: cwd
    )

    # Untracked files Claude created (respects .gitignore)
    untracked_output, untracked_status = Open3.capture2(
      'git', 'ls-files', '--others', '--exclude-standard',
      chdir: cwd
    )

    files = []
    files += diff_output.strip.split("\n") if diff_status.success?
    files += untracked_output.strip.split("\n") if untracked_status.success?

    files
      .reject(&:empty?)
      .uniq
      .map { |f| File.join(cwd, f) }
      .select { |f| File.exist?(f) }
      .reject { |f| should_skip_file?(f) }
  end

  # Groups files by type, runs per-file linters + project-wide checks.
  # Returns array of error strings (empty = all clean).
  def collect_lint_errors(files)
    errors = []
    files_by_ext = group_by_extension(files)

    # Per-file linters (report-only, no auto-fix)
    errors += run_eslint(files_by_ext[:js]) if files_by_ext[:js]&.any?
    errors += run_rubocop(files_by_ext[:rb]) if files_by_ext[:rb]&.any?
    errors += run_ruff(files_by_ext[:py]) if files_by_ext[:py]&.any?

    # Project-wide type/build checks (only when relevant files modified)
    errors += run_tsc(files) if files_by_ext[:js]&.any?
    errors += run_cargo_check if files_by_ext[:rs]&.any?
    errors += run_go_vet if files_by_ext[:go]&.any?

    errors
  end

  def group_by_extension(files)
    groups = {}

    files.each do |f|
      ext = File.extname(f).downcase
      case ext
      when '.ts', '.tsx', '.js', '.jsx'
        (groups[:js] ||= []) << f
      when '.rb'
        (groups[:rb] ||= []) << f
      when '.py'
        (groups[:py] ||= []) << f
      when '.rs'
        (groups[:rs] ||= []) << f
      when '.go'
        (groups[:go] ||= []) << f
      end
    end

    groups
  end

  # --- Per-file linters (report-only) ---

  def run_eslint(files)
    return [] unless command_available?('eslint')

    # Pass all files in one invocation for efficiency
    stdout_err, status = Open3.capture2e(
      'eslint', '--no-fix', '--format', 'compact', *files,
      chdir: cwd
    )
    return [] if status.success?

    ["eslint errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "eslint failed to run: #{e.message}", level: :error
    []
  end

  def run_rubocop(files)
    return [] unless command_available?('rubocop')

    # No autocorrect flags = report-only (rubocop doesn't fix by default)
    stdout_err, status = Open3.capture2e(
      'rubocop', '--format', 'simple', *files,
      chdir: cwd
    )
    return [] if status.success?

    ["rubocop errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "rubocop failed to run: #{e.message}", level: :error
    []
  end

  def run_ruff(files)
    return [] unless command_available?('ruff')

    stdout_err, status = Open3.capture2e(
      'ruff', 'check', *files,
      chdir: cwd
    )
    return [] if status.success?

    ["ruff errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "ruff failed to run: #{e.message}", level: :error
    []
  end

  # --- Project-wide checks ---

  # Run tsc --noEmit but filter output to only show errors in modified files.
  # This prevents pre-existing type errors from blocking indefinitely.
  def run_tsc(modified_files)
    tsc = find_tsc
    return [] unless tsc

    # Only run if tsconfig.json exists in the project
    return [] unless File.exist?(File.join(cwd, 'tsconfig.json'))

    stdout_err, status = Open3.capture2e(tsc, '--noEmit', chdir: cwd)
    return [] if status.success?

    # Filter to only errors in files Claude modified
    modified_basenames = modified_files.to_set { |f| relative_file_path(f) }
    relevant_lines = stdout_err.lines.select do |line|
      # tsc error lines look like: "src/foo.ts(10,5): error TS2345: ..."
      modified_basenames.any? { |basename| line.start_with?(basename) }
    end

    return [] if relevant_lines.empty?

    ["tsc --noEmit errors (in modified files):\n#{relevant_lines.join}"]
  rescue StandardError => e
    log "tsc failed to run: #{e.message}", level: :error
    []
  end

  def run_cargo_check
    return [] unless command_available?('cargo')
    return [] unless File.exist?(File.join(cwd, 'Cargo.toml'))

    stdout_err, status = Open3.capture2e(
      'cargo', 'check', '--message-format', 'short',
      chdir: cwd
    )
    return [] if status.success?

    ["cargo check errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "cargo check failed to run: #{e.message}", level: :error
    []
  end

  def run_go_vet
    return [] unless command_available?('go')
    return [] unless File.exist?(File.join(cwd, 'go.mod'))

    stdout_err, status = Open3.capture2e('go', 'vet', './...', chdir: cwd)
    return [] if status.success?

    ["go vet errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "go vet failed to run: #{e.message}", level: :error
    []
  end

  # --- Helpers ---

  # Prefer project-local tsc over global to match the project's TS version.
  def find_tsc
    local_tsc = File.join(cwd, 'node_modules', '.bin', 'tsc')
    return local_tsc if File.executable?(local_tsc)

    command_available?('tsc') ? 'tsc' : nil
  end

  def report_errors!(errors)
    combined = errors.join("\n\n")

    # Truncate to prevent token explosion
    if combined.length > MAX_ERROR_OUTPUT_LENGTH
      combined = "#{combined[0...MAX_ERROR_OUTPUT_LENGTH]}\n... (truncated, #{combined.length} total chars)"
    end

    instructions = <<~MSG.strip
      Lint/type errors found in modified files. Fix these before finishing:

      #{combined}
    MSG

    continue_with_instructions!(instructions)
  end

  def allow_clean_stop!
    ensure_stopping!
    suppress_output!
  end
end

# Testing support
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(LintCheckHandler) do |input_data|
    input_data['session_id'] = 'lint-check-test'
    input_data['stop_hook_active'] = false
  end
end
