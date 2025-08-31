#!/usr/bin/env ruby
# frozen_string_literal: true

# PostToolUse Entrypoint
#
# This entrypoint orchestrates all PostToolUse handlers when Claude Code completes tool execution.
# It reads JSON input from STDIN, executes all configured handlers, merges their outputs,
# and returns the final result to Claude Code via STDOUT.

require 'claude_hooks'
require 'json'

# Require all PostToolUse handler classes
# require_relative '../handlers/post_tool_use_handler'
require_relative '../handlers/auto_format_handler'

# Add additional handler requires here as needed:
# require_relative '../handlers/post_tool_use/result_analyzer'
# require_relative '../handlers/post_tool_use/error_extractor'
# require_relative '../handlers/post_tool_use/metrics_collector'

begin
  # Read input data from Claude Code
  input_data = JSON.parse($stdin.read)

  # Execute all PostToolUse handlers
  handlers = []
  results = []

  # Initialize and execute main handler
  # post_tool_handler = PostToolUseHandler.new(input_data)
  # post_tool_result = post_tool_handler.call
  # results << post_tool_result
  # handlers << 'PostToolUseHandler'

  # Initialize and execute auto-format handler
  auto_format_handler = AutoFormatHandler.new(input_data)
  auto_format_result = auto_format_handler.call
  results << auto_format_result
  handlers << 'AutoFormatHandler'

  # Add additional handlers here:
  # result_analyzer = ResultAnalyzerHandler.new(input_data)
  # analyzer_result = result_analyzer.call
  # results << analyzer_result
  # handlers << 'ResultAnalyzerHandler'

  # error_extractor = ErrorExtractorHandler.new(input_data)
  # error_result = error_extractor.call
  # results << error_result
  # handlers << 'ErrorExtractorHandler'

  # Merge all handler outputs using the PostToolUse-specific merge logic
  hook_output = ClaudeHooks::PostToolUse.merge_outputs(*results)

  # Log successful execution
  warn "[PostToolUse] Executed #{handlers.length} handlers: #{handlers.join(', ')}"

  # Output final merged result to Claude Code
  puts JSON.generate(hook_output)

  exit 0  # Success
rescue JSON::ParserError => e
  warn "[PostToolUse] JSON parsing error: #{e.message}"
  puts JSON.generate({
                       continue: false,
                       stopReason: "PostToolUse hook JSON parsing error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # JSON error
rescue StandardError => e
  warn "[PostToolUse] Hook execution error: #{e.message}"
  warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']

  puts JSON.generate({
                       continue: false,
                       stopReason: "PostToolUse hook execution error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # General error
end
