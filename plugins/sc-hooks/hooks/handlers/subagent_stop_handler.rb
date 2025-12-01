#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'

# SubagentStop Handler
#
# PURPOSE: Process and enhance results from completed subagent tasks
# TRIGGERS: When a subagent (spawned via Task tool) completes execution
#
# COMMON USE CASES:
# - Extract and cache key insights from subagent results
# - Log subagent performance metrics
# - Process and transform subagent outputs
# - Trigger follow-up actions based on subagent results
# - Aggregate results from multiple subagent executions
# - Update project state based on subagent findings
#
# SETTINGS.JSON CONFIGURATION:
# {
#   "hooks": {
#     "SubagentStop": [{
#       "matcher": "",
#       "hooks": [{
#         "type": "command",
#         "command": "${CLAUDE_PLUGIN_ROOT}/hooks/entrypoints/subagent_stop.rb"
#       }]
#     }]
#   }
# }

class SubagentStopHandler < ClaudeHooks::SubagentStop
  def call
    log "Processing subagent completion for session: #{session_id}"

    # Example: Extract key insights from subagent result
    # extract_subagent_insights

    # Example: Cache subagent results for reuse
    # cache_subagent_results

    # Example: Log subagent performance metrics
    # log_subagent_metrics

    # Example: Trigger follow-up actions
    # trigger_follow_up_actions

    # Allow subagent stop to proceed normally
    allow_continue!

    output_data
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(SubagentStopHandler) do |input_data|
    input_data['session_id'] = 'test-subagent-01'
    input_data['subagent_type'] = 'code-explorer'
  end
end
