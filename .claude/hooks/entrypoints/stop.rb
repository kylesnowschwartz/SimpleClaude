#!/usr/bin/env ruby
# frozen_string_literal: true

# Stop Entrypoint
#
# This entrypoint orchestrates all Stop handlers when Claude Code is about to stop execution.
# It reads JSON input from STDIN, executes all configured handlers, merges their outputs,
# and returns the final result to Claude Code via STDOUT.

require 'claude_hooks'
require 'json'

# Require all Stop handler classes
require_relative '../handlers/stop_handler'

# Add additional handler requires here as needed:
# require_relative '../handlers/stop/session_saver'
# require_relative '../handlers/stop/cleanup_manager'
# require_relative '../handlers/stop/analytics_reporter'

begin
  # Read input data from Claude Code
  input_data = JSON.parse($stdin.read)

  # Execute all Stop handlers
  handlers = []
  results = []

  # Initialize and execute main handler
  stop_handler = StopHandler.new(input_data)
  stop_result = stop_handler.call
  results << stop_result
  handlers << 'StopHandler'

  # Add additional handlers here:
  # session_saver = SessionSaverHandler.new(input_data)
  # saver_result = session_saver.call
  # results << saver_result
  # handlers << 'SessionSaverHandler'

  # cleanup_manager = CleanupManagerHandler.new(input_data)
  # cleanup_result = cleanup_manager.call
  # results << cleanup_result
  # handlers << 'CleanupManagerHandler'

  # Merge all handler outputs using the Stop-specific merge logic
  hook_output = ClaudeHooks::Stop.merge_outputs(*results)

  # Log successful execution
  warn "[Stop] Executed #{handlers.length} handlers: #{handlers.join(', ')}"

  # Output final merged result to Claude Code
  puts JSON.generate(hook_output)

  exit 0  # Success
rescue JSON::ParserError => e
  warn "[Stop] JSON parsing error: #{e.message}"
  puts JSON.generate({
                       continue: false,
                       stopReason: "Stop hook JSON parsing error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # JSON error
rescue StandardError => e
  warn "[Stop] Hook execution error: #{e.message}"
  warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']

  puts JSON.generate({
                       continue: false,
                       stopReason: "Stop hook execution error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # General error
end
