# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  module Output
    # NOTE: SessionEnd hooks cannot block session termination - they're for cleanup only
    class SessionEnd < Base
      # === EXIT CODE LOGIC ===

      # SessionEnd hooks always return 0 - they're for cleanup only
      def exit_code
        0
      end

      # === MERGE HELPER ===

      def self.merge(*outputs)
        merged = super
        new(merged.data)
      end
    end
  end
end
