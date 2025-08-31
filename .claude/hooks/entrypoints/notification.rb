#!/usr/bin/env ruby
# frozen_string_literal: true

# Notification Entrypoint
#
# This entrypoint orchestrates all Notification handlers when Claude Code sends system notifications.
# It reads JSON input from STDIN, executes all configured handlers, merges their outputs,
# and returns the final result to Claude Code via STDOUT.

require 'claude_hooks'
require 'json'

# Require all Notification handler classes
require_relative '../handlers/notification_handler'

# Add additional handler requires here as needed:
# require_relative '../handlers/notification/slack_notifier'
# require_relative '../handlers/notification/email_sender'
# require_relative '../handlers/notification/log_formatter'

begin
  # Read input data from Claude Code
  input_data = JSON.parse($stdin.read)


  hook = NotificationHandler.new(input_data)
  hook.call
  hook.output_and_exit
rescue JSON::ParserError => e
  warn "[Notification] JSON parsing error: #{e.message}"
  puts JSON.generate({
                       continue: false,
                       stopReason: "Notification hook JSON parsing error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # JSON error
rescue StandardError => e
  warn "[Notification] Hook execution error: #{e.message}"
  warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']

  puts JSON.generate({
                       continue: false,
                       stopReason: "Notification hook execution error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # General error
end
