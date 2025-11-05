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
# DETECTION STRATEGY:
# Reflexive agreement = agreement phrase in first sentence WITHOUT research/substantive work
# - Checks first sentence for agreement patterns
# - Verifies no tool use in response (no Read, Grep, WebFetch, etc.)
# - Checks for substantive pivots or follow-up analysis

class StopYouAreNotRight < ClaudeHooks::Stop
  # Agreement patterns - match at start of first sentence
  AGREEMENT_PATTERNS = [
    /\A\s*[Yy]ou'?re?\s+(absolutely\s+)?(right|correct)/i,
    /\A\s*[Aa]bsolutely\.?\s*\Z/i,
    /\A\s*[Yy]es,?\s+you'?re?\s+(totally\s+)?correct/i,
    /\A\s*[Dd]efinitely\.?\s*\Z/i
  ].freeze

  # Pivot words that indicate substantive continuation
  PIVOT_INDICATORS = /\b(but|however|though|although|that said|except|yet)\b/i

  # Substantive content markers
  SUBSTANTIVE_MARKERS = [
    /\d+\s*(slots|tokens|ms|bytes|chars|seconds|lines)/i,     # Technical metrics
    /\b(here's why|the reason|specifically|for example|need to|will|should|must)\b/i,  # Analysis/action indicators (removed "let me")
    /```|`[^`]+`/,                                             # Code blocks
    /\b(analyze|consider|examine|investigate|review|explore)\b/i  # Action verbs
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

    # Extract text content
    text = last_message.dig('message', 'content', 0, 'text')
    return false unless text.is_a?(String)

    log "Analyzing response: '#{text[0, 100]}...'"

    # STEP 1: Check if first sentence contains agreement
    first_sentence = extract_first_sentence(text)
    unless first_sentence_has_agreement?(first_sentence)
      log "No agreement pattern in first sentence"
      return false
    end

    log "Agreement pattern detected in first sentence: '#{first_sentence}'"

    # STEP 2: Check if response contains tool use (research was done)
    if message_contains_tool_use?(last_message)
      log "Response contains tool use - agreement is informed, not reflexive"
      return false
    end

    # STEP 3: Check for pivot and substantive content
    has_pivot = first_sentence_has_pivot?(first_sentence)
    has_substantive = followed_by_substantive_content?(text)

    # Pivot words only matter if backed by substantive follow-up
    # "You're right, but..." + actual analysis = skip
    # "You're right, but..." + nothing substantial = still reflexive
    if has_pivot && has_substantive
      log "First sentence has pivot with substantive follow-up - not reflexive"
      return false
    end

    # Substantive content without pivot = still not reflexive
    if has_substantive
      log "Response contains substantive follow-up content - not reflexive"
      return false
    end

    # At this point: has_pivot might be true, but no substantive follow-up
    if has_pivot && !has_substantive
      log "Pivot word present but no substantive follow-up - treating as reflexive"
    end

    log "All checks passed - response is reflexive agreement"
    true
  end

  def extract_first_sentence(text)
    # Split on sentence boundaries (., !, ?)
    sentences = text.split(/[.!?]+/)
    first = sentences[0] || ""
    first.strip
  end

  def first_sentence_has_agreement?(sentence)
    AGREEMENT_PATTERNS.any? { |pattern| sentence.match?(pattern) }
  end

  def message_contains_tool_use?(message)
    # Check if message content includes tool_use blocks
    content = message.dig('message', 'content') || []
    has_tools = content.any? { |block| block['type'] == 'tool_use' }

    if has_tools
      tool_names = content
        .select { |block| block['type'] == 'tool_use' }
        .map { |block| block['name'] }
        .join(', ')
      log "Tools used in response: #{tool_names}"
    end

    has_tools
  end

  def first_sentence_has_pivot?(sentence)
    # Check if first sentence contains pivot words
    # "You're right, but..." or "You're right; however..."
    return true if sentence.match?(PIVOT_INDICATORS)

    # Check for action indicators in first sentence
    # "You're right - need to..." or "You're right - will..."
    return true if sentence.match?(/\b(need to|will|should|must|going to|have to)\b/i)

    # Check for continuation markers (colon, em-dash)
    # "You're right:" or "You're right —"
    return true if sentence.match?(/[:\u2014\u2013]\s*$/)

    false
  end

  def followed_by_substantive_content?(text)
    # Split into sentences and check everything after first sentence
    sentences = text.split(/[.!?]+/).map(&:strip).reject(&:empty?)

    if sentences.length <= 1
      log "Only one sentence - no substantive follow-up"
      return false
    end

    # Join remaining sentences
    rest_of_text = sentences[1..-1].join(' ')

    # Check for substantive markers
    has_substantive = SUBSTANTIVE_MARKERS.any? { |marker| rest_of_text.match?(marker) }

    if has_substantive
      log "Substantive content found in follow-up sentences"
    else
      log "No substantive markers in follow-up"
    end

    has_substantive
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
