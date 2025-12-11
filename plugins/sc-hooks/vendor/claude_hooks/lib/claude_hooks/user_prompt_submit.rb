# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  class UserPromptSubmit < Base
    def self.hook_type
      'UserPromptSubmit'
    end

    def self.input_fields
      %w[prompt]
    end

    # === INPUT DATA ACCESS ===

    def prompt
      @input_data['user_prompt'] || @input_data['prompt']
    end
    alias_method :user_prompt, :prompt
    alias_method :current_prompt, :prompt

    # === OUTPUT DATA HELPERS ===

    def add_additional_context!(context)
      @output_data['hookSpecificOutput'] = {
        'hookEventName' => hook_event_name,
        'additionalContext' => context
      }
    end
    alias_method :add_context!, :add_additional_context!

    def empty_additional_context!
      @output_data['hookSpecificOutput'] = nil
    end

    def block_prompt!(reason = '')
      @output_data['decision'] = 'block'
      @output_data['reason'] = reason
    end

    def unblock_prompt!
      @output_data['decision'] = nil
      @output_data['reason'] = nil
    end
  end
end
