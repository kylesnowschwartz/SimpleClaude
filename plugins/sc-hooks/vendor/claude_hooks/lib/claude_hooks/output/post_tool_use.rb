# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  module Output
    class PostToolUse < Base
      # === DECISION ACCESSORS ===

      def decision
        @data['decision']
      end

      def reason
        @data['reason'] || ''
      end

      def additional_context
        hook_specific_output['additionalContext'] || ''
      end

      # === SEMANTIC HELPERS ===

      def blocked?
        decision == 'block'
      end

      # === EXIT CODE LOGIC ===
      #
      # PostToolUse hooks use the advanced JSON API with exit code 0.
      # Per Anthropic guidance: when using structured JSON with decision/reason fields,
      # always output to stdout with exit 0 (not stderr with exit 2).
      # Reference: https://github.com/anthropics/claude-code/issues/10875
      def exit_code
        0
      end

      # === OUTPUT STREAM LOGIC ===
      #
      # PostToolUse hooks always output to stdout when using the JSON API.
      def output_stream
        :stdout
      end

      # === MERGE HELPER ===

      def self.merge(*outputs)
        compacted_outputs = outputs.compact
        return compacted_outputs.first if compacted_outputs.length == 1
        return super if compacted_outputs.empty?

        merged = super
        merged_data = merged.data
        contexts = []

        compacted_outputs.each do |output|
          output_data = output.respond_to?(:data) ? output.data : output
          merged_data['decision'] = 'block' if output_data['decision'] == 'block'
          merged_data['reason'] = [merged_data['reason'], output_data['reason']].compact.reject(&:empty?).join('; ')

          context = output_data.dig('hookSpecificOutput', 'additionalContext')
          contexts << context if context && !context.empty?
        end

        unless contexts.empty?
          merged_data['hookSpecificOutput'] = {
            'hookEventName' => 'PostToolUse',
            'additionalContext' => contexts.join("\n\n")
          }
        end

        new(merged_data)
      end
    end
  end
end
