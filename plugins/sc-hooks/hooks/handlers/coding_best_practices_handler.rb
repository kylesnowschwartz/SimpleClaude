#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'

# CodingBestPracticesHandler
#
# PURPOSE: Inject coding guidelines from Ousterhout and Boswell/Foucher
# TRIGGERS: Once at session start
class CodingBestPracticesHandler < ClaudeHooks::SessionStart
  def call
    add_additional_context!(best_practices)
    allow_continue!
    suppress_output!
    output_data
  end

  private

  def best_practices
    <<~CONTENT
      <coding-guidelines>

      <philosophy-of-software-design source="Ousterhout">
      Core: Complexity is the enemy. Good design minimizes cognitive load.

      <modules>
      Deep: Simple interface, powerful implementation. High benefit/cost.
      Shallow: Complex interface, trivial implementation. No abstraction value.
      Goal: Maximum functionality behind minimal interface.
      </modules>

      <programming-approach>
      Tactical: Quick fixes, "just make it work." Accumulates complexity.
      Strategic: Invest 10-20% extra time in good design upfront. Pays dividends.
      Working code isn't enough. Well-designed code is the goal.
      </programming-approach>

      <practices>
      Information hiding: Bury complexity behind simple interfaces.
      Pull complexity downward: Implementers work harder so users work less.
      Different layer, different abstraction: Each layer must transform or add value.
      Design it twice: First idea is rarely best.
      General-purpose > special-case: Fewer flexible methods > many specialized ones.
      Define errors out of existence: Design APIs so errors can't happen.
      </practices>

      <design-checks>
      Each layer adds meaningful abstraction
      Handle edge cases through API design, not proliferating special cases
      Return values for expected outcomes, exceptions for truly exceptional failures
      Comments explain WHY and intent, not WHAT code does
      Encapsulate state behind behavior
      </design-checks>

      Mantra: "Modules should be deep, interfaces simple, special cases eliminated."
      </philosophy-of-software-design>

      <art-of-readable-code source="Boswell/Foucher">
      Core: Minimize time for others to understand. Readability > cleverness.

      <naming>
      Be specific: retval -> seconds_since_request
      Encode units/types: delay_secs, unsafe_html, num_errors
      Concrete names: ServerCanStart() > CanListenOnPort()
      Attach details: max_threads > threads, plaintext_password > password
      Scope rule: Larger scope = longer name. Loop i is fine; class member needs context.
      </naming>

      <comments>
      Describe WHY and non-obvious consequences. Code shows WHAT.
      Record thought process: "Tried X, didn't work because Y"
      Mark known issues: TODO, FIXME, HACK, XXX
      Comment constants: Why this value?
      Big picture first, then details.
      </comments>

      <structure>
      Consistent style > "correct" style.
      Align similar code to show differences.
      Line breaks create paragraphs. Group related statements.
      Order: Important first, or logical flow.
      </structure>

      <control-flow>
      Prefer positive: if (is_valid) > if (!is_invalid)
      Changing value on left: if (length >= 10) > if (10 <= length)
      Early returns > deep nesting.
      Guard clauses > nested success paths.
      </control-flow>

      <variables>
      Eliminate intermediates that don't add clarity.
      Shrink scope: Define close to use.
      Prefer immutable: Write-once is easier to reason about.
      </variables>

      <decomposition>
      Extract functions for logical chunks, even if called once.
      One task per function. "and" in description = split it.
      Unrelated subproblems = separate functions.
      Interface must be obvious. Unclear usage = redesign.
      </decomposition>

      <quality-checks>
      Keep nesting shallow (2-3 levels max), flatten with early returns
      Keep functions focused and concise
      Minimize variable scope, define close to use
      Write obvious code that reads naturally
      Maintain consistent naming and formatting throughout
      </quality-checks>

      Key: Reader matters more than writer. Code is read 10x more than written.
      </art-of-readable-code>

      </coding-guidelines>
    CONTENT
  end
end

# Testing support
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(CodingBestPracticesHandler) do |input_data|
    input_data['session_id'] ||= 'test-session-01'
  end
end
