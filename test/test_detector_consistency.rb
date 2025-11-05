#!/usr/bin/env ruby
# frozen_string_literal: true

require 'json'
require_relative '../plugins/sc-hooks/hooks/handlers/reflexive_agreement_detector'

# Simple test to verify the detector works consistently
class TestDetectorConsistency
  include ReflexiveAgreementDetector

  def test_reflexive_cases
    puts "Testing reflexive agreement detection..."
    puts "-" * 80

    test_cases = [
      {
        desc: "Pure reflexive agreement",
        message: build_message("You're right."),
        expected: true
      },
      {
        desc: "Agreement with tool use",
        message: build_message("You're right.", has_tools: true),
        expected: false
      },
      {
        desc: "Agreement with substantive follow-up",
        message: build_message("You're right. Let me analyze this further with specific technical reasoning about the performance implications."),
        expected: false
      },
      {
        desc: "Agreement with pivot but no substance",
        message: build_message("You're right, but we should move on."),
        expected: true
      },
      {
        desc: "Agreement with pivot and substance (multi-sentence)",
        message: build_message("You're right, but there's more to consider. Let me analyze the edge cases here specifically with technical reasoning."),
        expected: false
      },
      {
        desc: "No agreement pattern",
        message: build_message("Let me check that for you."),
        expected: false
      }
    ]

    passed = 0
    failed = 0

    test_cases.each do |test|
      result = reflexive_agreement?(test[:message])
      status = result == test[:expected] ? "✓ PASS" : "✗ FAIL"

      if result == test[:expected]
        passed += 1
      else
        failed += 1
      end

      puts "#{status}: #{test[:desc]}"
      puts "  Expected: #{test[:expected]}, Got: #{result}"
      puts
    end

    puts "-" * 80
    puts "Results: #{passed} passed, #{failed} failed"
    puts

    exit(failed > 0 ? 1 : 0)
  end

  private

  def build_message(text, has_tools: false)
    content = [{ 'type' => 'text', 'text' => text }]

    if has_tools
      content << { 'type' => 'tool_use', 'name' => 'Read' }
    end

    {
      'message' => {
        'content' => content
      }
    }
  end
end

# Run tests
if __FILE__ == $PROGRAM_NAME
  tester = TestDetectorConsistency.new
  tester.test_reflexive_cases
end
