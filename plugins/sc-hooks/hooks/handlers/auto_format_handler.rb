#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require_relative '../concerns/file_handler_support'
require 'open3'

# Batch-formats all files Claude modified before lint checks run.
#
# Runs at Stop (not PostToolUse) to avoid per-edit transcript noise and
# wasted work when Claude edits the same file multiple times. Never blocks —
# the lint handler is the gatekeeper for actual errors.
class AutoFormatHandler < ClaudeHooks::Stop
  include FileHandlerSupport

  def call
    log 'Auto-format handler triggered'
    return skip_and_stop('retry - skipping formatting') if stop_hook_active
    return skip_and_stop('no modified files') if (modified = git_modified_files).empty?

    log "Formatting #{modified.length} modified files"
    formatted = format_files(modified)
    notify_formatted(formatted) if formatted.any?
    allow_clean_stop!
    output
  end

  private

  def skip_and_stop(reason)
    log "Stop hook: #{reason}"
    allow_clean_stop!
    output
  end

  # Returns array of "file (formatter)" strings for successfully formatted files.
  def format_files(files)
    files.filter_map { |file_path| format_single_file(file_path) }
  end

  def format_single_file(file_path)
    formatter = detect_formatter(file_path)
    return unless formatter

    rel = relative_file_path(file_path)
    log "Formatting #{rel} with #{formatter[:name]}"
    result = run_formatter(formatter, file_path)
    return log_format_failure(rel, result[:error]) unless result[:success]

    log "Formatted #{rel}"
    "#{rel} (#{formatter[:name]})"
  end

  def log_format_failure(rel, error)
    log("Format failed for #{rel}: #{error}", level: :error)
    nil
  end

  def notify_formatted(formatted)
    summary = "Auto-formatted #{formatted.length} file#{'s' if formatted.length > 1}: #{formatted.join(', ')}"
    system_message!(summary)
  end

  # Dispatcher — inherent complexity from supporting many file types.
  # rubocop:disable Metrics/CyclomaticComplexity, Metrics/MethodLength, Metrics/AbcSize, Metrics/PerceivedComplexity
  def detect_formatter(file_path)
    case File.extname(file_path).downcase
    when '.rb'
      command_available?('rubocop') ? { name: 'RuboCop', command: 'rubocop', args: ['-A'] } : nil
    when '.md'
      markdownlint_formatter
    when '.sh', '.bash'
      command_available?('shfmt') ? { name: 'shfmt', command: 'shfmt', args: ['-w', '-i', '2'] } : nil
    when '.lua'
      command_available?('stylua') ? { name: 'stylua', command: 'stylua', args: [] } : nil
    when '.rs'
      command_available?('rustfmt') ? { name: 'rustfmt', command: 'rustfmt', args: [] } : nil
    when '.py'
      command_available?('ruff') ? { name: 'ruff', command: 'ruff', args: ['format'] } : nil
    when '.yml', '.yaml'
      yaml_formatter
    when '.js', '.jsx', '.ts', '.tsx', '.json'
      js_formatter
    when '.css'
      command_available?('prettier') ? { name: 'prettier', command: 'prettier', args: ['--write'] } : nil
    when '.go'
      go_formatter
    end
  end
  # rubocop:enable Metrics/CyclomaticComplexity, Metrics/MethodLength, Metrics/AbcSize, Metrics/PerceivedComplexity

  def markdownlint_formatter
    return unless command_available?('markdownlint')

    # Deliberate overrides — these rules conflict with typical AI-generated markdown
    { name: 'markdownlint', command: 'markdownlint', args: ['--fix', '--disable', 'MD013,MD041,MD026,MD012,MD024'] }
  end

  def yaml_formatter
    if command_available?('yamlfmt')
      { name: 'yamlfmt', command: 'yamlfmt', args: ['-w'] }
    elsif command_available?('prettier')
      { name: 'prettier', command: 'prettier', args: ['--write', '--parser', 'yaml'] }
    end
  end

  def js_formatter
    if command_available?('eslint')
      { name: 'eslint', command: 'eslint', args: ['--fix'] }
    elsif command_available?('prettier')
      { name: 'prettier', command: 'prettier', args: ['--write'] }
    end
  end

  def go_formatter
    if command_available?('goimports')
      { name: 'goimports', command: 'goimports', args: ['-w'] }
    elsif command_available?('gofmt')
      { name: 'gofmt', command: 'gofmt', args: ['-w'] }
    end
  end

  def run_formatter(formatter, file_path)
    command_parts = [formatter[:command]] + formatter[:args] + [file_path]
    log "Running: #{command_parts.join(' ')}"

    # Array form avoids shell interpolation. chdir: cwd finds project configs.
    stdout_err, status = Open3.capture2e(*command_parts, chdir: cwd)
    status.success? ? { success: true, output: stdout_err } : { success: false, error: stdout_err.strip }
  rescue StandardError => e
    { success: false, error: e.message }
  end

  def allow_clean_stop!
    ensure_stopping!
    suppress_output!
  end
end

# Testing support
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(AutoFormatHandler) do |input_data|
    input_data['session_id'] = 'auto-format-test'
    input_data['stop_hook_active'] = false
  end
end
