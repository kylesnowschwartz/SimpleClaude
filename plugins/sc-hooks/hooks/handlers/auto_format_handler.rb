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

  # Total deadline across every formatter batch. COMMAND_TIMEOUT_SECONDS bounds
  # any single batch; this bounds their sum so a large dirty tree can't stack
  # enough batches to blow Claude Code's whole-hook timeout — which this handler
  # shares with the lint check that runs after it in the same Stop process.
  TOTAL_FORMAT_BUDGET_SECONDS = 30

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

  # Runs each formatter ONCE over all of its files instead of spawning a fresh
  # subprocess per file — collapsing N cold tool startups (markdownlint is a
  # Node CLI; each start cost dominated the old per-file loop) into one.
  # Returns "file (formatter)" strings for files that actually changed.
  def format_files(files)
    deadline = monotonic_now + TOTAL_FORMAT_BUDGET_SECONDS
    group_by_formatter(files).flat_map do |formatter, paths|
      next skip_over_budget(formatter, paths) if monotonic_now >= deadline

      format_batch(formatter, paths, deadline)
    end
  end

  # detect_formatter is deterministic per extension, so files sharing a
  # formatter produce an identical {command, args} hash and collapse into one
  # group. Files with no available formatter (nil) are dropped.
  def group_by_formatter(files)
    files.group_by { |f| detect_formatter(f) }.reject { |formatter, _| formatter.nil? }
  end

  def skip_over_budget(formatter, paths)
    log("Format budget (#{TOTAL_FORMAT_BUDGET_SECONDS}s) exhausted; skipped " \
        "#{paths.length} #{formatter[:name]} file(s)", level: :warn)
    []
  end

  # One subprocess for the whole group. Per-file "changed" is recovered by
  # diffing each file's content across the single invocation, so batching keeps
  # the precise change reporting the old per-file loop produced.
  def format_batch(formatter, paths, deadline)
    before = paths.to_h { |path| [path, read_file(path)] }
    timeout = remaining_timeout(deadline)
    command_parts = [formatter[:command]] + formatter[:args] + paths
    log "Running #{formatter[:name]} on #{paths.length} file#{'s' if paths.length > 1} (timeout #{timeout}s)"

    # Array form avoids shell interpolation. chdir: cwd finds project configs.
    output, status = capture2e_with_timeout(*command_parts, chdir: cwd, timeout: timeout)
    log_batch_status(formatter[:name], status, output)
    paths.filter_map { |path| changed_label(formatter[:name], path, before[path]) }
  rescue StandardError => e
    log("#{formatter[:name]} batch failed: #{e.message}", level: :error)
    []
  end

  # Nonzero exit is normal for formatters that fixed what they could but left
  # unfixable findings (e.g. markdownlint). Per-file attribution is gone once
  # batched, so log the batch detail at warn rather than as a hook failure.
  def log_batch_status(name, status, output)
    return if status.success?

    detail = output.strip.empty? ? '' : ": #{output.strip.lines.first(3).join.strip}"
    log("#{name} exited #{status.exitstatus}#{detail}", level: :warn)
  end

  def changed_label(name, path, content_before)
    rel = relative_file_path(path)
    if read_file(path) == content_before
      log("#{rel} unchanged")
      nil
    else
      log("Formatted #{rel}")
      "#{rel} (#{name})"
    end
  end

  # Clamp the per-batch deadline to whatever budget remains, so a late batch
  # can't run a full COMMAND_TIMEOUT_SECONDS past the total budget. Callers
  # only invoke this while monotonic_now < deadline, so remaining is positive.
  def remaining_timeout(deadline)
    [(deadline - monotonic_now).ceil, COMMAND_TIMEOUT_SECONDS].min.clamp(1, COMMAND_TIMEOUT_SECONDS)
  end

  def monotonic_now
    Process.clock_gettime(Process::CLOCK_MONOTONIC)
  end

  def read_file(path)
    File.read(path)
  rescue StandardError
    nil
  end

  def notify_formatted(formatted)
    summary = "Auto-formatted #{formatted.length} file#{'s' if formatted.length > 1}: #{formatted.join(', ')}"
    system_message!(summary)
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
