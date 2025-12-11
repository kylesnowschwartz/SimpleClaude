# frozen_string_literal: true

require 'json'

module ClaudeHooks
  module Output
    # Base class for all Claude Code hook output handlers
    # Handles common functionality like continue/stop logic, output streams, and exit codes
    class Base
      attr_reader :data

      def initialize(data)
        @data = data || {}
      end

      # === COMMON FIELD ACCESSORS ===

      # Check if Claude should continue processing
      def continue?
        @data['continue'] != false
      end

      # Get the stop reason if continue is false
      def stop_reason
        @data['stopReason'] || ''
      end

      # Check if output should be suppressed from transcript
      def suppress_output?
        @data['suppressOutput'] == true
      end

      # Get the system message (if any)
      def system_message
        @data['systemMessage'] || ''
      end

      # Get the hook-specific output data
      def hook_specific_output
        @data['hookSpecificOutput'] || {}
      end

      # === JSON SERIALIZATION ===

      # Convert to JSON string (same as existing stringify_output)
      def to_json(*args)
        JSON.generate(@data, *args)
      end
      alias_method :stringify, :to_json

      # === EXECUTION CONTROL ===

      # Main execution method - handles output and exits with correct code
      def output_and_exit
        stream = output_stream
        code = exit_code

        case stream
        when :stdout
          $stdout.puts to_json
        when :stderr
          $stderr.puts to_json
        else
          raise "Unknown output stream: #{stream}"
        end

        exit code
      end

      # === ABSTRACT METHODS ===
      # These must be implemented by subclasses

      # Determine the exit code based on hook-specific logic
      def exit_code
        raise NotImplementedError, "Subclasses must implement exit_code"
      end

      # Determine the output stream (:stdout or :stderr)
      def output_stream
        default_output_stream
      end

      # === MERGE HELPER ===

      # Base merge method - handles common fields like continue, stopReason, suppressOutput
      # Subclasses should call super and add their specific logic
      def self.merge(*outputs)
        compacted_outputs = outputs.compact

        merged_data = {
          'continue' => true,
          'stopReason' => '',
          'suppressOutput' => false,
          'systemMessage' => ''
        }

        return compacted_outputs.first if compacted_outputs.length == 1
        return self.new(merged_data) if compacted_outputs.empty?

        # Apply base merge logic
        compacted_outputs.each do |output|
          output_data = output.respond_to?(:data) ? output.data : output

          merged_data['continue'] = false if output_data['continue'] == false
          merged_data['suppressOutput'] = true if output_data['suppressOutput'] == true
          merged_data['stopReason'] = [merged_data['stopReason'], output_data['stopReason']].compact.reject(&:empty?).join('; ')
          merged_data['systemMessage'] = [merged_data['systemMessage'], output_data['systemMessage']].compact.reject(&:empty?).join('; ')
        end

        self.new(merged_data)
      end

      # === FACTORY ===

      # Factory method to create the correct output class for a given hook type
      def self.for_hook_type(hook_type, data)
        case hook_type
        when 'UserPromptSubmit'
          UserPromptSubmit.new(data)
        when 'PreToolUse'
          PreToolUse.new(data)
        when 'PostToolUse'
          PostToolUse.new(data)
        when 'Stop'
          Stop.new(data)
        when 'SubagentStop'
          SubagentStop.new(data)
        when 'Notification'
          Notification.new(data)
        when 'SessionStart'
          SessionStart.new(data)
        when 'SessionEnd'
          SessionEnd.new(data)
        when 'PreCompact'
          PreCompact.new(data)
        else
          raise ArgumentError, "Unknown hook type: #{hook_type}"
        end
      end

      protected

      def default_exit_code
        continue? ? 0 : 2
      end

      def default_output_stream
        exit_code == 2 ? :stderr : :stdout
      end
    end
  end
end
