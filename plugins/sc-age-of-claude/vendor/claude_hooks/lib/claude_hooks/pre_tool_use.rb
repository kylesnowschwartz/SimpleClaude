# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  class PreToolUse < Base
    def self.hook_type
      'PreToolUse'
    end

    def self.input_fields
      %w[tool_name tool_input]
    end

    # === INPUT DATA ACCESS ===

    def tool_name
      @input_data['tool_name']
    end

    def tool_input
      @input_data['tool_input']
    end

    # === OUTPUT DATA HELPERS ===

    def approve_tool!(reason = '')
      @output_data['hookSpecificOutput'] = {
        'hookEventName' => hook_event_name,
        'permissionDecision' => 'allow',
        'permissionDecisionReason' => reason
      }
    end

    def block_tool!(reason = '')
      @output_data['hookSpecificOutput'] = {
        'hookEventName' => hook_event_name,
        'permissionDecision' => 'deny',
        'permissionDecisionReason' => reason
      }
    end

    def ask_for_permission!(reason = '')
      @output_data['hookSpecificOutput'] = {
        'hookEventName' => hook_event_name,
        'permissionDecision' => 'ask',
        'permissionDecisionReason' => reason
      }
    end
  end
end
