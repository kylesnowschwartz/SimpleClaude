# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  class PermissionRequest < Base
    def self.hook_type
      'PermissionRequest'
    end

    def self.input_fields
      %w[tool_name tool_input tool_use_id]
    end

    # === INPUT DATA ACCESS ===

    def tool_name
      @input_data['tool_name']
    end

    def tool_input
      @input_data['tool_input']
    end

    def tool_use_id
      @input_data['tool_use_id'] || @input_data['toolUseId']
    end

    # === OUTPUT DATA HELPERS ===

    def allow_permission!(reason = '')
      @output_data['hookSpecificOutput'] = {
        'hookEventName' => hook_event_name,
        'permissionDecision' => 'allow',
        'permissionDecisionReason' => reason
      }
    end

    def deny_permission!(reason = '')
      @output_data['hookSpecificOutput'] = {
        'hookEventName' => hook_event_name,
        'permissionDecision' => 'deny',
        'permissionDecisionReason' => reason
      }
    end

    def update_input_and_allow!(updated_input, reason = '')
      @output_data['hookSpecificOutput'] = {
        'hookEventName' => hook_event_name,
        'permissionDecision' => 'allow',
        'permissionDecisionReason' => reason,
        'updatedInput' => updated_input
      }
    end
  end
end
