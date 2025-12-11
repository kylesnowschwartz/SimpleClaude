# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  module Output
    # Note: In Stop hooks, 'decision: block' actually means "force Claude to continue"
    # This is counterintuitive but matches Claude Code's expected behavior
    class Stop < Base
      # === DECISION ACCESSORS ===

      def decision
        @data['decision']
      end

      def reason
        @data['reason'] || ''
      end
      alias_method :continue_instructions, :reason

      # === SEMANTIC HELPERS ===

      # Check if Claude should be forced to continue (decision == 'block')
      # Note: 'block' in Stop hooks means "block the stopping", i.e., continue
      def should_continue?
        decision == 'block'
      end

      # Check if Claude should stop normally (decision != 'block')
      def should_stop?
        decision != 'block'
      end

      # === EXIT CODE LOGIC ===
      #
      # Stop hooks use the advanced JSON API with exit code 0.
      # Per Anthropic guidance: when using structured JSON with decision/reason fields,
      # always output to stdout with exit 0 (not stderr with exit 2).
      # Reference: https://github.com/anthropics/claude-code/issues/10875
      def exit_code
        0
      end

      # === OUTPUT STREAM LOGIC ===
      #
      # Stop hooks always output to stdout when using the JSON API.
      # This follows the same pattern as PreToolUse hooks.
      def output_stream
        :stdout
      end

      # === MERGE HELPER ===

      def self.merge(*outputs)
        compacted_outputs = outputs.compact
        return compacted_outputs.first if compacted_outputs.length == 1
        return super(*outputs) if compacted_outputs.empty?

        merged = super(*outputs)
        merged_data = merged.data

        # A blocking reason is actually a "continue instructions"
        blocking_reasons = []

        compacted_outputs.each do |output|
          output_data = output.respond_to?(:data) ? output.data : output

          # Handle decision - if any hook says 'block', respect that
          if output_data['decision'] == 'block'
            merged_data['decision'] = 'block'
            reason = output_data['reason']
            blocking_reasons << reason if reason && !reason.empty?
          end
        end

        # Combine all blocking reasons / continue instructions
        merged_data['reason'] = blocking_reasons.join('; ') unless blocking_reasons.empty?

        new(merged_data)
      end
    end
  end
end
