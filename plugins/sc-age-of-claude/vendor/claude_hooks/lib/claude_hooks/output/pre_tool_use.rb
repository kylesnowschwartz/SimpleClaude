# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  module Output
    class PreToolUse < Base
      # === PERMISSION DECISION ACCESSORS ===

      def permission_decision
        hook_specific_output['permissionDecision']
      end

      def permission_reason
        hook_specific_output['permissionDecisionReason'] || ''
      end

      # === SEMANTIC HELPERS ===

      def allowed?
        permission_decision == 'allow'
      end

      def denied?
        permission_decision == 'deny'
      end
      alias blocked? denied?

      def should_ask_permission?
        permission_decision == 'ask'
      end

      # === EXIT CODE LOGIC ===
      #
      # PreToolUse hooks use the advanced JSON API with exit code 0.
      # Per Anthropic guidance: when using structured JSON with permissionDecision,
      # always output to stdout with exit 0 (not stderr with exit 2).
      # The permissionDecision field ('allow', 'deny', 'ask') controls behavior.
      # Reference: https://github.com/anthropics/claude-code/issues/10875
      def exit_code
        0
      end

      # === OUTPUT STREAM LOGIC ===
      #
      # PreToolUse hooks always output to stdout when using the JSON API.
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

        # PreToolUse specific merge: deny > ask > allow (most restrictive wins)
        permission_decision = 'allow'
        permission_reasons = []

        compacted_outputs.each do |output|
          output_data = output.respond_to?(:data) ? output.data : output

          next unless output_data.dig('hookSpecificOutput', 'permissionDecision')

          current_decision = output_data['hookSpecificOutput']['permissionDecision']
          case current_decision
          when 'deny'
            permission_decision = 'deny'
          when 'ask'
            permission_decision = 'ask' unless permission_decision == 'deny'
          end

          reason = output_data.dig('hookSpecificOutput', 'permissionDecisionReason')
          permission_reasons << reason if reason && !reason.empty?
        end

        merged_data['hookSpecificOutput'] ||= { 'hookEventName' => 'PreToolUse' }
        merged_data['hookSpecificOutput']['permissionDecision'] = permission_decision
        merged_data['hookSpecificOutput']['permissionDecisionReason'] = if permission_reasons.any?
                                                                          permission_reasons.join('; ')
                                                                        else
                                                                          ''
                                                                        end

        new(merged_data)
      end
    end
  end
end
