# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  class PostToolUse < Base
    def self.hook_type
      'PostToolUse'
    end

    def self.input_fields
      %w[tool_name tool_input tool_response tool_use_id]
    end

    # === INPUT DATA ACCESS ===

    def tool_name
      @input_data['tool_name']
    end

    def tool_input
      @input_data['tool_input']
    end

    def tool_response
      @input_data['tool_response']
    end

    def tool_use_id
      @input_data['tool_use_id'] || @input_data['toolUseId']
    end

    # === OUTPUT DATA HELPERS ===

    def block_tool!(reason = '')
      @output_data['decision'] = 'block'
      @output_data['reason'] = reason
    end

    def approve_tool!(_reason = '')
      @output_data['decision'] = nil
      @output_data['reason'] = nil
    end

    def add_additional_context!(context)
      @output_data['hookSpecificOutput'] = {
        'hookEventName' => hook_event_name,
        'additionalContext' => context
      }
    end
    alias add_context! add_additional_context!
  end
end
