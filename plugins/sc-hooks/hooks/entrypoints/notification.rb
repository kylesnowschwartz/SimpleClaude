#!/usr/bin/env ruby
# frozen_string_literal: true

# Notification Entrypoint
#
# This entrypoint orchestrates all Notification handlers when Claude Code sends notifications.
# Notifications are triggered when:
# 1. Claude needs permission to use a tool (e.g., "Claude needs your permission to use Bash")
# 2. When prompt input has been idle for at least 60 seconds (e.g., "Claude is waiting for your input")
#
# It reads JSON input from STDIN, executes all configured handlers, merges their outputs,
# and returns the final result to Claude Code via STDOUT.

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require 'json'

# Require all Notification handler classes
require_relative '../handlers/notification_handler'

begin
  # Read input data from Claude Code
  input_data = JSON.parse($stdin.read)

  # Initialize and execute all handlers
  main_handler = NotificationHandler.new(input_data)

  # Execute handlers
  main_handler.call

  # Output result and exit with appropriate code
  main_handler.output_and_exit
rescue JSON::ParserError => e
  warn "[Notification] JSON parsing error: #{e.message}"
  warn JSON.generate({
                       continue: true,
                       stopReason: "Notification hook JSON parsing error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1
rescue StandardError => e
  warn "[Notification] Hook execution error: #{e.message}"
  warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']

  warn JSON.generate({
                       continue: true,
                       stopReason: "Notification hook execution error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1
end
