#!/usr/bin/env ruby
# frozen_string_literal: true

# Stop Entrypoint
#
# This entrypoint orchestrates all Stop handlers when Claude Code finishes responding.
# It reads JSON input from STDIN, executes all configured handlers, merges their outputs,
# and returns the final result to Claude Code via STDOUT.

require_relative '../../../vendor/claude_hooks/lib/claude_hooks'
require 'json'

# Require all Stop handler classes
# Add additional handler requires here as needed:
require_relative '../handlers/stop_you_are_not_right'

begin
  # Read input data from Claude Code
  input_data = JSON.parse($stdin.read)

  # Initialize and execute all handlers
  reflexive_agreement_handler = StopYouAreNotRight.new(input_data)

  # Execute handlers
  reflexive_agreement_handler.call

  # Use single handler output
  merged_output = reflexive_agreement_handler.output

  merged_output.output_and_exit
rescue JSON::ParserError => e
  warn "[Stop] JSON parsing error: #{e.message}"
  warn JSON.generate({
                       continue: true,
                       stopReason: "Stop hook JSON parsing error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1
rescue StandardError => e
  warn "[Stop] Hook execution error: #{e.message}"
  warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']

  warn JSON.generate({
                       continue: true,
                       stopReason: "Stop hook execution error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1
end
