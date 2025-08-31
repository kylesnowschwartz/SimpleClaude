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


  hook = UserPromptSubmitHandler.new(input_data)
  hook.call
  hook.output_and_exit
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
