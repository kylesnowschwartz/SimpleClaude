#!/usr/bin/env ruby
# frozen_string_literal: true

# SubagentStop Entrypoint
#
# This entrypoint orchestrates all SubagentStop handlers when Claude Code completes a subagent task.
# It reads JSON input from STDIN, executes all configured handlers, merges their outputs,
# and returns the final result to Claude Code via STDOUT.

require 'claude_hooks'
require 'json'

# Require all SubagentStop handler classes
require_relative '../handlers/subagent_stop_handler'

# Add additional handler requires here as needed:
# require_relative '../handlers/subagent_stop/result_processor'
# require_relative '../handlers/subagent_stop/performance_tracker'
# require_relative '../handlers/subagent_stop/cache_manager'

begin
  # Read input data from Claude Code
  input_data = JSON.parse($stdin.read)

  # Execute all SubagentStop handlers
  handlers = []
  results = []

  # Initialize and execute main handler
  subagent_stop_handler = SubagentStopHandler.new(input_data)
  subagent_result = subagent_stop_handler.call
  results << subagent_result
  handlers << 'SubagentStopHandler'

  # Add additional handlers here:
  # result_processor = ResultProcessorHandler.new(input_data)
  # processor_result = result_processor.call
  # results << processor_result
  # handlers << 'ResultProcessorHandler'

  # performance_tracker = PerformanceTrackerHandler.new(input_data)
  # perf_result = performance_tracker.call
  # results << perf_result
  # handlers << 'PerformanceTrackerHandler'

  # Merge all handler outputs using the SubagentStop-specific merge logic
  hook_output = ClaudeHooks::SubagentStop.merge_outputs(*results)

  # Log successful execution
  warn "[SubagentStop] Executed #{handlers.length} handlers: #{handlers.join(', ')}"

  # Output final merged result to Claude Code
  puts JSON.generate(hook_output)

  exit 0  # Success
rescue JSON::ParserError => e
  warn "[SubagentStop] JSON parsing error: #{e.message}"
  puts JSON.generate({
                       continue: false,
                       stopReason: "SubagentStop hook JSON parsing error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # JSON error
rescue StandardError => e
  warn "[SubagentStop] Hook execution error: #{e.message}"
  warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']

  puts JSON.generate({
                       continue: false,
                       stopReason: "SubagentStop hook execution error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # General error
end
