# frozen_string_literal: true

require 'json'

# Shared entrypoint plumbing for every hook event.
#
# An entrypoint reads Claude Code's JSON payload from STDIN, runs its handlers
# in order, merges their outputs, and writes the result to STDOUT.
module EntrypointRunner
  # merge_class is the ClaudeHooks::Output::<Event> class for the event; its
  # merge semantics (most restrictive wins) decide the final decision when
  # several handlers speak up. Handlers run in the given order — that order is
  # significant for events where one handler's side effects feed the next.
  def self.run(event_name, merge_class, handler_classes)
    input_data = JSON.parse($stdin.read)

    outputs = handler_classes.map do |handler_class|
      handler = handler_class.new(input_data)
      handler.call
      handler.output
    end

    merge_class.merge(*outputs).output_and_exit
  rescue JSON::ParserError => e
    # Exit 1 = non-blocking error: Claude Code shows stderr and continues.
    # It never parses stderr, so a plain message is all that's useful here.
    warn "[#{event_name}] JSON parsing error: #{e.message}"
    exit 1
  rescue StandardError => e
    warn "[#{event_name}] Hook execution error: #{e.message}"
    warn e.backtrace.join("\n") if ENV['RUBY_CLAUDE_HOOKS_DEBUG']
    exit 1
  end
end
