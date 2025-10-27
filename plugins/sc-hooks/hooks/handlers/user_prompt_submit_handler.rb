#!/usr/bin/env ruby
# frozen_string_literal: true

require 'claude_hooks'

# UserPromptSubmit Handler
#
# PURPOSE: Modify, validate, or enhance user prompts before processing
# TRIGGERS: When user submits a prompt to Claude Code
#
# COMMON USE CASES:
# - Add context rules or project-specific instructions
# - Validate prompt content (block inappropriate requests)
# - Append relevant documentation or code examples
# - Transform or rewrite prompts for better results
# - Log user interactions for analytics
# - Apply prompt templates or formatting
#
# SETTINGS.JSON CONFIGURATION:
# {
#   "hooks": {
#     "UserPromptSubmit": [{
#       "matcher": "",
#       "hooks": [{
#         "type": "command",
#         "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/entrypoints/user_prompt_submit.rb"
#       }]
#     }]
#   }
# }

class UserPromptSubmitHandler < ClaudeHooks::UserPromptSubmit
  def call
    log "Processing user prompt: #{prompt[0..100]}..."

    # Example: Add project context
    # add_project_context

    # Example: Validate prompt content
    # validate_prompt_content

    # Example: Apply prompt transformations
    # transform_prompt

    # Example: Log the interaction
    # log_user_interaction

    output_data
  end

  private

  def add_project_context
    # Example: Add project-specific rules or context
    context_file = project_path_for('rules/project-context.md')

    return unless File.exist?(context_file)

    context = File.read(context_file)
    add_additional_context!(context)
    log "Added project context (#{context.length} characters)"
  end

  def validate_prompt_content
    # Example: Block prompts that contain sensitive patterns
    sensitive_patterns = [
      /api[_\s]?key/i,
      /password/i,
      /secret/i
    ]

    sensitive_patterns.each do |pattern|
      next unless prompt.match?(pattern)

      block_prompt!('Prompt may contain sensitive information')
      log "Blocked prompt containing sensitive pattern: #{pattern}", level: :warn
      return
    end
  end

  def transform_prompt
    # Example: Add helpful formatting or structure
    return unless prompt.downcase.include?('help me implement')

    add_additional_context!(
      'Please provide step-by-step implementation guidance and consider edge cases.'
    )
  end

  def log_user_interaction
    # Example: Log prompt for analytics (be careful with privacy)
    log "User prompt length: #{prompt.length} characters"
    log "Session: #{session_id}"
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(UserPromptSubmitHandler) do |input_data|
    input_data['prompt'] = 'Help me implement a new feature'
    input_data['session_id'] = 'test-session-01'
  end
end
