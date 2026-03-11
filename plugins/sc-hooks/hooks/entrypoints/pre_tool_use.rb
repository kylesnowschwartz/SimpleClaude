#!/usr/bin/env ruby
# frozen_string_literal: true

# PreToolUse Entrypoint
#
# Orchestrates all PreToolUse handlers when Claude is about to use a tool.
# Reads JSON input from STDIN, executes handlers, merges outputs, and returns
# the result to Claude Code via STDOUT.
#
# Merge semantics: deny > ask > allow (most restrictive wins).

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require 'json'

# Require all PreToolUse handler classes
require_relative '../handlers/long_running_process_guard'
require_relative '../handlers/plan_review_handler'

begin
  input_data = JSON.parse($stdin.read)

  handlers = [
    LongRunningProcessGuard,
    PlanReviewHandler
  ]

  outputs = handlers.map do |handler_class|
    handler = handler_class.new(input_data)
    handler.call
    handler.output
  end

  merged = ClaudeHooks::Output::PreToolUse.merge(*outputs)
  merged.output_and_exit
rescue JSON::ParserError => e
  warn "[PreToolUse] JSON parsing error: #{e.message}"
  # Fail open — don't block tools on hook infrastructure errors
  puts JSON.generate({
                       'hookSpecificOutput' => {
                         'hookEventName' => 'PreToolUse',
                         'permissionDecision' => 'allow',
                         'permissionDecisionReason' => "Hook error: #{e.message}"
                       }
                     })
  exit 0
rescue StandardError => e
  warn "[PreToolUse] Hook execution error: #{e.message}"
  warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']
  # Fail open
  puts JSON.generate({
                       'hookSpecificOutput' => {
                         'hookEventName' => 'PreToolUse',
                         'permissionDecision' => 'allow',
                         'permissionDecisionReason' => "Hook error: #{e.message}"
                       }
                     })
  exit 0
end
