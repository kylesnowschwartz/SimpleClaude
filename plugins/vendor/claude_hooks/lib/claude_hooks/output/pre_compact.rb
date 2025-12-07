# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  module Output
    class PreCompact < Base
      def exit_code
        default_exit_code
      end

      # === MERGE HELPER ===

      def self.merge(*outputs)
        merged = super(*outputs)
        new(merged.data)
      end
    end
  end
end
