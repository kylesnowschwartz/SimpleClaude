# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  module Output
    class PermissionRequest < Base
      # === PERMISSION DECISION ACCESSORS ===

      def permission_decision
        hook_specific_output['permissionDecision']
      end

      def permission_reason
        hook_specific_output['permissionDecisionReason'] || ''
      end

      def updated_input
        hook_specific_output['updatedInput']
      end

      # === SEMANTIC HELPERS ===

      def allowed?
        permission_decision == 'allow'
      end

      def denied?
        permission_decision == 'deny'
      end

      def input_updated?
        !updated_input.nil?
      end

      # === EXIT CODE LOGIC ===
      #
      # PermissionRequest hooks use the advanced JSON API with exit code 0.
      # Following the same pattern as PreToolUse (permission-based hooks).
      def exit_code
        0
      end

      # === OUTPUT STREAM LOGIC ===
      #
      # PermissionRequest hooks always output to stdout when using the JSON API.
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

        # PermissionRequest specific merge: deny > allow (most restrictive wins)
        permission_decision = 'allow'
        permission_reasons = []
        updated_inputs = []

        compacted_outputs.each do |output|
          output_data = output.respond_to?(:data) ? output.data : output

          next unless output_data.dig('hookSpecificOutput', 'permissionDecision')

          current_decision = output_data['hookSpecificOutput']['permissionDecision']
          permission_decision = 'deny' if current_decision == 'deny'

          reason = output_data.dig('hookSpecificOutput', 'permissionDecisionReason')
          permission_reasons << reason if reason && !reason.empty?

          updated = output_data.dig('hookSpecificOutput', 'updatedInput')
          updated_inputs << updated if updated
        end

        merged_data['hookSpecificOutput'] ||= { 'hookEventName' => 'PermissionRequest' }
        merged_data['hookSpecificOutput']['permissionDecision'] = permission_decision
        merged_data['hookSpecificOutput']['permissionDecisionReason'] = if permission_reasons.any?
                                                                          permission_reasons.join('; ')
                                                                        else
                                                                          ''
                                                                        end
        # Last updated input wins
        merged_data['hookSpecificOutput']['updatedInput'] = updated_inputs.last if updated_inputs.any?

        new(merged_data)
      end
    end
  end
end
