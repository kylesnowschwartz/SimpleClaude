#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require_relative '../../../lib/sound_config'

# Notification Handler
#
# PURPOSE: Handle Claude Code notifications (permission requests, idle warnings, MCP input)
# TRIGGERS: permission_prompt, elicitation_dialog, idle_prompt (filtered via hooks.json matcher)
# DISABLE: Set SIMPLE_CLAUDE_DISABLE_NOTIFICATIONS=1 to skip notifications entirely
# SOUND:   Controlled by ~/.config/claude/sounds.conf (SOUND_MODE=off|glass|aoe)
#          Or override with SIMPLE_CLAUDE_DISABLE_NOTIFICATION_SOUND=1

class NotificationHandler < ClaudeHooks::Notification
  def call
    log "Claude Code Notification [#{notification_type}]: #{message}"

    # Early return if notifications are disabled
    if ENV['SIMPLE_CLAUDE_DISABLE_NOTIFICATIONS']
      log 'Notifications disabled via SIMPLE_CLAUDE_DISABLE_NOTIFICATIONS', level: :debug
      return output_data
    end

    # Send macOS notification (fire and forget)
    send_macos_notification

    output_data
  end

  private

  def send_macos_notification
    title = 'Claude Code'
    # notification_type may be missing (see: github.com/anthropics/claude-code/issues/11964)
    # Fall back to message pattern matching when notification_type is nil
    subtitle = case effective_notification_type
               when 'permission_prompt'
                 'Permission Required'
               when 'elicitation_dialog'
                 'Input Required'
               when 'idle_prompt'
                 'Waiting for Input'
               else
                 'Notification'
               end

    # Sound controlled by SoundConfig (glass mode) or env var override
    sound_arg = if ENV['SIMPLE_CLAUDE_DISABLE_NOTIFICATION_SOUND'] || !SoundConfig.glass?
                  ''
                else
                  ' sound name "glass"'
                end
    script = %(display notification "#{escape_quotes(truncate_message(message))}" with title "#{title}" subtitle "#{subtitle}"#{sound_arg})

    # Fire and forget - don't block on osascript
    spawn('osascript', '-e', script, %i[out err] => '/dev/null')
  rescue StandardError => e
    log "Failed to send macOS notification: #{e.message}", level: :error
  end

  def escape_quotes(text)
    text.to_s.gsub('"', '\\"')
  end

  def truncate_message(text, max_length: 100)
    return text if text.length <= max_length

    "#{text[0, max_length - 3]}..."
  end

  # Returns notification_type if present, otherwise infers from message content
  # Workaround for: github.com/anthropics/claude-code/issues/11964
  def effective_notification_type
    return notification_type if notification_type

    case message
    when /permission/i
      'permission_prompt'
    when /waiting for.*input/i, /idle/i
      'idle_prompt'
    when /auth/i, /authenticated/i
      'auth_success'
    end
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(NotificationHandler) do |input_data|
    input_data['session_id'] = 'notification-test'
    input_data['message'] = 'Claude needs your permission to use Bash'
    input_data['notification_type'] = 'permission_prompt'
  end
end
