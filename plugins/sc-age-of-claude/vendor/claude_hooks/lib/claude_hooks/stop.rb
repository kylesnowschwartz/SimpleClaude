# frozen_string_literal: true

require_relative 'base'

module ClaudeHooks
  # Stop hook for preventing Claude Code from stopping execution.
  #
  # When using continue_with_instructions!, this hook outputs JSON to stdout
  # with exit code 0 (advanced JSON API approach).
  #
  # References:
  # - https://github.com/anthropics/claude-code/issues/10875
  # - https://github.com/gabriel-dehan/claude_hooks/issues/11
  class Stop < Base
    def self.hook_type
      'Stop'
    end

    def self.input_fields
      %w[stop_hook_active]
    end

    # === INPUT DATA ACCESS ===

    def stop_hook_active
      @input_data['stop_hook_active']
    end

    # === OUTPUT DATA HELPERS ===

    # Block Claude from stopping (force it to continue)
    def continue_with_instructions!(instructions)
      @output_data['decision'] = 'block'
      @output_data['reason'] = instructions
    end
    alias_method :block!, :continue_with_instructions!

    # Ensure Claude stops normally (default behavior)
    def ensure_stopping!
      @output_data.delete('decision')
      @output_data.delete('reason')
    end
  end
end
