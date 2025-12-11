# frozen_string_literal: true

require_relative 'stop'

module ClaudeHooks
  module Output
    class SubagentStop < Stop
      def self.merge(*outputs)
        merged = super(*outputs)
        new(merged.data)
      end
    end
  end
end
