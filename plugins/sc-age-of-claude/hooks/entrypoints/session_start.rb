#!/usr/bin/env ruby
# frozen_string_literal: true

# Age of Claude - SessionStart entrypoint
# Plays startup sound when Claude Code session begins

# Add shared vendor to load path for claude_hooks gem
vendor_path = File.expand_path('../../vendor/claude_hooks/lib', __dir__)
$LOAD_PATH.unshift(vendor_path) unless $LOAD_PATH.include?(vendor_path)

require 'claude_hooks'
require 'json'
require_relative '../handlers/session_start_handler'

begin
  input_data = JSON.parse($stdin.read)
  handler = AgeOfClaudeSessionStartHandler.new(input_data)
  handler.call
  handler.output_and_exit
rescue JSON::ParserError => e
  warn "[Age of Claude SessionStart] JSON parsing error: #{e.message}"
  exit 1
rescue StandardError => e
  warn "[Age of Claude SessionStart] Error: #{e.message}"
  warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']
  exit 1
end
