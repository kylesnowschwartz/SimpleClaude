#!/usr/bin/env ruby
# frozen_string_literal: true

require 'claude_hooks'

# Basic Notification Handler
#
# PURPOSE: Handle Claude Code notifications (permission requests, idle warnings)
# TRIGGERS: When Claude needs permission to use tools or when idle for 60+ seconds
#
# This is a basic implementation that logs notifications.
# Extend this class for custom notification handling (e.g., desktop notifications, sounds, etc.)

class NotificationHandler < ClaudeHooks::Notification
  def call
    log "Claude Code Notification: #{message}"

    # Log different types of notifications with appropriate levels
    case message
    when /needs your permission/i
      log "Permission request detected: #{message}", level: :info
    when /waiting for your input/i
      log "Idle timeout detected: #{message}", level: :warn
    else
      log "Other notification: #{message}", level: :info
    end

    # Notification hooks don't block or modify behavior, they just react
    output_data
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(NotificationHandler) do |input_data|
    input_data['session_id'] = 'notification-test'
    input_data['message'] = 'Claude needs your permission to use Bash'
  end
end
