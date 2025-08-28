#!/usr/bin/env ruby
# frozen_string_literal: true

require 'claude_hooks'

# PreToolUse Handler
#
# PURPOSE: Control and validate tool usage before execution
# TRIGGERS: Before Claude Code executes any tool (Bash, Write, Edit, etc.)
#
# COMMON USE CASES:
# - Block dangerous commands (rm -rf, chmod 777, etc.)
# - Require approval for sensitive operations
# - Log tool usage for security auditing
# - Apply rate limiting or usage quotas
# - Validate file paths and permissions
# - Add safety checks for system commands
#
# SETTINGS.JSON CONFIGURATION:
# {
#   "hooks": {
#     "PreToolUse": [{
#       "matcher": "",
#       "hooks": [{
#         "type": "command",
#         "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/entrypoints/pre_tool_use.rb"
#       }]
#     }]
#   }
# }

class PreToolUseHandler < ClaudeHooks::PreToolUse
  def call
    log "Checking tool usage: #{tool_name} with input: #{tool_input}"

    # Example: Block dangerous commands
    # check_dangerous_commands

    # Example: Validate file operations
    # validate_file_operations

    # Example: Apply rate limiting
    # check_rate_limits

    # Example: Log tool usage
    # log_tool_usage

    # Default: approve the tool usage
    approve_tool!('Tool usage approved')

    output_data
  end

  private

  def check_dangerous_commands
    case tool_name
    when 'Bash'
      command = tool_input['command'] || ''

      dangerous_patterns = [
        %r{rm\s+-rf\s+/}, # rm -rf /
        /chmod\s+777/,                # chmod 777
        /sudo\s+rm/,                  # sudo rm
        %r{>\s*/dev/sd[a-z]}, # writing to disk devices
        /mkfs\./, # filesystem creation
        %r{dd\s+if=.*of=/dev} # disk imaging to devices
      ]

      dangerous_patterns.each do |pattern|
        next unless command.match?(pattern)

        block_tool!("Dangerous command detected: #{pattern}")
        log "Blocked dangerous command: #{command}", level: :error
        return
      end

    when 'Write', 'Edit'
      file_path = tool_input['file_path'] || ''

      # Block writes to system files
      if file_path.start_with?('/etc/', '/usr/', '/bin/', '/sbin/')
        ask_for_permission!("Attempting to modify system file: #{file_path}")
        nil
      end
    end
  end

  def validate_file_operations
    return unless %w[Write Edit MultiEdit].include?(tool_name)

    file_path = tool_input['file_path'] || ''

    # Ensure file path is within project directory
    current_dir = cwd || Dir.pwd
    unless file_path.start_with?(current_dir)
      log "File operation outside project directory: #{file_path}", level: :warn
      ask_for_permission!('File operation outside project directory')
      return
    end

    # Check for sensitive files
    sensitive_files = [
      '.env',
      '.env.local',
      'config/secrets.yml',
      'private_key',
      'id_rsa'
    ]

    return unless sensitive_files.any? { |f| file_path.include?(f) }

    ask_for_permission!("Modifying potentially sensitive file: #{File.basename(file_path)}")
    nil
  end

  def check_rate_limits
    # Example: Implement rate limiting for expensive operations
    return unless tool_name == 'Bash'

    command = tool_input['command'] || ''

    # Limit compilation commands
    return unless command.match?(/gcc|g\+\+|clang|rustc|go build/)

    log 'Compilation command detected, checking rate limits'
    # Could implement actual rate limiting logic here
  end

  def log_tool_usage
    log "Tool: #{tool_name}"
    log "Session: #{session_id}"
    log "Working directory: #{cwd || Dir.pwd}"

    # Log tool input (be careful with sensitive data)
    return unless tool_input.is_a?(Hash)

    sanitized_input = tool_input.reject { |k, _v| k.to_s.downcase.include?('password') }
    log "Input keys: #{sanitized_input.keys.join(', ')}"
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(PreToolUseHandler) do |input_data|
    input_data['tool_name'] = 'Bash'
    input_data['tool_input'] = { 'command' => 'ls -la' }
    input_data['session_id'] = 'test-session-01'
  end
end
