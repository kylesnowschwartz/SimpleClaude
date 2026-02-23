#!/usr/bin/env ruby
# frozen_string_literal: true

require 'date'
require_relative '../../vendor/claude_hooks/lib/claude_hooks'

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

    # Disabled: slow on session start, questionable value vs cron/launchd
    # backup_projects_directory
    # Disabled: dynamic timestamps invalidate Claude Code's prompt cache prefix,
    # causing ~16-19K tokens reprocessed at full price every session.
    # See: https://github.com/anthropics/claude-code/issues/14963
    # add_additional_context!(acknowledge_current_date)
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

    unless Dir.exist?(source_dir)
      log 'No projects directory found to backup'
      return
    end

    log 'Backing up projects directory to ~/backups/claude/projects'
    replace_directory(source_dir, backup_dir)
  end

  def replace_directory(source_dir, backup_dir)
    system('mkdir', '-p', backup_dir)
    system('rm', '-rf', backup_dir) if Dir.exist?(backup_dir)

    if system('cp', '-r', source_dir, backup_dir)
      log 'Projects directory backup completed successfully'
    else
      log 'Warning: Projects directory backup failed'
    end
  end

  def acknowledge_current_date
    # Add timestamp to backend context only
    current_time = Time.now.strftime('%B %d, %Y at %I:%M %p %Z')
    day_of_week = Date.today.strftime('%A')

    # Use additionalContext for Claude instructions (will be minimally visible)
    <<~CONTEXT
      Current local date and time: #{day_of_week}, #{current_time}.
      Acknowledge the current date and time in your first response.
    CONTEXT
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(SessionStartHandler) do |input_data|
    input_data['session_id'] = 'test-session-01'
  end
end
