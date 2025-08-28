#!/usr/bin/env ruby
# frozen_string_literal: true

require 'claude_hooks'

# Notification Handler
#
# PURPOSE: Process and respond to system notifications from Claude Code
# TRIGGERS: When Claude Code sends notifications about system events
#
# COMMON USE CASES:
# - Filter and format notification messages
# - Route notifications to different channels (email, Slack, etc.)
# - Log important system events
# - Trigger automated responses to specific notifications
# - Suppress or enhance notification content
# - Integrate with external monitoring systems
#
# SETTINGS.JSON CONFIGURATION:
# {
#   "hooks": {
#     "Notification": [{
#       "matcher": "",
#       "hooks": [{
#         "type": "command",
#         "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/entrypoints/notification.rb"
#       }]
#     }]
#   }
# }

class NotificationHandler < ClaudeHooks::Notification
  def call
    log "Processing notification: #{notification_type}"

    # Example: Route notifications based on type
    # route_notification

    # Example: Filter notification content
    # filter_notification_content

    # Example: Send to external systems
    # send_to_external_systems

    # Example: Log important notifications
    # log_important_notifications

    output_data
  end

  private

  def route_notification
    case notification_type
    when 'error'
      handle_error_notification
    when 'warning'
      handle_warning_notification
    when 'info'
      handle_info_notification
    when 'success'
      handle_success_notification
    else
      log "Unknown notification type: #{notification_type}", level: :warn
    end
  end

  def handle_error_notification
    log "Error notification received: #{notification_message}", level: :error

    # Example: Send critical errors to monitoring system
    # send_to_monitoring_system(notification_message, 'critical')

    # Example: Create incident ticket
    # create_incident_ticket

    # Example: Notify on-call team
    # notify_oncall_team
  end

  def handle_warning_notification
    log "Warning notification received: #{notification_message}", level: :warn

    # Example: Track warning trends
    # track_warning_trends

    # Example: Send to development team channel
    # send_to_dev_channel
  end

  def handle_info_notification
    log "Info notification received: #{notification_message}"

    # Example: Log for analytics
    # log_for_analytics

    # Example: Update dashboard
    # update_dashboard
  end

  def handle_success_notification
    log "Success notification received: #{notification_message}"

    # Example: Track success metrics
    # track_success_metrics

    # Example: Send positive feedback
    # send_positive_feedback
  end

  def filter_notification_content
    # Example: Remove sensitive information from notifications
    filtered_message = notification_message

    # Remove API keys, passwords, etc.
    sensitive_patterns = [
      /api[_\s]?key[:\s]+[\w-]+/i,
      /password[:\s]+\S+/i,
      /token[:\s]+[\w\-.]+/i
    ]

    sensitive_patterns.each do |pattern|
      filtered_message = filtered_message.gsub(pattern, '[REDACTED]')
    end

    return unless filtered_message != notification_message

    log 'Notification content was filtered for sensitive information'
    # Update the notification message
    # set_notification_message(filtered_message)
  end

  def send_to_external_systems
    # Example: Send notifications to various external systems

    case notification_type
    when 'error'
      # send_to_sentry
      # send_to_pagerduty
      # send_to_slack_alerts_channel
      log 'Error notification would be sent to external systems'

    when 'warning'
      # send_to_slack_dev_channel
      # add_to_monitoring_dashboard
      log 'Warning notification would be sent to development team'

    when 'info'
      # send_to_analytics
      # update_metrics_dashboard
      log 'Info notification would be logged for analytics'
    end
  end

  def log_important_notifications
    # Example: Enhanced logging for specific notification patterns

    important_patterns = [
      /deployment/i,
      /security/i,
      /critical/i,
      /failure/i,
      /timeout/i
    ]

    is_important = important_patterns.any? do |pattern|
      notification_message.match?(pattern)
    end

    return unless is_important

    log "IMPORTANT NOTIFICATION: #{notification_message}", level: :error

    # Example: Store in persistent log
    # store_in_persistent_log

    # Example: Add to audit trail
    # add_to_audit_trail
  end

  def send_to_monitoring_system(message, severity)
    # Example: Integration with monitoring systems like DataDog, New Relic, etc.
    log "Would send to monitoring system: #{message} (#{severity})"
  end

  def create_incident_ticket
    # Example: Create ticket in Jira, GitHub Issues, etc.
    log 'Would create incident ticket for error notification'
  end

  def notify_oncall_team
    # Example: PagerDuty, Slack, email notifications
    log 'Would notify on-call team about critical error'
  end

  def track_warning_trends
    # Example: Store warning data for trend analysis
    log 'Would track warning trend data'
  end

  def send_to_dev_channel
    # Example: Slack, Discord, Teams notification
    log 'Would send warning to development channel'
  end

  def notification_type
    # Access notification type from input data
    input_data['notification_type'] || 'unknown'
  end

  def notification_message
    # Access notification message from input data
    input_data['message'] || ''
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(NotificationHandler) do |input_data|
    input_data['notification_type'] = 'error'
    input_data['message'] = 'Test error notification message'
    input_data['session_id'] = 'test-session-01'
  end
end
