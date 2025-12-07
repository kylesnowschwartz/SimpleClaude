#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require 'json'
require_relative '../lib/reflexive_agreement_detector'

# Stop Hook for Real-Time Reflexive Agreement Correction
#
# PURPOSE: Detect reflexive agreement in Claude's just-completed response
# TRIGGERS: When Claude Code finishes generating a response
# ACTION: Force continuation with corrective instructions if reflexive agreement detected
#
# DETECTION STRATEGY:
# Reflexive agreement = agreement phrase in first sentence WITHOUT research/substantive work
# - Checks first sentence for agreement patterns
# - Verifies no tool use in response (no Read, Grep, WebFetch, etc.)
# - Checks for substantive pivots or follow-up analysis

class StopYouAreNotRight < ClaudeHooks::Stop
  include ReflexiveAgreementDetector

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

    text = extract_text(last_message)
    return false unless text.is_a?(String)

    log "Analyzing response: '#{text[0, 100]}...'"

    # Use shared detection logic
    is_reflexive = reflexive_agreement?(last_message)

    if is_reflexive
      first_sentence = extract_first_sentence(text)
      log "Reflexive agreement detected: '#{first_sentence}'"
    else
      log 'Not reflexive agreement'
    end

    is_reflexive
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

        # Get full message including all content blocks
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
