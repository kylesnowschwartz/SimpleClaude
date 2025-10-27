#!/usr/bin/env ruby
# frozen_string_literal: true

# SessionStart Entrypoint
#
# This entrypoint orchestrates all SessionStart handlers when Claude Code starts a new session.
# It reads JSON input from STDIN, executes all configured handlers, merges their outputs,
# and returns the final result to Claude Code via STDOUT.

require 'claude_hooks'
require 'json'

# Require all SessionStart handler classes
# Add additional handler requires here as needed:
require_relative '../handlers/session_start_handler'

begin
  # Read input data from Claude Code
  input_data = JSON.parse($stdin.read)

  hook = SessionStartHandler.new(input_data)
  hook.call
  hook.output_and_exit
rescue JSON::ParserError => e
  warn "[SessionStart] JSON parsing error: #{e.message}"
  puts JSON.generate({
                       continue: false,
                       stopReason: "SessionStart hook JSON parsing error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # JSON error
rescue StandardError => e
  warn "[SessionStart] Hook execution error: #{e.message}"
  warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']

  puts JSON.generate({
                       continue: false,
                       stopReason: "SessionStart hook execution error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # General error
end
