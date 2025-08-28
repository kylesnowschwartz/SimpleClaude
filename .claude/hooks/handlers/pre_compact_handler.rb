#!/usr/bin/env ruby
# frozen_string_literal: true

require 'claude_hooks'

# PreCompact Handler
#
# PURPOSE: Control and customize transcript compaction before it occurs
# TRIGGERS: Before Claude Code compacts (summarizes) the conversation transcript
#
# COMMON USE CASES:
# - Preserve important conversation segments from compaction
# - Extract and save key decisions or insights before compaction
# - Backup full transcript before summarization
# - Add metadata or tags to preserve context
# - Control which parts of the conversation should be preserved
# - Generate custom summaries alongside system compaction
#
# SETTINGS.JSON CONFIGURATION:
# {
#   "hooks": {
#     "PreCompact": [{
#       "matcher": "",
#       "hooks": [{
#         "type": "command",
#         "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/entrypoints/pre_compact.rb"
#       }]
#     }]
#   }
# }

class PreCompactHandler < ClaudeHooks::PreCompact
  def call
    log "Processing pre-compaction for session: #{session_id}"

    # Example: Backup full transcript
    # backup_full_transcript

    # Example: Extract key insights before compaction
    # extract_key_insights

    # Example: Preserve important segments
    # mark_segments_for_preservation

    # Example: Generate custom summary
    # generate_custom_summary

    # Allow compaction to proceed
    allow_continue!

    output_data
  end

  private

  def backup_full_transcript
    log 'Backing up full transcript before compaction'

    if transcript_path && File.exist?(transcript_path)
      transcript_content = read_transcript

      # Example: Save to backup location
      backup_path = generate_backup_path
      # File.write(backup_path, transcript_content)

      log "Full transcript backed up to: #{backup_path}"
      log "Transcript size: #{transcript_content.length} characters"
    else
      log 'No transcript found to backup', level: :warn
    end
  end

  def extract_key_insights
    log 'Extracting key insights before compaction'

    return unless transcript_path && File.exist?(transcript_path)

    transcript = read_transcript
    insights = analyze_transcript_for_insights(transcript)

    if insights.any?
      log "Extracted #{insights.length} key insights"
      # save_insights_to_file(insights)

      insights.each_with_index do |insight, index|
        log "Insight #{index + 1}: #{insight[:type]} - #{insight[:summary][0..100]}..."
      end
    else
      log 'No key insights found in transcript'
    end
  end

  def mark_segments_for_preservation
    log 'Identifying segments to preserve from compaction'

    return unless transcript_path && File.exist?(transcript_path)

    transcript = read_transcript
    important_segments = identify_important_segments(transcript)

    if important_segments.any?
      log "Identified #{important_segments.length} important segments for preservation"

      # Example: Mark segments with special markers that compaction should preserve
      important_segments.each do |segment|
        log "Preserving: #{segment[:type]} at #{segment[:location]}"
      end

      # save_preservation_markers(important_segments)
    else
      log 'No critical segments identified for preservation'
    end
  end

  def generate_custom_summary
    log 'Generating custom summary before system compaction'

    return unless transcript_path && File.exist?(transcript_path)

    transcript = read_transcript
    custom_summary = create_structured_summary(transcript)

    log "Generated custom summary with #{custom_summary.keys.length} sections"
    # save_custom_summary(custom_summary)

    custom_summary.each do |section, content|
      log "#{section}: #{content[:count]} items" if content.is_a?(Hash) && content[:count]
    end
  end

  def analyze_transcript_for_insights(transcript)
    insights = []
    lines = transcript.split("\n")

    # Look for decision points
    decision_patterns = [
      /decided to/i,
      /chose to/i,
      /selected/i,
      /will use/i,
      /approach will be/i
    ]

    decision_patterns.each do |pattern|
      lines.each_with_index do |line, index|
        next unless line.match?(pattern)

        insights << {
          type: 'decision',
          line_number: index + 1,
          content: line.strip,
          summary: extract_decision_summary(line)
        }
      end
    end

    # Look for important findings
    finding_patterns = [
      /found that/i,
      /discovered/i,
      /identified/i,
      /analysis shows/i,
      /results indicate/i
    ]

    finding_patterns.each do |pattern|
      lines.each_with_index do |line, index|
        next unless line.match?(pattern)

        insights << {
          type: 'finding',
          line_number: index + 1,
          content: line.strip,
          summary: extract_finding_summary(line)
        }
      end
    end

    # Look for code changes
    code_patterns = [
      /implemented/i,
      /added function/i,
      /created class/i,
      /modified/i,
      /refactored/i
    ]

    code_patterns.each do |pattern|
      lines.each_with_index do |line, index|
        next unless line.match?(pattern)

        insights << {
          type: 'code_change',
          line_number: index + 1,
          content: line.strip,
          summary: extract_code_change_summary(line)
        }
      end
    end

    insights
  end

  def identify_important_segments(transcript)
    segments = []
    lines = transcript.split("\n")

    # Identify error resolution segments
    error_context = []
    in_error_resolution = false

    lines.each_with_index do |line, index|
      if line.match?(/error|exception|failed/i)
        in_error_resolution = true
        error_context = [index]
      elsif in_error_resolution && line.match?(/fixed|resolved|solved|working/i)
        error_context << index
        segments << {
          type: 'error_resolution',
          location: "lines #{error_context.first}-#{error_context.last}",
          start_line: error_context.first,
          end_line: error_context.last,
          summary: 'Error resolution sequence'
        }
        in_error_resolution = false
        error_context = []
      end

      # Identify architectural decisions
      next unless line.match?(/architecture|design pattern|structure|approach/i)

      segments << {
        type: 'architectural_decision',
        location: "line #{index + 1}",
        line_number: index + 1,
        content: line.strip,
        summary: 'Architectural decision or discussion'
      }

      # Identify code review segments
      next unless line.match?(/review|feedback|suggestion|improvement/i)

      segments << {
        type: 'code_review',
        location: "line #{index + 1}",
        line_number: index + 1,
        content: line.strip,
        summary: 'Code review or improvement suggestion'
      }
    end

    segments
  end

  def create_structured_summary(transcript)
    lines = transcript.split("\n")

    {
      session_info: {
        session_id: session_id,
        line_count: lines.length,
        character_count: transcript.length,
        compaction_time: Time.now
      },
      tools_used: extract_tools_used(lines),
      files_modified: extract_files_modified(lines),
      key_decisions: extract_decisions(lines),
      errors_and_resolutions: extract_error_resolutions(lines),
      user_goals: extract_user_goals(lines)
    }
  end

  def extract_tools_used(lines)
    tools = []
    lines.each do |line|
      if (match = line.match(/using (\w+) tool/i) || line.match(/tool: (\w+)/i))
        tools << match[1]
      end
    end
    { tools: tools.uniq, count: tools.uniq.length }
  end

  def extract_files_modified(lines)
    files = []
    lines.each do |line|
      if (match = line.match(/modified file: (.+)/i) || line.match(/editing (.+\.\w+)/i))
        files << match[1].strip
      end
    end
    { files: files.uniq, count: files.uniq.length }
  end

  def extract_decisions(lines)
    decisions = []
    lines.each_with_index do |line, index|
      next unless line.match?(/decided|chose|selected|will use/i)

      decisions << {
        line: index + 1,
        summary: line.strip[0..100] + (line.length > 100 ? '...' : '')
      }
    end
    { decisions: decisions, count: decisions.length }
  end

  def extract_error_resolutions(lines)
    resolutions = []
    lines.each_with_index do |line, index|
      next unless line.match?(/fixed|resolved|solved/i) &&
                  lines[index - 1..index + 1].any? { |l| l.match?(/error|exception/i) }

      resolutions << {
        line: index + 1,
        summary: line.strip[0..100] + (line.length > 100 ? '...' : '')
      }
    end
    { resolutions: resolutions, count: resolutions.length }
  end

  def extract_user_goals(lines)
    goals = []
    lines.each_with_index do |line, index|
      next unless line.match?(/^user:|^User:/i) && line.match?(/help me|I need|can you|please/i)

      goals << {
        line: index + 1,
        summary: line.strip[0..150] + (line.length > 150 ? '...' : '')
      }
    end
    { goals: goals, count: goals.length }
  end

  def generate_backup_path
    timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
    project_path_for("backups/transcripts/#{session_id}_#{timestamp}.txt")
  end

  def extract_decision_summary(line)
    line.strip[0..100] + (line.length > 100 ? '...' : '')
  end

  def extract_finding_summary(line)
    line.strip[0..100] + (line.length > 100 ? '...' : '')
  end

  def extract_code_change_summary(line)
    line.strip[0..100] + (line.length > 100 ? '...' : '')
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(PreCompactHandler) do |input_data|
    input_data['session_id'] = 'test-session-01'
    input_data['reason'] = 'transcript_size_limit'
  end
end
