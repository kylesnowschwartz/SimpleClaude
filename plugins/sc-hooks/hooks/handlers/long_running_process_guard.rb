#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'

# Catches foreground server commands and long-running processes before they
# hang the Bash tool for its full timeout (default 2 minutes).
#
# Tier 1 (block): Commands that never exit — dev servers, rails server, etc.
#   Tells Claude to use run_in_background: true instead.
#
# Tier 2 (warn): Long but finite commands — test suites, cargo build, etc.
#   Only warns when not inside tmux (session persistence concern).
class LongRunningProcessGuard < ClaudeHooks::PreToolUse
  # Dev servers, application servers, and other infinite processes.
  # These will always hang the Bash tool — no point letting them through.
  TIER_1_PATTERNS = [
    /\b(?:npm\s+run\s+dev|pnpm(?:\s+run)?\s+dev|yarn\s+dev|bun\s+run\s+dev)\b/,
    /\bnpm\s+start\b/,
    /\brails\s+(?:server|s)\b/,
    /\bpython3?\s+(?:-m\s+http\.server|manage\.py\s+runserver)\b/,
    /\bdocker\s+compose\s+up\b(?!.*\s-d\b)/
  ].freeze

  # Long but finite processes. Fine inside tmux; worth a heads-up otherwise.
  TIER_2_PATTERNS = [
    /\b(?:npm|pnpm|yarn|bun)\s+(?:test|install)\b/,
    /\bcargo\s+(?:build|test)\b/,
    /\bdocker\s+build\b/,
    /\b(?:pytest|vitest|playwright)\b/,
    /\bmake\b/
  ].freeze

  def call
    return approve_tool!('process guard disabled') if ENV['SIMPLE_CLAUDE_DISABLE_PROCESS_GUARD']

    command = tool_input&.dig('command').to_s.strip
    return approve_tool! if command.empty?

    segments = split_shell_segments(command)
    check_infinite_processes(segments) || check_long_processes(segments) || approve_tool!
  end

  private

  # Returns a truthy value (the output) if a Tier 1 match blocks, nil otherwise.
  # Each segment is [stripped, original] — match against stripped, display original.
  def check_infinite_processes(segments)
    segments.each do |stripped, original|
      next if tmux_launcher?(stripped)
      next unless match_patterns?(stripped, TIER_1_PATTERNS)

      log "Blocked long-running command: #{original.strip}"
      return block_tool!(block_message(original.strip))
    end
    nil
  end

  # Returns a truthy value (the output) if a Tier 2 match warns, nil otherwise.
  # Only fires outside tmux — inside tmux, long-running commands are fine.
  def check_long_processes(segments)
    return if in_tmux?

    segments.each do |stripped, original|
      next unless match_patterns?(stripped, TIER_2_PATTERNS)

      log "Warning about long-running command: #{original.strip}"
      system_message!("[LongRunningProcessGuard] '#{original.strip}' may take a while. " \
                      'Consider using run_in_background: true or running inside tmux.')
      return approve_tool!
    end
    nil
  end

  # Split compound shell commands on &&, ||, ;, and & while respecting quotes.
  # Returns pairs of [stripped_segment, original_segment] so callers can
  # pattern-match against the stripped version (no quoted content) but display
  # the original in messages.
  def split_shell_segments(command)
    placeholders = []
    sanitized = command.gsub(/(?:"(?:[^"\\]|\\.)*"|'[^']*')/) do |match|
      placeholders << match
      "__PLACEHOLDER_#{placeholders.length - 1}__"
    end

    sanitized.split(/\s*(?:&&|\|\||[;&])\s*/).map do |stripped|
      original = stripped.gsub(/__PLACEHOLDER_(\d+)__/) { placeholders[Regexp.last_match(1).to_i] }
      [stripped, original]
    end
  end

  def tmux_launcher?(stripped_segment)
    stripped_segment.strip.match?(/^\s*tmux\s+/)
  end

  def match_patterns?(stripped_segment, patterns)
    patterns.any? { |pattern| stripped_segment.match?(pattern) }
  end

  def in_tmux?
    ENV.fetch('TMUX', nil) && !ENV['TMUX'].empty?
  end

  def block_message(matched_command)
    "[LongRunningProcessGuard] Blocked: '#{matched_command}' will hang the Bash tool.\n\n" \
      'Use `run_in_background: true` in your Bash tool call to run this in the background, ' \
      'then check output with TaskOutput.'
  end
end

# Testing support
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(LongRunningProcessGuard) do |input_data|
    input_data['tool_name'] ||= 'Bash'
    input_data['tool_input'] ||= { 'command' => 'npm run dev' }
  end
end
