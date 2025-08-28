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
require_relative '../handlers/session_start_handler'

# Add additional handler requires here as needed:
# require_relative '../handlers/session_start/custom_handler'
# require_relative '../handlers/session_start/another_handler'

begin
  # Read input data from Claude Code
  input_data = JSON.parse($stdin.read)

  # Execute all SessionStart handlers
  handlers = []
  results = []

  # Initialize and execute main handler
  session_start_handler = SessionStartHandler.new(input_data)
  session_start_result = session_start_handler.call
  results << session_start_result
  handlers << 'SessionStartHandler'

  # Add additional handlers here:
  # custom_handler = CustomSessionStartHandler.new(input_data)
  # custom_result = custom_handler.call
  # results << custom_result
  # handlers << 'CustomSessionStartHandler'

  # Merge all handler outputs using the SessionStart-specific merge logic
  hook_output = ClaudeHooks::SessionStart.merge_outputs(*results)

  # Log successful execution
  warn "[SessionStart] Executed #{handlers.length} handlers: #{handlers.join(', ')}"

  # Output final merged result to Claude Code
  puts JSON.generate(hook_output)

  exit 0  # Success
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
