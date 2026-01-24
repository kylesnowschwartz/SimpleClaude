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

    def notification_type
      @input_data['notification_type'] || @input_data['notificationType']
    end
  end
end
