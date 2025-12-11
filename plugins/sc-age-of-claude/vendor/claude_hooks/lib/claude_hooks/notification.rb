# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  class Notification < Base
    def self.hook_type
      'Notification'
    end

    def self.input_fields
      %w[message notification_type]
    end

    # === INPUT DATA ACCESS ===

    def message
      @input_data['message']
    end
    alias notification_message message

    # Returns the notification type: permission_prompt, idle_prompt, auth_success, elicitation_dialog
    def notification_type
      @input_data['notification_type']
    end
  end
end
