#!/usr/bin/env ruby
# frozen_string_literal: true

# PreToolUse Entrypoint
#
# This entrypoint orchestrates all PreToolUse handlers when Claude Code is about to execute a tool.
# It reads JSON input from STDIN, executes all configured handlers, merges their outputs,
# and returns the final result to Claude Code via STDOUT.

require 'claude_hooks'
require 'json'

# Require all PreToolUse handler classes
require_relative '../handlers/pre_tool_use_handler'

# Add additional handler requires here as needed:
# require_relative '../handlers/pre_tool_use/security_validator'
# require_relative '../handlers/pre_tool_use/rate_limiter'
# require_relative '../handlers/pre_tool_use/audit_logger'

begin
  # Read input data from Claude Code
  input_data = JSON.parse($stdin.read)


  hook = PreToolUseHandler.new(input_data)
  hook.call
  hook.output_and_exit
rescue JSON::ParserError => e
  warn "[PreToolUse] JSON parsing error: #{e.message}"
  puts JSON.generate({
                       continue: false,
                       decision: 'block',
                       reason: "PreToolUse hook JSON parsing error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # JSON error
rescue StandardError => e
  warn "[PreToolUse] Hook execution error: #{e.message}"
  warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']

  puts JSON.generate({
                       continue: false,
                       decision: 'block',
                       reason: "PreToolUse hook execution error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # General error
end
