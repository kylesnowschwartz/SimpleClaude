#!/usr/bin/env ruby
# frozen_string_literal: true

# PreCompact Entrypoint
#
# This entrypoint orchestrates all PreCompact handlers when Claude Code is about to compact the transcript.
# It reads JSON input from STDIN, executes all configured handlers, merges their outputs,
# and returns the final result to Claude Code via STDOUT.

require 'claude_hooks'
require 'json'

# Require all PreCompact handler classes
require_relative '../handlers/pre_compact_handler'

# Add additional handler requires here as needed:
# require_relative '../handlers/pre_compact/transcript_backupper'
# require_relative '../handlers/pre_compact/insight_extractor'
# require_relative '../handlers/pre_compact/summary_generator'

begin
  # Read input data from Claude Code
  input_data = JSON.parse($stdin.read)

  # Execute all PreCompact handlers
  handlers = []
  results = []

  # Initialize and execute main handler
  pre_compact_handler = PreCompactHandler.new(input_data)
  pre_compact_result = pre_compact_handler.call
  results << pre_compact_result
  handlers << 'PreCompactHandler'

  # Add additional handlers here:
  # transcript_backupper = TranscriptBackupperHandler.new(input_data)
  # backup_result = transcript_backupper.call
  # results << backup_result
  # handlers << 'TranscriptBackupperHandler'

  # insight_extractor = InsightExtractorHandler.new(input_data)
  # insight_result = insight_extractor.call
  # results << insight_result
  # handlers << 'InsightExtractorHandler'

  # Merge all handler outputs using the PreCompact-specific merge logic
  hook_output = ClaudeHooks::PreCompact.merge_outputs(*results)

  # Log successful execution
  warn "[PreCompact] Executed #{handlers.length} handlers: #{handlers.join(', ')}"

  # Output final merged result to Claude Code
  puts JSON.generate(hook_output)

  exit 0  # Success
rescue JSON::ParserError => e
  warn "[PreCompact] JSON parsing error: #{e.message}"
  puts JSON.generate({
                       continue: false,
                       stopReason: "PreCompact hook JSON parsing error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # JSON error
rescue StandardError => e
  warn "[PreCompact] Hook execution error: #{e.message}"
  warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']

  puts JSON.generate({
                       continue: false,
                       stopReason: "PreCompact hook execution error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # General error
end
