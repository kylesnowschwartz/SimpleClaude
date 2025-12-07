# frozen_string_literal: true

require_relative 'stop'

module ClaudeHooks
  class SubagentStop < Stop
    def self.hook_type
      'SubagentStop'
    end
  end
end
