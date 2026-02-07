#!/usr/bin/env ruby
# frozen_string_literal: true

# Stop Entrypoint
#
# This entrypoint orchestrates all Stop handlers when Claude Code finishes responding.
# It reads JSON input from STDIN, executes all configured handlers, merges their outputs,
# and returns the final result to Claude Code via STDOUT.
#
# Multi-handler merge pattern: if ANY handler blocks (forces continuation),
# the merged output blocks. Reasons from multiple handlers are concatenated.

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require 'json'

# Require all Stop handler classes
require_relative '../handlers/stop_you_are_not_right'
require_relative '../handlers/lint_check_handler'

begin
  input_data = JSON.parse($stdin.read)

  # Run all handlers, collect their outputs
  handlers = [
    StopYouAreNotRight,
    LintCheckHandler
  ]

  outputs = handlers.map do |handler_class|
    handler = handler_class.new(input_data)
    handler.call
    handler.output
  end

  # Merge outputs: if any handler blocks, merged blocks; reasons concatenated
  merged = ClaudeHooks::Output::Stop.merge(*outputs)
  merged.output_and_exit
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
