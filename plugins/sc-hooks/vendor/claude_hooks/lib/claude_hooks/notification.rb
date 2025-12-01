# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  class Notification < Base
    def self.hook_type
      'Notification'
    end

    def self.input_fields
      %w[message]
    end

    # === INPUT DATA ACCESS ===

    def message
      @input_data['message']
    end
    alias_method :notification_message, :message
  end
end
