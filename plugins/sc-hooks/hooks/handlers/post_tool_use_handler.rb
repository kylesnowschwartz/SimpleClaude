#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'

# PostToolUse Handler
#
# PURPOSE: Process and analyze tool execution results
# TRIGGERS: After Claude Code executes any tool (Bash, Write, Edit, etc.)
#
# COMMON USE CASES:
# - Parse and format tool output
# - Extract errors and warnings from command results
# - Update project state based on tool results
# - Log execution metrics and performance data
# - Trigger follow-up actions based on results
# - Cache or store important tool outputs
#
# SETTINGS.JSON CONFIGURATION:
# {
#   "hooks": {
#     "PostToolUse": [{
#       "matcher": "",
#       "hooks": [{
#         "type": "command",
#         "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/entrypoints/post_tool_use.rb"
#       }]
#     }]
#   }
# }

class PostToolUseHandler < ClaudeHooks::PostToolUse
  def call
    log "Processing tool result: #{tool_name}"

    # Example: Analyze tool results
    # analyze_tool_results

    # Example: Extract errors and warnings
    # extract_errors_and_warnings

    # Example: Update project state
    # update_project_state

    # Example: Log execution metrics
    # log_execution_metrics

    output_data
  end

  private

  def analyze_tool_results
    case tool_name
    when 'Bash'
      # Analyze command execution results
      analyze_bash_results

    when 'Write', 'Edit', 'MultiEdit'
      # Track file modifications
      analyze_file_modifications

    when 'Grep', 'Glob'
      # Analyze search results
      analyze_search_results
    end
  end

  def analyze_bash_results
    return unless tool_result.is_a?(Hash)

    exit_code = tool_result['exit_code'] || 0
    stdout = tool_result['stdout'] || ''
    stderr = tool_result['stderr'] || ''

    if exit_code != 0
      log "Command failed with exit code: #{exit_code}", level: :error
      log "stderr: #{stderr}", level: :error if stderr && !stderr.empty?
    else
      log 'Command executed successfully'
    end

    # Example: Parse specific command outputs
    command = tool_input['command'] || ''

    if command.include?('npm test') || command.include?('yarn test')
      parse_test_results(stdout)
    elsif command.include?('git status')
      parse_git_status(stdout)
    elsif command.include?('npm install') || command.include?('yarn install')
      parse_install_results(stdout, stderr)
    end
  end

  def analyze_file_modifications
    file_path = tool_input['file_path'] || ''
    log "File modified: #{file_path}"

    # Example: Track important file changes
    if file_path.end_with?('package.json')
      log 'Package.json modified - dependencies may have changed'
    elsif file_path.end_with?('.env')
      log 'Environment file modified', level: :warn
    elsif file_path.match?(/\.(js|ts|jsx|tsx)$/)
      log 'Source code file modified'
    end
  end

  def analyze_search_results
    return unless tool_result.is_a?(Hash)

    results = tool_result['results'] || []
    log "Search returned #{results.length} results"

    # Example: Log interesting search patterns
    if results.length > 100
      log 'Large search result set - consider narrowing search', level: :warn
    elsif results.empty?
      log 'No search results found'
    end
  end

  def extract_errors_and_warnings
    return unless tool_result.is_a?(Hash)

    output_text = [
      tool_result['stdout'],
      tool_result['stderr']
    ].compact.join("\n")

    # Extract common error patterns
    error_patterns = [
      /error:/i,
      /exception:/i,
      /failed:/i,
      /cannot find/i,
      /permission denied/i
    ]

    warning_patterns = [
      /warning:/i,
      /deprecated:/i,
      /caution:/i
    ]

    error_patterns.each do |pattern|
      if output_text.match?(pattern)
        log 'Error detected in tool output', level: :error
        break
      end
    end

    warning_patterns.each do |pattern|
      if output_text.match?(pattern)
        log 'Warning detected in tool output', level: :warn
        break
      end
    end
  end

  def update_project_state
    # Example: Update cached project information based on tool results
    case tool_name
    when 'Bash'
      command = tool_input['command'] || ''

      if command.include?('git checkout') && tool_result['exit_code'].zero?
        log 'Git branch changed - project state updated'
      elsif command.include?('npm install') && tool_result['exit_code'].zero?
        log 'Dependencies installed - project state updated'
      end
    end
  end

  def log_execution_metrics
    # Example: Log performance and usage metrics
    return unless tool_result.is_a?(Hash)

    duration = tool_result['duration_ms']
    log "Tool execution time: #{duration}ms" if duration

    # Track resource usage
    return unless tool_name == 'Bash'

    command = tool_input['command'] || ''
    log "Executed command: #{command[0..50]}#{'...' if command.length > 50}"
  end

  def parse_test_results(stdout)
    if stdout.include?('passing') || stdout.include?('✓')
      log 'Tests appear to be passing'
    elsif stdout.include?('failing') || stdout.include?('✗')
      log 'Tests appear to be failing', level: :warn
    end
  end

  def parse_git_status(stdout)
    if stdout.include?('nothing to commit')
      log 'Git working directory is clean'
    elsif stdout.include?('Changes not staged')
      log 'Unstaged changes detected'
    end
  end

  def parse_install_results(stdout, stderr)
    if stderr&.include?('WARN')
      log 'Package installation completed with warnings', level: :warn
    elsif stdout&.include?('added')
      log 'Packages installed successfully'
    end
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(PostToolUseHandler) do |input_data|
    input_data['tool_name'] = 'Bash'
    input_data['tool_input'] = { 'command' => 'npm test' }
    input_data['tool_result'] = { 'exit_code' => 0, 'stdout' => 'All tests passing' }
    input_data['session_id'] = 'test-session-01'
  end
end
