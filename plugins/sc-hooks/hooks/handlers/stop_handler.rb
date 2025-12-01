#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'

# Stop Handler
#
# PURPOSE: Control and customize Claude Code's stopping behavior
# TRIGGERS: When Claude Code is about to stop execution or end a session
#
# COMMON USE CASES:
# - Save session state and cleanup resources
# - Generate session summaries or reports
# - Backup important work or temporary files
# - Log session metrics and analytics
# - Send completion notifications
# - Trigger follow-up actions or workflows
#
# SETTINGS.JSON CONFIGURATION:
# {
#   "hooks": {
#     "Stop": [{
#       "matcher": "",
#       "hooks": [{
#         "type": "command",
#         "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/entrypoints/stop.rb"
#       }]
#     }]
#   }
# }

class StopHandler < ClaudeHooks::Stop
  def call
    log 'Processing session stop request'

    # Example: Save session state
    # save_session_state

    # Example: Generate session summary
    # generate_session_summary

    # Example: Cleanup temporary resources
    # cleanup_resources

    # Example: Send completion notifications
    # send_completion_notifications

    # Allow stopping to proceed
    allow_continue!

    output_data
  end

  private

  def save_session_state
    log 'Saving session state'

    # Example: Save important session data
    {
      session_id: session_id,
      end_time: Time.now,
      working_directory: cwd || Dir.pwd,
      transcript_path: transcript_path
    }

    # Example: Write to session cache
    # write_session_cache(session_data)

    # Example: Update project metadata
    # update_project_metadata(session_data)
  end

  def generate_session_summary
    log 'Generating session summary'

    # Example: Read transcript and generate summary
    return unless transcript_path && File.exist?(transcript_path)

    transcript = read_transcript
    summary = analyze_transcript(transcript)

    log "Session summary: #{summary[:total_interactions]} interactions, #{summary[:tools_used].length} tools used"

    # Example: Save summary to file
    # save_session_summary(summary)
  end

  def cleanup_resources
    log 'Cleaning up session resources'

    # Example: Remove temporary files
    # cleanup_temp_files

    # Example: Close database connections
    # close_database_connections

    # Example: Clear caches
    # clear_session_caches

    # Example: Stop background processes
    # stop_background_processes
  end

  def send_completion_notifications
    log 'Sending session completion notifications'

    # Example: Notify team about session completion
    # notify_team_completion

    # Example: Send analytics data
    # send_analytics_data

    # Example: Update project dashboard
    # update_project_dashboard
  end

  def analyze_transcript(transcript)
    # Simple transcript analysis
    lines = transcript.split("\n")

    {
      total_lines: lines.length,
      total_interactions: count_user_interactions(lines),
      tools_used: extract_tools_used(lines),
      errors_encountered: count_errors(lines),
      session_duration: calculate_session_duration(lines)
    }
  end

  def count_user_interactions(lines)
    # Count lines that look like user messages
    lines.count { |line| line.match?(/^(user:|User:)/i) }
  end

  def extract_tools_used(lines)
    # Extract tool names from transcript
    tools = []

    lines.each do |line|
      tools << ::Regexp.last_match(1) if line.match?(/Using tool: (\w+)/) || line.match?(/Tool call: (\w+)/)
    end

    tools.uniq
  end

  def count_errors(lines)
    # Count error messages in transcript
    error_patterns = [
      /error:/i,
      /failed:/i,
      /exception:/i,
      /cannot/i
    ]

    lines.count do |line|
      error_patterns.any? { |pattern| line.match?(pattern) }
    end
  end

  def calculate_session_duration(lines)
    # Simple duration calculation based on first and last timestamps
    first_timestamp = extract_first_timestamp(lines)
    last_timestamp = extract_last_timestamp(lines)

    if first_timestamp && last_timestamp
      (last_timestamp - first_timestamp).to_i
    else
      0
    end
  end

  def extract_first_timestamp(_lines)
    # Extract timestamp from first line (implementation depends on transcript format)
    # This is a placeholder - actual implementation would depend on transcript format
    nil
  end

  def extract_last_timestamp(_lines)
    # Extract timestamp from last line (implementation depends on transcript format)
    # This is a placeholder - actual implementation would depend on transcript format
    nil
  end

  def write_session_cache(data)
    # Example: Write session data to cache file
    project_path_for('cache/sessions')
    # FileUtils.mkdir_p(cache_dir)
    # File.write("#{cache_dir}/#{session_id}.json", JSON.pretty_generate(data))
    log "Would write session cache: #{data.keys.join(', ')}"
  end

  def update_project_metadata(_data)
    # Example: Update project-level metadata
    log 'Would update project metadata with session data'
  end

  def save_session_summary(summary)
    # Example: Save session summary to reports directory
    project_path_for('reports/sessions')
    # FileUtils.mkdir_p(reports_dir)
    # File.write("#{reports_dir}/#{session_id}_summary.json", JSON.pretty_generate(summary))
    log "Would save session summary: #{summary.keys.join(', ')}"
  end

  def cleanup_temp_files
    # Example: Remove temporary files created during session
    temp_patterns = [
      project_path_for('tmp/**/*'),
      project_path_for('.temp/**/*'),
      project_path_for('*.tmp')
    ]

    log "Would cleanup temporary files matching patterns: #{temp_patterns.join(', ')}"
  end

  def notify_team_completion
    # Example: Send Slack/Teams notification about session completion
    log 'Would notify team about session completion'
  end

  def send_analytics_data
    # Example: Send session metrics to analytics service
    log 'Would send analytics data for session'
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(StopHandler) do |input_data|
    input_data['session_id'] = 'test-session-01'
    input_data['reason'] = 'user_requested'
  end
end
