# frozen_string_literal: true

# Stop-hook plumbing shared by every ClaudeHooks::Stop handler.
#
# Expects the includer to provide:
#   - log                (from ClaudeHooks::Base)
#   - output             (from ClaudeHooks::Stop)
#   - ensure_stopping!   (from ClaudeHooks::Stop)
#   - suppress_output!   (from ClaudeHooks::Stop)
module StopHandlerSupport
  # Let Claude stop and keep the transcript quiet — the normal outcome for a
  # handler with nothing to report.
  def allow_clean_stop!
    ensure_stopping!
    suppress_output!
  end

  # Log why the handler is bailing out, then allow the stop. Returned directly
  # from #call, so it yields the handler's output.
  def skip_and_stop(reason)
    log "Stop hook: #{reason}"
    allow_clean_stop!
    output
  end
end
