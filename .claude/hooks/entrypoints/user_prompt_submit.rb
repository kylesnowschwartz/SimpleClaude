#!/usr/bin/env ruby
# frozen_string_literal: true

# UserPromptSubmit Entrypoint
#
# This entrypoint orchestrates all UserPromptSubmit handlers when Claude Code receives a user prompt.
# It reads JSON input from STDIN, executes all configured handlers, merges their outputs,
# and returns the final result to Claude Code via STDOUT.

require 'claude_hooks'
require 'json'

# Require all UserPromptSubmit handler classes
require_relative '../handlers/user_prompt_submit_handler'

# Add additional handler requires here as needed:
# require_relative '../handlers/user_prompt_submit/append_rules'
# require_relative '../handlers/user_prompt_submit/log_user_prompt'
# require_relative '../handlers/user_prompt_submit/validate_content'

begin
  # Read input data from Claude Code
  input_data = JSON.parse($stdin.read)

  # Execute all UserPromptSubmit handlers
  handlers = []
  results = []

  # Initialize and execute main handler
  user_prompt_handler = UserPromptSubmitHandler.new(input_data)
  user_prompt_result = user_prompt_handler.call
  results << user_prompt_result
  handlers << 'UserPromptSubmitHandler'

  # Add additional handlers here:
  # append_rules = AppendRulesHandler.new(input_data)
  # append_rules_result = append_rules.call
  # results << append_rules_result
  # handlers << 'AppendRulesHandler'

  # log_prompt = LogUserPromptHandler.new(input_data)
  # log_prompt_result = log_prompt.call
  # results << log_prompt_result
  # handlers << 'LogUserPromptHandler'

  # Merge all handler outputs using the UserPromptSubmit-specific merge logic
  # UserPromptSubmit uses "pessimistic" merging where any handler can block the prompt
  hook_output = ClaudeHooks::UserPromptSubmit.merge_outputs(*results)

  # Log successful execution
  warn "[UserPromptSubmit] Executed #{handlers.length} handlers: #{handlers.join(', ')}"

  # Output final merged result to Claude Code
  puts JSON.generate(hook_output)

  exit 0  # Success
rescue JSON::ParserError => e
  warn "[UserPromptSubmit] JSON parsing error: #{e.message}"
  puts JSON.generate({
                       continue: false,
                       decision: 'block',
                       reason: "UserPromptSubmit hook JSON parsing error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # JSON error
rescue StandardError => e
  warn "[UserPromptSubmit] Hook execution error: #{e.message}"
  warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']

  puts JSON.generate({
                       continue: false,
                       decision: 'block',
                       reason: "UserPromptSubmit hook execution error: #{e.message}",
                       suppressOutput: false
                     })
  exit 1  # General error
end
