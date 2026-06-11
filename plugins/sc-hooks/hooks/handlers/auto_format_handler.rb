#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require_relative '../concerns/file_handler_support'

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
    log_format_result(rel, result)
    return nil unless result[:changed]

    "#{rel} (#{formatter[:name]})"
  end

  # A formatter can modify the file AND exit nonzero (e.g. markdownlint with
  # unfixable issues left), so changed and success are reported independently.
  def log_format_result(rel, result)
    if result[:success]
      log(result[:changed] ? "Formatted #{rel}" : "#{rel} unchanged")
    elsif result[:changed]
      log("Partially formatted #{rel}: #{result[:error]}", level: :warn)
    else
      log("Format failed for #{rel}: #{result[:error]}", level: :error)
    end
  end

  def notify_formatted(formatted)
    summary = "Auto-formatted #{formatted.length} file#{'s' if formatted.length > 1}: #{formatted.join(', ')}"
    system_message!(summary)
  end

  def run_formatter(formatter, file_path)
    command_parts = [formatter[:command]] + formatter[:args] + [file_path]
    log "Running: #{command_parts.join(' ')}"

    content_before = File.read(file_path)
    # Array form avoids shell interpolation. chdir: cwd finds project configs.
    stdout_err, status = capture2e_with_timeout(*command_parts, chdir: cwd)
    { success: status.success?, changed: File.read(file_path) != content_before, error: stdout_err.strip }
  rescue StandardError => e
    { success: false, changed: false, error: e.message }
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
