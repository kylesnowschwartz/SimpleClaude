#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'

# PatternReminderHandler
#
# PURPOSE: Inject a one-line reminder to consult .patterns/brief.json if it exists.
# TRIGGERS: Once at session start
#
# This is deliberately lightweight — just a pointer, not pattern content.
# The sc-patterns plugin writes the actual pattern files. This handler
# has no dependency on that plugin; it just checks for a file on disk.
class PatternReminderHandler < ClaudeHooks::SessionStart
  BRIEF_PATH = '.patterns/brief.json'

  def call
    brief_exists = File.exist?(File.join(cwd, BRIEF_PATH))

    if brief_exists
      add_additional_context!(reminder)
      log "Pattern brief found at #{BRIEF_PATH}"
    else
      log "No pattern brief at #{BRIEF_PATH} — skipping reminder"
    end

    allow_continue!
    suppress_output!
    output_data
  end

  private

  def reminder
    <<~CONTEXT
      <pattern-context>
        A .patterns/brief.json file exists in this project with detected codebase conventions.
        Before planning or implementing features, read .patterns/brief.json for established patterns to follow.
        Run /sc-patterns brief <task> for task-scoped pattern constraints.
      </pattern-context>
    CONTEXT
  end
end

# Testing support
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(PatternReminderHandler) do |input_data|
    input_data['session_id'] ||= 'test-session-01'
  end
end
