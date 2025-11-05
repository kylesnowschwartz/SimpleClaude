#!/usr/bin/env ruby
# frozen_string_literal: true

require 'json'
require 'fileutils'

# Test Harness for Reflexive Agreement Detection
#
# Analyzes backup conversation transcripts to measure accuracy of detection algorithm

class ReflexiveAgreementTester
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
    /\b(here's why|the reason|specifically|for example|need to|will|should|must)\b/i,  # Removed "let me"
    /```|`[^`]+`/,
    /\b(analyze|consider|examine|investigate|review|explore)\b/i
  ].freeze

  def initialize(backup_dir)
    @backup_dir = backup_dir
    @results = {
      total_messages: 0,
      total_with_agreement_pattern: 0,
      would_trigger: 0,
      skipped_tool_use: 0,
      skipped_pivot: 0,
      skipped_substantive: 0,
      examples: {
        would_trigger: [],
        skipped_tool_use: [],
        skipped_pivot: [],
        skipped_substantive: []
      }
    }
  end

  def run(limit: nil, sample: false)
    transcript_files = find_transcript_files

    if sample
      # Sample 100 random files for quick testing
      transcript_files = transcript_files.sample(100)
      puts "Sampling 100 random transcripts for quick analysis"
    elsif limit
      transcript_files = transcript_files.first(limit)
      puts "Limiting analysis to #{limit} transcripts"
    end

    puts "Analyzing #{transcript_files.size} transcript files..."
    puts "-" * 80

    transcript_files.each_with_index do |file, idx|
      analyze_transcript(file)

      if (idx + 1) % 100 == 0
        puts "Processed #{idx + 1}/#{transcript_files.size} files..."
      end
    end

    print_results
  end

  private

  def find_transcript_files
    Dir.glob(File.join(@backup_dir, '**', '*.jsonl')).sort
  end

  def analyze_transcript(file)
    File.readlines(file).each do |line|
      next unless line.include?('"role":"assistant"')

      begin
        item = JSON.parse(line.strip)
        next unless item['type'] == 'assistant'

        analyze_message(item, file)
      rescue JSON::ParserError
        next
      end
    end
  rescue => e
    puts "Error reading #{file}: #{e.message}"
  end

  def analyze_message(message, file)
    @results[:total_messages] += 1

    text = message.dig('message', 'content', 0, 'text')
    return unless text.is_a?(String)

    # STEP 1: Check if first sentence contains agreement
    first_sentence = extract_first_sentence(text)
    return unless first_sentence_has_agreement?(first_sentence)

    @results[:total_with_agreement_pattern] += 1

    # STEP 2: Check if response contains tool use
    if message_contains_tool_use?(message)
      @results[:skipped_tool_use] += 1
      save_example(:skipped_tool_use, text, first_sentence, file, 'Contains tool use')
      return
    end

    # STEP 3: Check for pivot and substantive content
    has_pivot = first_sentence_has_pivot?(first_sentence)
    has_substantive = followed_by_substantive_content?(text)

    # Pivot words only matter if backed by substantive follow-up
    if has_pivot && has_substantive
      @results[:skipped_pivot] += 1
      save_example(:skipped_pivot, text, first_sentence, file, 'Contains pivot word with substantive follow-up')
      return
    end

    # Substantive content without pivot = still not reflexive
    if has_substantive
      @results[:skipped_substantive] += 1
      save_example(:skipped_substantive, text, first_sentence, file, 'Contains substantive markers')
      return
    end

    # At this point: has_pivot might be true, but no substantive follow-up
    # This is now treated as reflexive (will trigger)

    # Would trigger!
    @results[:would_trigger] += 1
    save_example(:would_trigger, text, first_sentence, file, 'WOULD TRIGGER')
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

  def save_example(category, full_text, first_sentence, file, reason)
    # Save ALL examples for review
    @results[:examples][category] << {
      first_sentence: first_sentence,
      full_text: full_text[0, 500],  # Show more context (500 chars)
      file: File.basename(file),
      reason: reason
    }
  end

  def print_results
    puts "\n"
    puts "=" * 80
    puts "REFLEXIVE AGREEMENT DETECTION TEST RESULTS"
    puts "=" * 80
    puts

    puts "Total assistant messages analyzed: #{@results[:total_messages]}"
    puts "Messages with agreement pattern in first sentence: #{@results[:total_with_agreement_pattern]}"
    puts

    if @results[:total_with_agreement_pattern] > 0
      puts "BREAKDOWN OF AGREEMENT MESSAGES:"
      puts "-" * 80

      trigger_pct = (@results[:would_trigger].to_f / @results[:total_with_agreement_pattern] * 100).round(1)
      tool_pct = (@results[:skipped_tool_use].to_f / @results[:total_with_agreement_pattern] * 100).round(1)
      pivot_pct = (@results[:skipped_pivot].to_f / @results[:total_with_agreement_pattern] * 100).round(1)
      subst_pct = (@results[:skipped_substantive].to_f / @results[:total_with_agreement_pattern] * 100).round(1)

      puts "  WOULD TRIGGER (reflexive agreement):  #{@results[:would_trigger].to_s.rjust(6)} (#{trigger_pct}%)"
      puts "  Skipped - Tool use:                    #{@results[:skipped_tool_use].to_s.rjust(6)} (#{tool_pct}%)"
      puts "  Skipped - Pivot word:                  #{@results[:skipped_pivot].to_s.rjust(6)} (#{pivot_pct}%)"
      puts "  Skipped - Substantive content:         #{@results[:skipped_substantive].to_s.rjust(6)} (#{subst_pct}%)"
      puts

      trigger_rate = (@results[:would_trigger].to_f / @results[:total_messages] * 100).round(3)
      puts "Overall trigger rate: #{@results[:would_trigger]} / #{@results[:total_messages]} = #{trigger_rate}%"
      puts
    end

    print_examples
  end

  def print_examples
    puts "=" * 80
    puts "ALL EXAMPLES (for review)"
    puts "=" * 80

    # Print each category with ALL examples
    [:would_trigger, :skipped_tool_use, :skipped_pivot, :skipped_substantive].each do |category|
      examples = @results[:examples][category]
      next if examples.empty?

      puts
      puts "#{category.to_s.upcase.gsub('_', ' ')} (#{examples.size} total)"
      puts "-" * 80

      examples.each_with_index do |ex, idx|
        puts
        puts "#{idx + 1}. #{ex[:first_sentence]}"
        puts "   #{ex[:full_text]}#{ex[:full_text].length >= 500 ? '...' : ''}"
        puts "   [#{ex[:file]}]"
        puts
      end
    end
  end
end

# Run the tester
if __FILE__ == $PROGRAM_NAME
  backup_dir = ARGV[0] || '/Users/kyle/backups/claude/projects'

  unless Dir.exist?(backup_dir)
    puts "Error: Directory not found: #{backup_dir}"
    puts "Usage: #{$0} [backup_directory]"
    exit 1
  end

  puts "Reflexive Agreement Detection Test Harness"
  puts "Backup directory: #{backup_dir}"
  puts

  tester = ReflexiveAgreementTester.new(backup_dir)

  # Quick sample mode for initial testing
  if ARGV.include?('--sample')
    tester.run(sample: true)
  elsif ARGV.include?('--limit')
    limit_idx = ARGV.index('--limit')
    limit = ARGV[limit_idx + 1].to_i
    tester.run(limit: limit)
  else
    tester.run
  end
end
