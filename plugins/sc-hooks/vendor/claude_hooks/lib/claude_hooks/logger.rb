# frozen_string_literal: true

require 'fileutils'
require_relative 'configuration'

module ClaudeHooks
  # Session-based logger for Claude Code hooks
  class Logger
    def initialize(session_id, source)
      @session_id = session_id
      @source = source
    end

    # Log to session-specific file
    # Usage:
    #   log "Simple message"
    #   log "Debug info", level: :debug
    def log(message, level: :info)
      timestamp = Time.now.strftime('%Y-%m-%d %H:%M:%S')
      class_prefix = "[#{timestamp}] [#{level.upcase}] [#{@source}]"

      # For multiline strings, prepend a newline for better formatting
      log_entry = if message.include?("\n")
                    "#{class_prefix}\n#{message}"
                  else
                    "#{class_prefix} #{message}"
                  end

      begin
        write_to_session_log(log_entry)
      rescue StandardError => e
        # Fallback to STDERR if file logging fails
        warn log_entry
        warn "Warning: Failed to write to session log: #{e.message}"
      end
    end

    private

    # Sanitize session_id to be filesystem-safe
    def safe_session_id
      session = @session_id || 'unknown'
      session.gsub(/[^a-zA-Z0-9\-_]/, '_')
    end

    # Write log entry to session-specific file
    def write_to_session_log(log_entry)
      log_file_path = File.join(
        Configuration.logs_directory,
        'hooks',
        "session-#{safe_session_id}.log"
      )

      # Ensure log directory exists
      log_dir = File.dirname(log_file_path)
      FileUtils.mkdir_p(log_dir)

      # Write to file (thread-safe append mode)
      File.open(log_file_path, 'a') do |file|
        file.puts log_entry
        file.flush # Ensure immediate write
      end
    end
  end
end
