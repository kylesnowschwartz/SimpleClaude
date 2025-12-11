# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  class SessionEnd < Base
    def self.hook_type
      'SessionEnd'
    end

    def self.input_fields
      %w[reason]
    end

    # === INPUT DATA ACCESS ===

    def reason
      @input_data['reason']
    end

    # === REASON HELPERS ===

    # Check if session was cleared with /clear command
    def cleared?
      reason == 'clear'
    end

    # Check if user logged out
    def logout?
      reason == 'logout'
    end

    # Check if user exited while prompt input was visible
    def prompt_input_exit?
      reason == 'prompt_input_exit'
    end

    # Check if reason is unspecified or other
    def other_reason?
      !cleared? && !logout? && !prompt_input_exit?
    end
  end
end
