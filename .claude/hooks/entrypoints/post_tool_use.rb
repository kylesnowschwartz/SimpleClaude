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


  hook = AutoFormatHandler.new(input_data)
  hook.call
  hook.output_and_exit
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
