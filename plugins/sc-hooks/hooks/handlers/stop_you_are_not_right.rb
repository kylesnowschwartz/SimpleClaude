#!/usr/bin/env ruby
# frozen_string_literal: true

require 'claude_hooks'
require 'json'

# Stop Hook for Real-Time Reflexive Agreement Correction
#
# PURPOSE: Detect reflexive agreement in Claude's just-completed response
# TRIGGERS: When Claude Code finishes generating a response
# ACTION: Force continuation with corrective instructions if reflexive agreement detected
#
# This hook provides immediate correction when Claude uses phrases like "you're right"
# or "absolutely correct", making Claude provide a more substantive follow-up response.

class StopYouAreNotRight < ClaudeHooks::Stop
  # Patterns that trigger real-time correction
  AGREEMENT_PATTERNS = [
    /.*[Yy]ou.*(right|correct)/,     # "You're right", "you are correct"
    /.*[Aa]bsolutely/                # "Absolutely"
  ].freeze

  def call
    log 'Checking if Claude just used reflexive agreement in response'

    if just_used_reflexive_agreement?
      log 'Detected reflexive agreement - forcing corrective continuation', level: :warn
      force_substantive_response!
    else
      log 'No reflexive agreement detected - allowing normal stop'
      allow_normal_stop!
    end

    output
  end

  private

  def just_used_reflexive_agreement?
    return false unless transcript_path

    # Get Claude's most recent message (the one that just completed)
    last_message = get_last_assistant_message

    return false unless last_message

    # Check first 80 characters for agreement patterns (matching original logic)
    text = last_message.dig('message', 'content', 0, 'text')
    return false unless text.is_a?(String)

    first_80_chars = text[0, 80]
    log "Checking just-completed response: '#{first_80_chars}'"

    pattern_match = AGREEMENT_PATTERNS.any? { |pattern| first_80_chars.match?(pattern) }
    log "Reflexive agreement detected: #{pattern_match}"

    pattern_match
  end

  def get_last_assistant_message
    return nil unless File.exist?(transcript_path)

    # Read transcript in reverse to find the most recent assistant message
    assistant_message = nil

    File.readlines(transcript_path).reverse_each do |line|
      next unless line.include?('"role":"assistant"')

      begin
        item = JSON.parse(line.strip)
        next unless item['type'] == 'assistant'
        next unless item.dig('message', 'content', 0, 'type') == 'text'

        assistant_message = item
        break # Found the most recent one
      rescue JSON::ParserError
        next
      end
    end

    assistant_message
  end

  def force_substantive_response!
    correction_instructions = <<~INSTRUCTIONS.strip
      I notice I just used a reflexive agreement phrase. Let me provide a more substantive response:

      Instead of simply agreeing, let me analyze your point with specific technical reasoning, consider potential edge cases or alternative approaches, and offer constructive insights that build collaboratively on your observation.
    INSTRUCTIONS

    # Force Claude to continue with corrective instructions
    continue_with_instructions!(correction_instructions)

    log 'Forced continuation with corrective instructions'
  end

  def allow_normal_stop!
    # Allow Claude to stop normally (default behavior)
    ensure_stopping!

    # Don't add any output to the transcript for normal stops
    suppress_output!
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(StopYouAreNotRight) do |input_data|
    input_data['session_id'] = 'stop-correction-test'
    input_data['stop_hook_active'] = false
  end
end
