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

  # Execute all Notification handlers
  handlers = []
  results = []

  # Initialize and execute main handler
  notification_handler = NotificationHandler.new(input_data)
  notification_result = notification_handler.call
  results << notification_result
  handlers << 'NotificationHandler'

  # Add additional handlers here:
  # slack_notifier = SlackNotifierHandler.new(input_data)
  # slack_result = slack_notifier.call
  # results << slack_result
  # handlers << 'SlackNotifierHandler'

  # email_sender = EmailSenderHandler.new(input_data)
  # email_result = email_sender.call
  # results << email_result
  # handlers << 'EmailSenderHandler'

  # Merge all handler outputs using the Notification-specific merge logic
  hook_output = ClaudeHooks::Notification.merge_outputs(*results)

  # Log successful execution
  warn "[Notification] Executed #{handlers.length} handlers: #{handlers.join(', ')}"

  # Output final merged result to Claude Code
  puts JSON.generate(hook_output)

  exit 0  # Success
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
