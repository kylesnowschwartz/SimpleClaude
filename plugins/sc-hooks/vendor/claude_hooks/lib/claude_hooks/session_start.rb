# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  class SessionStart < Base
    def self.hook_type
      'SessionStart'
    end

    def self.input_fields
      %w[source]
    end

    # === INPUT DATA ACCESS ===

    def source
      @input_data['source']
    end

    # === OUTPUT DATA HELPERS ===

    def add_additional_context!(context)
      @output_data['hookSpecificOutput'] = {
        'hookEventName' => hook_event_name,
        'additionalContext' => context
      }
    end
    alias add_context! add_additional_context!

    def empty_additional_context!
      @output_data['hookSpecificOutput'] = nil
    end
  end
end
