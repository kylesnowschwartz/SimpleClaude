#!/usr/bin/env ruby
# frozen_string_literal: true

require 'claude_hooks'

# SubagentStop Handler
#
# PURPOSE: Process subagent completion and results
# TRIGGERS: When a Claude Code subagent completes its task
#
# COMMON USE CASES:
# - Process and validate subagent results
# - Extract key insights from subagent outputs
# - Log subagent performance metrics
# - Route subagent results to appropriate handlers
# - Trigger follow-up actions based on subagent type
# - Cache subagent results for reuse
#
# SETTINGS.JSON CONFIGURATION:
# {
#   "hooks": {
#     "SubagentStop": [{
#       "matcher": "",
#       "hooks": [{
#         "type": "command",
#         "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/entrypoints/subagent_stop.rb"
#       }]
#     }]
#   }
# }

class SubagentStopHandler < ClaudeHooks::SubagentStop
  def call
    log "Processing subagent completion: #{subagent_type}"

    # Example: Process results by subagent type
    # process_subagent_results

    # Example: Extract key insights
    # extract_key_insights

    # Example: Log performance metrics
    # log_performance_metrics

    # Example: Cache results for reuse
    # cache_subagent_results

    # Example: Trigger follow-up actions
    # trigger_follow_up_actions

    output_data
  end

  private

  def process_subagent_results
    case subagent_type
    when 'context-analyzer'
      process_context_analyzer_results
    when 'test-runner'
      process_test_runner_results
    when 'repo-documentation-finder'
      process_documentation_finder_results
    when 'web-search-researcher'
      process_web_search_results
    when 'context7-documentation-specialist'
      process_context7_results
    else
      log "Unknown subagent type: #{subagent_type}", level: :warn
      process_generic_results
    end
  end

  def process_context_analyzer_results
    log 'Processing context analyzer results'

    result = subagent_result

    # Example: Extract project structure insights
    if result.include?('project structure') || result.include?('technology stack')
      log 'Context analyzer provided project insights'
      # cache_project_insights(result)
    end

    # Example: Track analysis patterns
    return unless result.include?('patterns identified')

    log 'Context analyzer identified code patterns'
    # track_code_patterns(result)
  end

  def process_test_runner_results
    log 'Processing test runner results'

    result = subagent_result

    # Example: Parse test results
    if result.include?('tests passed') || result.include?('tests failed')
      test_summary = extract_test_summary(result)
      log "Test execution summary: #{test_summary}"
      # store_test_results(test_summary)
    end

    # Example: Extract failure details
    return unless result.include?('failure') || result.include?('error')

    log 'Test failures detected', level: :warn
    # extract_failure_details(result)
  end

  def process_documentation_finder_results
    log 'Processing documentation finder results'

    result = subagent_result

    # Example: Cache documentation findings
    if result.length > 1000 # Substantial documentation found
      log "Substantial documentation retrieved (#{result.length} characters)"
      # cache_documentation(result)
    end

    # Example: Extract API examples
    return unless result.include?('example') || result.include?('usage')

    log 'Documentation contains usage examples'
    # extract_usage_examples(result)
  end

  def process_web_search_results
    log 'Processing web search researcher results'

    result = subagent_result

    # Example: Track search effectiveness
    if result.include?('found') && result.include?('results')
      log 'Web search completed successfully'
      # track_search_effectiveness(result)
    end

    # Example: Cache important findings
    return unless result.include?('documentation') || result.include?('official')

    log 'Official documentation found in web search'
    # cache_web_findings(result)
  end

  def process_context7_results
    log 'Processing Context7 documentation specialist results'

    result = subagent_result

    # Example: Track library documentation usage
    if result.include?('library') || result.include?('API')
      log 'Library documentation retrieved via Context7'
      # track_library_usage(result)
    end

    # Example: Cache API documentation
    return unless result.include?('API reference') || result.include?('documentation')

    log 'API documentation cached for reuse'
    # cache_api_documentation(result)
  end

  def process_generic_results
    log 'Processing generic subagent results'

    result = subagent_result

    # Example: Basic result analysis
    log "Subagent result length: #{result.length} characters"

    if result.include?('error') || result.include?('failed')
      log 'Subagent reported errors', level: :warn
    elsif result.include?('success') || result.include?('completed')
      log 'Subagent completed successfully'
    end
  end

  def extract_key_insights
    result = subagent_result

    # Example: Extract key findings using simple pattern matching
    insights = []

    # Look for conclusions or summaries
    if (match = result.match(/## Summary\s*(.+?)(?=##|\z)/m))
      insights << { type: 'summary', content: match[1].strip }
    end

    # Look for recommendations
    if (match = result.match(/## Recommendations?\s*(.+?)(?=##|\z)/m))
      insights << { type: 'recommendations', content: match[1].strip }
    end

    # Look for key findings
    if (match = result.match(/## Key Findings?\s*(.+?)(?=##|\z)/m))
      insights << { type: 'findings', content: match[1].strip }
    end

    if insights.any?
      log "Extracted #{insights.length} key insights from subagent results"
      # store_insights(insights)
    end

    insights
  end

  def log_performance_metrics
    # Example: Log subagent performance data
    log "Subagent type: #{subagent_type}"
    log "Result length: #{subagent_result.length} characters"
    log "Session: #{session_id}"

    # Example: Track execution time if available
    return unless subagent_execution_time

    log "Execution time: #{subagent_execution_time}ms"
    # track_performance_metrics(subagent_type, subagent_execution_time)
  end

  def cache_subagent_results
    # Example: Cache results for potential reuse
    cache_key = generate_cache_key
    {
      subagent_type: subagent_type,
      result: subagent_result,
      timestamp: Time.now,
      session_id: session_id
    }

    log "Would cache subagent results with key: #{cache_key}"
    # write_to_cache(cache_key, cache_data)
  end

  def trigger_follow_up_actions
    # Example: Trigger actions based on subagent results
    case subagent_type
    when 'test-runner'
      if subagent_result.include?('failed')
        log 'Would trigger failure notification due to test failures'
        # notify_about_test_failures
      end

    when 'context-analyzer'
      if subagent_result.include?('security')
        log 'Would trigger security review due to security-related findings'
        # trigger_security_review
      end

    when 'web-search-researcher'
      if subagent_result.include?('outdated')
        log 'Would trigger documentation update due to outdated findings'
        # trigger_documentation_update
      end
    end
  end

  def extract_test_summary(result)
    # Simple test result parsing
    {
      passed: result.scan(/(\d+)\s+passed?/).flatten.first.to_i,
      failed: result.scan(/(\d+)\s+failed?/).flatten.first.to_i,
      total: result.scan(/(\d+)\s+total/).flatten.first.to_i
    }
  end

  def generate_cache_key
    # Generate a cache key based on subagent type and content hash
    content_hash = subagent_result.hash.abs.to_s(16)
    "#{subagent_type}_#{content_hash}"
  end

  def subagent_type
    # Extract subagent type from input data
    input_data['subagent_type'] || 'unknown'
  end

  def subagent_result
    # Extract subagent result from input data
    input_data['result'] || ''
  end

  def subagent_execution_time
    # Extract execution time if available
    input_data['execution_time']
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(SubagentStopHandler) do |input_data|
    input_data['subagent_type'] = 'context-analyzer'
    input_data['result'] =
      '## Summary\nAnalyzed project structure and found React components.\n## Recommendations\nConsider adding TypeScript for better type safety.'
    input_data['execution_time'] = 1500
    input_data['session_id'] = 'test-session-01'
  end
end
