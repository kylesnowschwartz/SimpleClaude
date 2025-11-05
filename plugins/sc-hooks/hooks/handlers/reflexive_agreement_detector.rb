#!/usr/bin/env ruby
# frozen_string_literal: true

# Shared detection logic for reflexive agreement patterns
# Used by both the stop hook and test harness to ensure consistency
module ReflexiveAgreementDetector
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
    /\d+\s*(slots|tokens|ms|bytes|chars|seconds|lines)/i,
    /\b(here's why|the reason|specifically|for example|need to|will|should|must)\b/i,
    /```|`[^`]+`/,
    /\b(analyze|consider|examine|investigate|review|explore)\b/i
  ].freeze

  # Main detection method
  # Returns true if message is reflexive agreement (should trigger)
  def reflexive_agreement?(message)
    text = extract_text(message)
    return false unless text.is_a?(String)

    # STEP 1: Check if first sentence contains agreement
    first_sentence = extract_first_sentence(text)
    return false unless first_sentence_has_agreement?(first_sentence)

    # STEP 2: Check if response contains tool use
    return false if message_contains_tool_use?(message)

    # STEP 3: Check for pivot and substantive content
    has_pivot = first_sentence_has_pivot?(first_sentence)
    has_substantive = followed_by_substantive_content?(text)

    # Pivot words only matter if backed by substantive follow-up
    return false if has_pivot && has_substantive

    # Substantive content without pivot = still not reflexive
    return false if has_substantive

    # At this point: agreement detected, no tool use, no substantive follow-up
    true
  end

  private

  def extract_text(message)
    message.dig('message', 'content', 0, 'text')
  end

  def extract_first_sentence(text)
    sentences = text.split(/[.!?]+/)
    first = sentences[0] || ""
    first.strip
  end

  def first_sentence_has_agreement?(sentence)
    AGREEMENT_PATTERNS.any? { |pattern| sentence.match?(pattern) }
  end

  def message_contains_tool_use?(message)
    content = message.dig('message', 'content') || []
    content.any? { |block| block['type'] == 'tool_use' }
  end

  def first_sentence_has_pivot?(sentence)
    return true if sentence.match?(PIVOT_INDICATORS)
    return true if sentence.match?(/\b(need to|will|should|must|going to|have to)\b/i)
    return true if sentence.match?(/[:\u2014\u2013]\s*$/)
    false
  end

  def followed_by_substantive_content?(text)
    sentences = text.split(/[.!?]+/).map(&:strip).reject(&:empty?)
    return false if sentences.length <= 1

    rest_of_text = sentences[1..-1].join(' ')
    SUBSTANTIVE_MARKERS.any? { |marker| rest_of_text.match?(marker) }
  end
end
