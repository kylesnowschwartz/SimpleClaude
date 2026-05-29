#!/usr/bin/env ruby
# frozen_string_literal: true

# PreToolUse Entrypoint
#
# Orchestrates PreToolUse handlers before a tool runs. Reads JSON from STDIN,
# runs each handler, merges their outputs (most restrictive permission wins),
# and returns the result to Claude Code via STDOUT.

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require 'json'

require_relative '../handlers/github_url_handler'

begin
  input_data = JSON.parse($stdin.read)

  github_url_handler = GitHubUrlHandler.new(input_data)
  github_url_handler.call

  merged_output = ClaudeHooks::Output::PreToolUse.merge(
    github_url_handler.output
  )

  merged_output.output_and_exit
rescue JSON::ParserError => e
  warn "[PreToolUse] JSON parsing error: #{e.message}"
  warn JSON.generate({ continue: true, suppressOutput: false })
  exit 1
rescue StandardError => e
  warn "[PreToolUse] Hook execution error: #{e.message}"
  warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']
  warn JSON.generate({ continue: true, suppressOutput: false })
  exit 1
end
