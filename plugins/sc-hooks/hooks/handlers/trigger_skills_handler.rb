#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../../vendor/claude_hooks/lib/claude_hooks'
require 'json'
require 'yaml'

# TriggerSkillsHandler
#
# PURPOSE: Detect when user prompts match skill descriptions and suggest loading them
# TRIGGERS: Every user prompt submission
#
# Uses algorithmic matching with weighted trigger phrases, stemming, and caching
# to efficiently suggest relevant skills based on user prompts.

class TriggerSkillsHandler < ClaudeHooks::UserPromptSubmit
  SKILL_LOCATIONS = [
    File.expand_path('~/.claude/skills'),
    File.expand_path('~/.claude/plugins')
  ].freeze

  # Minimum score to suggest a skill
  # Exact phrase match with weight 1.5 = 15 points
  # 2-word overlap on quoted trigger = 2 * 3 * 1.5 = 9 points
  # Set to 8 to catch strong partial matches while filtering noise
  MIN_MATCH_SCORE = 8

  # Cache TTL in seconds
  CACHE_TTL = 300

  # Class-level cache for discovered skills
  @@skill_cache = nil
  @@cache_time = nil

  def call
    prompt_text = current_prompt.to_s.downcase.strip
    return if prompt_text.empty?
    return if prompt_text.length < 10 # Skip very short prompts

    # Skip if prompt is already invoking a skill
    return if prompt_text.start_with?('skill:', '/')

    log "Scanning for skill matches: #{prompt_text[0..50]}..."

    skills = discover_skills
    matches = find_matching_skills(prompt_text, skills)

    if matches.any?
      suggestion = build_suggestion(matches)
      add_additional_context!(suggestion)
      log "Suggested #{matches.length} skill(s): #{matches.map { |m| m[:name] }.join(', ')}"
    end

    output
  end

  private

  def discover_skills
    # Return cached skills if still valid
    if @@skill_cache && @@cache_time && (Time.now - @@cache_time < CACHE_TTL)
      return @@skill_cache
    end

    skills = []

    SKILL_LOCATIONS.each do |base_path|
      next unless Dir.exist?(base_path)

      # Find all SKILL.md files (case-insensitive)
      Dir.glob(File.join(base_path, '**', '{SKILL,skill}.md')).each do |skill_file|
        skill = parse_skill_file(skill_file)
        skills << skill if skill
      end
    end

    # Update cache
    @@skill_cache = skills
    @@cache_time = Time.now

    skills
  end

  def parse_skill_file(path)
    content = File.read(path)

    # Extract YAML frontmatter
    if content =~ /\A---\s*\n(.*?)\n---/m
      frontmatter = Regexp.last_match(1)
      begin
        metadata = YAML.safe_load(frontmatter, permitted_classes: [Symbol])
        return nil unless metadata.is_a?(Hash)

        name = metadata['name']
        description = metadata['description']

        return nil unless name && description

        # Extract trigger phrases from description
        triggers = extract_triggers(description)

        {
          name: name,
          description: description,
          triggers: triggers,
          path: path,
          location: determine_location(path)
        }
      rescue Psych::SyntaxError => e
        log "YAML parse error in #{path}: #{e.message}", level: :warn
        nil
      end
    end
  end

  def extract_triggers(description)
    triggers = []

    # Quoted phrases - highest quality triggers (weight: 1.5)
    description.scan(/"([^"]+)"/).flatten.each do |phrase|
      triggers << { phrase: phrase.downcase, weight: 1.5, type: :quoted }
    end

    # "Use when" / "should be used when" patterns (weight: 1.2)
    description.scan(/(?:use|used)\s+when\s+(?:the\s+)?(?:user\s+)?(?:asks?\s+to\s+|wants?\s+to\s+|needs?\s+to\s+)?([^,.]+)/i).flatten.each do |match|
      triggers << { phrase: match.downcase.strip, weight: 1.2, type: :action }
    end

    # "for X" patterns with action verbs (weight: 1.0)
    description.scan(/for\s+((?:extracting|parsing|creating|building|searching|editing|analyzing|converting|generating|managing|working with)[^,.]+)/i).flatten.each do |match|
      triggers << { phrase: match.downcase.strip, weight: 1.0, type: :action }
    end

    # Descriptions starting with action verbs (weight: 1.0)
    # e.g., "Extract specific fields from YAML" -> "extract specific fields from yaml"
    description.scan(/^((?:extract|parse|create|build|search|edit|analyze|convert|generate|manage|work with)[^,.]+)/i).flatten.each do |match|
      triggers << { phrase: match.downcase.strip, weight: 1.0, type: :action }
    end

    # Legacy patterns for compatibility (weight: 1.0)
    legacy_patterns = [
      /(?:when|if).*?(?:asks? to|wants? to|needs? to)\s+["']?([^"',]+)["']?/i
    ]

    legacy_patterns.each do |pattern|
      description.scan(pattern).flatten.each do |match|
        # Skip if already captured as quoted
        phrase = match.downcase.strip
        next if triggers.any? { |t| t[:phrase] == phrase }

        triggers << { phrase: phrase, weight: 1.0, type: :legacy }
      end
    end

    # Deduplicate by phrase, keeping highest weight
    triggers.group_by { |t| t[:phrase] }
            .map { |_phrase, group| group.max_by { |t| t[:weight] } }
  end

  def determine_location(path)
    if path.include?('/.claude/skills/')
      'user'
    else
      # Extract plugin name from path
      if path =~ %r{/plugins/(?:marketplaces/[^/]+/)?([^/]+)/}
        "plugin:#{Regexp.last_match(1)}"
      else
        'plugin'
      end
    end
  end

  def find_matching_skills(prompt, skills)
    prompt_words = tokenize(prompt)

    matches = skills.filter_map do |skill|
      score = calculate_match_score(prompt_words, prompt, skill)
      next if score < MIN_MATCH_SCORE

      skill.merge(score: score)
    end

    # Sort by score, highest first
    sorted = matches.sort_by { |m| -m[:score] }

    # Deduplicate by name, keeping highest-scoring instance
    seen_names = {}
    deduped = sorted.reject do |m|
      name = m[:name].downcase
      if seen_names[name]
        true # Skip duplicate
      else
        seen_names[name] = true
        false # Keep first (highest-scoring) instance
      end
    end

    deduped.first(3) # Max 3 suggestions
  end

  def tokenize(text, apply_stemming: true)
    # Remove common stop words and tokenize
    stop_words = %w[a an the is are was were be been being have has had do does did
                    will would could should may might must shall can to of in for on
                    with at by from as into through during before after above below
                    between under again further then once here there when where why
                    how all each few more most other some such no nor not only own
                    same so than too very just also now i me my we our you your it
                    its this that these those and but or if because until while
                    use using skill when user asks wants needs help me please]

    words = text.downcase
                .gsub(/[^a-z0-9\s]/, ' ')
                .split
                .reject { |w| stop_words.include?(w) || w.length < 3 }
                .uniq

    apply_stemming ? words.map { |w| stem(w) } : words
  end

  # Simple Porter-style stemming for common suffixes
  def stem(word)
    return word if word.length < 4

    # Common suffixes in order of length (longer first)
    word.sub(/(ation|tion|ing|ment|ness|able|ible|ful|less|ous|ive|ed|er|est|ly|s)$/, '')
        .then { |w| w.length >= 3 ? w : word } # Don't over-stem
  end

  def calculate_match_score(prompt_words, full_prompt, skill)
    score = 0

    # Check weighted trigger phrase matches
    skill[:triggers].each do |trigger|
      phrase = trigger[:phrase]
      weight = trigger[:weight]

      if full_prompt.include?(phrase)
        # Exact phrase match - high score, scaled by weight
        score += 10 * weight
      else
        # Partial word overlap - use stemmed comparison
        trigger_words = tokenize(phrase)
        overlap = (prompt_words & trigger_words).length

        if overlap > 0
          # Scale by weight and overlap count
          base_score = trigger[:type] == :quoted ? 3 : 2
          score += overlap * base_score * weight
        end
      end
    end

    # Check description word overlap (lower weight to avoid false positives)
    desc_words = tokenize(skill[:description])
    overlap = (prompt_words & desc_words).length
    score += overlap * 0.3

    score
  end

  def build_suggestion(matches)
    if matches.length == 1
      match = matches.first
      <<~SUGGESTION
        Skill suggestion: The user's request may benefit from the "#{match[:name]}" skill.

        Skill: #{match[:name]} (#{match[:location]})
        Description: #{match[:description]}

        Consider using: skill: "#{match[:name]}"
      SUGGESTION
    else
      lines = ["Multiple skills may be relevant to this request:\n"]
      matches.each do |match|
        lines << "- #{match[:name]} (#{match[:location]}): #{match[:description][0..100]}..."
      end
      lines << "\nConsider loading one with: skill: \"<name>\""
      lines.join("\n")
    end
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(TriggerSkillsHandler) do |input_data|
    # Only set defaults if not already present from stdin
    input_data['prompt'] ||= ARGV[0] || 'help me parse some PDF documents'
    input_data['session_id'] ||= 'test-session-01'
  end
end
