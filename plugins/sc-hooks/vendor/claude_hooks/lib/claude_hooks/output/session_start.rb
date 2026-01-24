# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  module Output
    class SessionStart < Base
      # === CONTEXT ACCESSORS ===

      def additional_context
        hook_specific_output['additionalContext'] || ''
      end

      # === EXIT CODE LOGIC ===

      def exit_code
        default_exit_code
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
          context = output_data.dig('hookSpecificOutput', 'additionalContext')
          contexts << context if context && !context.empty?
        end

        # Set merged additional context
        unless contexts.empty?
          merged_data['hookSpecificOutput'] = {
            'hookEventName' => 'SessionStart',
            'additionalContext' => contexts.join("\n\n")
          }
        end

        new(merged_data)
      end
    end
  end
end
