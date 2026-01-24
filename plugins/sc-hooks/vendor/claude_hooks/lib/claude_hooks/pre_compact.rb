# frozen_string_literal: true

require_relative 'base'
require 'fileutils'

module ClaudeHooks
  class PreCompact < Base
    def self.hook_type
      'PreCompact'
    end

    def self.input_fields
      %w[trigger custom_instructions]
    end

    # === INPUT DATA ACCESS ===

    def trigger
      @input_data['trigger']
    end

    def custom_instructions
      if trigger == 'manual'
        @input_data['custom_instructions']
      else
        ''
      end
    end

    # === UTILITY HELPERS ===

    def backup_transcript!(backup_file_path)
      FileUtils.mkdir_p(File.dirname(backup_file_path))

      transcript_content = read_transcript
      File.write(backup_file_path, transcript_content)
      log "Transcript backed up to: #{backup_file_path}"
    end
  end
end
