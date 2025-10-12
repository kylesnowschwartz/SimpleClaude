#!/usr/bin/env ruby
# frozen_string_literal: true

require 'date'
require 'claude_hooks'

# SessionStart Handler
#
# PURPOSE: Initialize session state, setup logging, prepare environment
# TRIGGERS: When a new Claude Code session begins
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

    backup_projects_directory
    acknowledge_current_date

    allow_continue!
    suppress_output!

    output_data
  end

  private

  def project_name
    File.basename(cwd || Dir.pwd)
  end

  def backup_projects_directory
    source_dir = File.expand_path('~/.claude/projects')
    backup_dir = File.expand_path('~/backups/claude/projects')

    if Dir.exist?(source_dir)
      log 'Backing up projects directory to ~/backups/claude/projects'

      # Create backup directory if it doesn't exist
      system('mkdir', '-p', backup_dir)

      # Remove existing backup and copy fresh
      system('rm', '-rf', backup_dir) if Dir.exist?(backup_dir)

      # Copy the projects directory
      if system('cp', '-r', source_dir, backup_dir)
        log 'Projects directory backup completed successfully'
      else
        log 'Warning: Projects directory backup failed'
      end
    else
      log 'No projects directory found to backup'
    end
  end

  def acknowledge_current_date
    # Add timestamp to backend context only
    current_time = Time.now.strftime('%B %d, %Y at %I:%M %p %Z')
    day_of_week = Date.today.strftime('%A')

    # Use additionalContext for Claude instructions (will be minimally visible)
    context_message = "Current local date and time: #{day_of_week}, #{current_time}"
    add_additional_context!("#{context_message}. Acknowledge the current date and time in your first response.")
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(SessionStartHandler) do |input_data|
    input_data['session_id'] = 'test-session-01'
  end
end
