#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require 'json'
require 'rbconfig'
require_relative '../lib/transcript_parser'

# CopyMessageHandler
#
# PURPOSE: Handle /sc-copy-prompt and /sc-copy-response commands
# TRIGGERS: When user submits a prompt starting with '/sc-copy-prompt' or '/sc-copy-response'
#
# COMMAND FORMATS:
# - /sc-copy-prompt [number]    - Copy last N prompts (default: 1, most recent)
# - /sc-copy-prompt 5           - Copy the last 5 prompts
# - /sc-copy-response [number]  - Copy last N responses (default: 1, most recent)
# - /sc-copy-response 5         - Copy the last 5 responses

class CopyMessageHandler < ClaudeHooks::UserPromptSubmit
  def call
    return unless current_prompt.start_with?('/sc-copy-prompt', '/sc-copy-response')

    log "Processing copy command: #{current_prompt}"

    # Determine message type and parse command arguments
    message_type = current_prompt.start_with?('/sc-copy-prompt') ? 'prompt' : 'response'
    args = parse_copy_command(current_prompt, message_type)

    begin
      messages = extract_messages_from_transcript(message_type)
      result = handle_copy_command(messages, args, message_type)

      if result[:success]
        copy_to_clipboard(result[:content]) if result[:content]
        block_prompt!(result[:message])
      else
        log result[:error], level: :error
        block_prompt!("Error: #{result[:error]}")
      end
    rescue StandardError => e
      log "Copy #{message_type} failed: #{e.message}", level: :error
      block_prompt!("Failed to copy #{message_type}: #{e.message}")
    end

    output
  end

  private

  def parse_copy_command(command, type)
    args = {
      number: 1
    }

    # Parse number from command (default to 1 if no number specified)
    case command
    when %r{^/sc-copy-#{type}\s+(\d+)$}
      args[:number] = ::Regexp.last_match(1).to_i
    end

    args
  end

  def handle_copy_command(items, args, type)
    return { success: false, error: "No #{type}s found" } if items.empty?

    count = args[:number]
    return { success: false, error: "#{type.capitalize} count must be at least 1" } if count < 1

    if count > items.length
      return { success: false, error: "Only #{items.length} #{type}#{'s' if items.length != 1} available" }
    end

    # Take the last N messages (first N from newest-first array)
    selected_items = items.first(count)
    # Reverse to show in chronological order (oldest to newest)
    combined_content = selected_items.reverse.join("\n\n")

    message_label = count == 1 ? type.capitalize : "Last #{count} #{type}s"
    preview = generate_preview(combined_content)

    {
      success: true,
      content: combined_content,
      message: "#{message_label} copied to clipboard: #{preview}"
    }
  end

  def extract_messages_from_transcript(message_type)
    return [] unless transcript_path && File.exist?(transcript_path)

    if message_type == 'prompt'
      extract_prompts_from_transcript
    else
      extract_responses_from_transcript
    end
  end

  def extract_prompts_from_transcript
    request_groups = {}

    begin
      # Use defensive parser to handle variable content formats
      parsed_entries = TranscriptParser.parse_transcript_file(transcript_path, strict: false)

      parsed_entries.each do |entry|
        # Skip non-user messages and parse errors
        next unless entry.dig(:message, :role) == 'user'
        next if entry[:parse_error]

        request_id = entry[:request_id]
        content = entry.dig(:message, :content) || ''

        # Group by request ID to handle multi-part prompts
        if request_groups[request_id]
          request_groups[request_id] += "\n#{content}" if content && !content.empty?
        else
          request_groups[request_id] = content
        end
      end
    rescue TranscriptParser::TranscriptParseError => e
      log "Failed to parse transcript file: #{e.message}", level: :error
      return []
    rescue StandardError => e
      log "Unexpected error parsing transcript: #{e.message}", level: :error
      return []
    end

    # Convert to array (newest first)
    request_groups.values.reverse
  end

  def extract_responses_from_transcript
    request_groups = {}

    begin
      # Use defensive parser to handle variable content formats
      parsed_entries = TranscriptParser.parse_transcript_file(transcript_path, strict: false)

      parsed_entries.each do |entry|
        # Skip non-assistant messages and parse errors
        next unless entry.dig(:message, :role) == 'assistant'
        next if entry[:parse_error]

        request_id = entry[:request_id]
        content = entry.dig(:message, :content) || ''

        # Group by request ID to handle multi-part responses
        if request_groups[request_id]
          request_groups[request_id] += "\n#{content}" if content && !content.empty?
        else
          request_groups[request_id] = content
        end
      end
    rescue TranscriptParser::TranscriptParseError => e
      log "Failed to parse transcript file: #{e.message}", level: :error
      return []
    rescue StandardError => e
      log "Unexpected error parsing transcript: #{e.message}", level: :error
      return []
    end

    # Convert to array (newest first)
    request_groups.values.reverse
  end

  def generate_preview(text)
    return '<empty>' if text.nil? || text.strip.empty?

    # Get first non-empty line, truncate if too long
    preview = text.lines.find { |line| !line.strip.empty? }&.strip || text.strip
    preview = "#{preview[0..59]}..." if preview.length > 60
    preview
  end

  def copy_to_clipboard(text)
    require 'open3'

    case RbConfig::CONFIG['host_os']
    when /darwin/
      Open3.popen3('pbcopy') { |stdin, _stdout, _stderr, _thread| stdin.write(text) }
    when /linux/
      if system('which xclip >/dev/null 2>&1')
        Open3.popen3('xclip', '-selection', 'clipboard') { |stdin, _stdout, _stderr, _thread| stdin.write(text) }
      else
        log 'xclip not found - clipboard copy failed', level: :error
        raise 'xclip not available'
      end
    when /mswin|mingw|cygwin/
      # Windows - write to temp file then use PowerShell
      require 'tempfile'
      temp_file = Tempfile.new('claude_copy')
      temp_file.write("\xEF\xBB\xBF#{text}") # UTF-8 BOM
      temp_file.close
      system("powershell.exe -Command \"Get-Content -Path '#{temp_file.path}' -Encoding UTF8 | Set-Clipboard\"")
      temp_file.unlink
    else
      log 'Unsupported platform for clipboard operations', level: :error
      raise 'Unsupported platform'
    end

    log "Copied #{text.length} characters to clipboard"
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(CopyMessageHandler) do |input_data|
    input_data['prompt'] = '/sc-copy-prompt 1'
    input_data['session_id'] = 'test-session-01'
  end
end
