#!/usr/bin/env ruby
# frozen_string_literal: true

# PostToolUse Entrypoint
#
# This entrypoint orchestrates all PostToolUse handlers when Claude Code completes tool execution.
# It reads JSON input from STDIN, executes all configured handlers, merges their outputs,
# and returns the final result to Claude Code via STDOUT.

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require 'json'

# Require all PostToolUse handler classes
# Add additional handler requires here as needed:
require_relative '../handlers/auto_format_handler'

begin
  # Read input data from Claude Code
  input_data = JSON.parse($stdin.read)

  # Initialize and execute all handlers
  auto_format_handler = AutoFormatHandler.new(input_data)

  # Execute handlers
  auto_format_handler.call

  # Output result and exit with appropriate code
  auto_format_handler.output_and_exit
rescue JSON::ParserError => e
  warn "[PostToolUse] JSON parsing error: #{e.message}"
  warn JSON.generate({
                       continue: true,
                       stopReason: "PostToolUse hook JSON parsing error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1
rescue StandardError => e
  warn "[PostToolUse] Hook execution error: #{e.message}"
  warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']

  warn JSON.generate({
                       continue: true,
                       stopReason: "PostToolUse hook execution error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1
end
