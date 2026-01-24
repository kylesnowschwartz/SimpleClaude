# frozen_string_literal: true

require 'json'

module ClaudeHooks
  # CLI utility for testing hook handlers in isolation
  # This module provides a standardized way to run hooks directly from the command line
  # for testing and debugging purposes.
  module CLI
    class << self
      # Run a hook class directly from command line
      # Usage:
      #   ClaudeHooks::CLI.run_hook(YourHookClass)
      #   ClaudeHooks::CLI.run_hook(YourHookClass, custom_input_data)
      #
      #   # With customization block:
      #   ClaudeHooks::CLI.run_hook(YourHookClass) do |input_data|
      #     input_data['debug_mode'] = true
      #   end
      def run_hook(hook_class, input_data = nil)
        # If no input data provided, read from STDIN
        input_data ||= read_stdin_input

        # Apply customization block if provided
        yield(input_data) if block_given?

        # Create and execute the hook
        hook = hook_class.new(input_data)
        result = hook.call

        # Output the result as JSON (same format as production hooks)
        puts JSON.generate(result) if result

        result
      rescue StandardError => e
        handle_error(e, hook_class)
      end

      # Create a test runner block for a hook class
      # This generates the common if __FILE__ == $0 block content
      #
      # Usage:
      #   ClaudeHooks::CLI.test_runner(YourHookClass)
      #
      #   # With customization block:
      #   ClaudeHooks::CLI.test_runner(YourHookClass) do |input_data|
      #     input_data['custom_field'] = 'test_value'
      #     input_data['user_name'] = 'TestUser'
      #   end
      def test_runner(hook_class)
        input_data = read_stdin_input

        # Apply customization block if provided
        yield(input_data) if block_given?

        run_hook(hook_class, input_data)
      end

      # Run hook with sample data (useful for development)
      # Usage:
      #   ClaudeHooks::CLI.run_with_sample_data(YourHookClass)
      #   ClaudeHooks::CLI.run_with_sample_data(YourHookClass, { 'prompt' => 'test prompt' })
      #
      #   # With customization block:
      #   ClaudeHooks::CLI.run_with_sample_data(YourHookClass) do |input_data|
      #     input_data['prompt'] = 'Custom test prompt'
      #     input_data['debug'] = true
      #   end
      def run_with_sample_data(hook_class, sample_data = {})
        default_sample = {
          'session_id' => 'test-session',
          'transcript_path' => '/tmp/test_transcript.md',
          'cwd' => Dir.pwd,
          'hook_event_name' => hook_class.hook_type
        }

        # Merge with hook-specific sample data
        merged_data = default_sample.merge(sample_data)

        # Apply customization block if provided
        yield(merged_data) if block_given?

        run_hook(hook_class, merged_data)
      end

      # Simplified entrypoint helper for hook scripts
      # This handles all the STDIN reading, JSON parsing, error handling, and output execution
      #
      # Usage patterns:
      #
      # 1. Block form - custom logic:
      #    ClaudeHooks::CLI.entrypoint do |input_data|
      #      hook = MyHook.new(input_data)
      #      hook.call
      #      hook.output_and_exit
      #    end
      #
      # 2. Simple form - single hook class:
      #    ClaudeHooks::CLI.entrypoint(MyHook)
      #
      # 3. Multiple hooks with merging:
      #    ClaudeHooks::CLI.entrypoint do |input_data|
      #      hook1 = Hook1.new(input_data)
      #      hook2 = Hook2.new(input_data)
      #      result1 = hook1.call
      #      result2 = hook2.call
      #
      #      # Use the appropriate output class for merging
      #      merged = ClaudeHooks::Output::PreToolUse.merge(
      #        hook1.output,
      #        hook2.output
      #      )
      #      merged.output_and_exit
      #    end
      def entrypoint(hook_class = nil)
        # Read and parse input from STDIN
        input_data = JSON.parse($stdin.read)

        if block_given?
          # Custom block form
          yield(input_data)
        elsif hook_class
          # Simple single hook form
          hook = hook_class.new(input_data)
          hook.call
          hook.output_and_exit
        else
          raise ArgumentError, 'Either provide a hook_class or a block'
        end
      rescue JSON::ParserError => e
        warn "JSON parsing error: #{e.message}"
        error_response = {
          continue: false,
          stopReason: "JSON parsing error: #{e.message}",
          suppressOutput: false
        }
        response = JSON.generate(error_response)
        puts response
        warn response
        exit 1
      rescue StandardError => e
        warn "Hook execution error: #{e.message}"
        warn e.backtrace.join("\n") if e.backtrace

        error_response = {
          continue: false,
          stopReason: "Hook execution error: #{e.message}",
          suppressOutput: false
        }
        response = JSON.generate(error_response)
        puts response
        warn response
        exit 1
      end

      private

      def read_stdin_input
        stdin_content = $stdin.read.strip
        return {} if stdin_content.empty?

        JSON.parse(stdin_content)
      rescue JSON::ParserError => e
        raise "Invalid JSON input: #{e.message}"
      end

      def handle_error(error, hook_class)
        warn "Error in #{hook_class.name} hook: #{error.message}"
        warn error.backtrace.join("\n") if error.backtrace

        # Output error response in Claude Code format
        error_response = {
          continue: false,
          stopReason: "#{hook_class.name} execution error: #{error.message}",
          suppressOutput: false
        }

        response = JSON.generate(error_response)
        puts response
        warn response
        exit 1
      end
    end
  end
end
