#!/usr/bin/env ruby
# frozen_string_literal: true

require 'date'
require 'claude_hooks'

# SessionStart Handler
#
# PURPOSE: Initialize session state, setup logging, prepare environment
# TRIGGERS: When a new Claude Code session begins
#
# COMMON USE CASES:
# - Initialize project-specific configuration
# - Setup session logging
# - Load user preferences
# - Prepare development environment
# - Send welcome notifications
# - Check system requirements
#
# SETTINGS.JSON CONFIGURATION:
# {
#   "hooks": {
#     "SessionStart": [{
#       "matcher": "",
#       "hooks": [{
#         "type": "command",
#         "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/entrypoints/session_start.rb"
#       }]
#     }]
#   }
# }

class SessionStartHandler < ClaudeHooks::SessionStart
  def call
    log "Session starting for project: #{project_name}"

    # Example: Initialize session state
    # setup_project_environment
    # load_user_preferences
    # check_dependencies
    send_welcome_message

    # Allow session to continue
    allow_continue!
    suppress_output!

    output_data
  end

  private

  def project_name
    File.basename(cwd || Dir.pwd)
  end

  def setup_project_environment
    # Example: Setup environment variables, check git status, etc.
    log 'Setting up project environment'
  end

  def load_user_preferences
    # Example: Load user-specific settings for this project
    log 'Loading user preferences'
  end

  def check_dependencies
    # Example: Verify required tools are installed
    log 'Checking project dependencies'
  end

  def send_welcome_message
    # Add timestamp to backend context only
    current_time = Time.now.strftime('%B %d, %Y at %I:%M %p %Z')
    day_of_week = Date.today.strftime('%A')

    # Use additionalContext for Claude instructions (will be minimally visible)
    context_message = "Current local date and time: #{day_of_week}, #{current_time}"
    add_additional_context!("#{context_message}. Please acknowledge the current date and time in your first response.")
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(SessionStartHandler) do |input_data|
    input_data['session_id'] = 'test-session-01'
  end
end
