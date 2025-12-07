#!/usr/bin/env ruby
# frozen_string_literal: true

# Age of Claude - Stop entrypoint
# Plays completion sound when Claude finishes responding

# Add sc-hooks vendor to load path for claude_hooks gem
sc_hooks_vendor = File.expand_path('../../../../sc-hooks/vendor/claude_hooks/lib', __dir__)
$LOAD_PATH.unshift(sc_hooks_vendor) unless $LOAD_PATH.include?(sc_hooks_vendor)

require 'claude_hooks'
require 'json'
require_relative '../handlers/stop_handler'

begin
  input_data = JSON.parse($stdin.read)
  handler = AgeOfClaudeStopHandler.new(input_data)
  handler.call
  handler.output_and_exit
rescue JSON::ParserError => e
  warn "[Age of Claude Stop] JSON parsing error: #{e.message}"
  exit 1
rescue StandardError => e
  warn "[Age of Claude Stop] Error: #{e.message}"
  warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']
  exit 1
end
