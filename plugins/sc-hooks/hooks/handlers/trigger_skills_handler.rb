#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'

# TriggerSkillsHandler
#
# PURPOSE: Remind Claude to check <available_skills> for relevant skills
class TriggerSkillsHandler < ClaudeHooks::UserPromptSubmit
  def call
    prompt_text = current_prompt.to_s.strip

    # Skip if empty or already invoking a skill/command
    return if prompt_text.empty?
    return if prompt_text.match?(/^skill:\s*["']?[\w:-]+/i) # skill: "name" or skill: "plugin:name"
    return if prompt_text.match?(%r(^/[\w:-]+)) # /command or /plugin:command

    reminder = <<~CONTEXT
      SKILL CHECK (MANDATORY): Scan skill descriptions in <available_skills> for keyword matches against this request.
      If ANY match, INVOKE the Skill tool BEFORE responding.
    CONTEXT

    add_additional_context!(reminder)
    output
  end
end

# Testing support
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(TriggerSkillsHandler) do |input_data|
    input_data['prompt'] ||= ARGV[0] || 'help me build a landing page'
    input_data['session_id'] ||= 'test-session-01'
  end
end
