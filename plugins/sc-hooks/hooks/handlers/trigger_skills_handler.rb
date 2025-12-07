#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../../vendor/claude_hooks/lib/claude_hooks'

# TriggerSkillsHandler
#
# PURPOSE: Remind Claude to check <available_skills> for relevant skills
# TRIGGERS: Every user prompt submission
#
# No algorithmic matching - just nudge Claude to leverage its existing
# knowledge of available skills from the system prompt.

class TriggerSkillsHandler < ClaudeHooks::UserPromptSubmit
  def call
    prompt_text = current_prompt.to_s.strip

    # Skip if empty or already invoking a skill/command
    return if prompt_text.empty?
    return if prompt_text.match?(/^skill:\s*["']?[\w:-]+/i)  # skill: "name" or skill: "plugin:name"
    return if prompt_text.match?(/^\/[\w:-]+/)              # /command or /plugin:command

    reminder = <<~CONTEXT
      Consider: Does this request match any skill in <available_skills>?
      If a skill would help, invoke it with: skill: "skill-name"
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
