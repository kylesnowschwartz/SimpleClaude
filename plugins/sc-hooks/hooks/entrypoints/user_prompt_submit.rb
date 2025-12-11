#!/usr/bin/env ruby
# frozen_string_literal: true

# UserPromptSubmit Entrypoint
#
# This entrypoint orchestrates all UserPromptSubmit handlers when Claude Code receives a user prompt.
# It reads JSON input from STDIN, executes all configured handlers, merges their outputs,
# and returns the final result to Claude Code via STDOUT.

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require 'json'

require_relative '../handlers/copy_message_handler'
require_relative '../handlers/trigger_skills_handler'

begin
  # Read input data from Claude Code
  input_data = JSON.parse($stdin.read)

  # Initialize all handlers
  copy_message_handler = CopyMessageHandler.new(input_data)
  trigger_skills_handler = TriggerSkillsHandler.new(input_data)

  # Execute handlers
  copy_message_handler.call
  trigger_skills_handler.call

  # Merge outputs from all handlers
  merged_output = ClaudeHooks::Output::UserPromptSubmit.merge(
    copy_message_handler.output,
    trigger_skills_handler.output
  )

  # Output result and exit with appropriate code
  merged_output.output_and_exit
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
