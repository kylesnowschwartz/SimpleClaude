#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require_relative '../concerns/file_handler_support'
require 'open3'

# Auto Format Handler
#
# PURPOSE: Automatically format/lint files after Write, Edit, or MultiEdit operations
# DESIGN: Lightweight, obvious, maintainable using claude_hooks DSL patterns
# ALIGNMENT: Mirrors pre-commit configuration for consistency
#
# SUPPORTED FORMATTERS:
# - Ruby: RuboCop with auto-correct (-A flag)
# - Markdown: markdownlint with --fix (matching pre-commit rules)
# - Shell: shfmt with 2-space indentation (no project config support)
# - Lua: stylua (reads .stylua.toml from project root via chdir)
# - Rust: rustfmt with default configuration
# - Python: ruff format (automatically uses existing Black/isort/flake8 configs)
# - YAML: yamlfmt with default configuration, prettier as fallback
# - JavaScript/TypeScript: eslint with --fix, prettier as fallback
# - CSS: prettier with --write
# - Go: goimports (imports + formatting), gofmt as fallback

class AutoFormatHandler < ClaudeHooks::PostToolUse
  include FileHandlerSupport

  def call
    log "Auto-format handler triggered for #{tool_name}"

    return output_data unless should_process_tool?
    return output_data unless file_path_available?
    return output_data if should_skip_file?(current_file_path)

    perform_formatting

    output_data
  end

  private

  def should_process_tool?
    file_modification_tools.include?(tool_name) && tool_successful?
  end

  def file_modification_tools
    %w[Write Edit MultiEdit]
  end

  def tool_successful?
    return false if tool_response&.dig('error')
    return false if tool_response&.dig('isError')
    return false if tool_response&.dig('success') == false
    return false if tool_response&.dig('exitCode')&.nonzero?

    true
  end

  def file_path_available?
    return true if current_file_path && File.exist?(current_file_path)

    log "File path not available or doesn't exist: #{current_file_path}", level: :warn
    false
  end

  def current_file_path
    @current_file_path ||= tool_input&.dig('file_path')
  end

  def perform_formatting
    formatter = detect_formatter
    unless formatter
      log "No formatter available for #{current_file_path}"
      return
    end

    log "Formatting #{current_file_path} with #{formatter[:name]}"

    result = run_formatter(formatter)

    if result[:success]
      log "Successfully formatted #{current_file_path}"
      add_success_feedback(formatter[:name])
    else
      log "Formatting failed: #{result[:error]}", level: :error
      add_error_feedback(formatter[:name], result[:error])
    end
  end

  # rubocop:disable Metrics/CyclomaticComplexity, Metrics/MethodLength
  def detect_formatter
    extension = File.extname(current_file_path).downcase

    case extension
    when '.rb'
      command_available?('rubocop') ? { name: 'RuboCop', command: 'rubocop', args: ['-A'] } : nil
    when '.md'
      if command_available?('markdownlint')
        # Deliberate overrides - these rules conflict with typical AI-generated markdown
        {
          name: 'markdownlint',
          command: 'markdownlint',
          args: ['--fix', '--disable', 'MD013,MD041,MD026,MD012,MD024']
        }
      end
    when '.sh', '.bash'
      if command_available?('shfmt')
        # shfmt has no project config file support, so hardcode 2-space indent
        { name: 'shfmt', command: 'shfmt', args: ['-w', '-i', '2'] }
      end
    when '.lua'
      # With chdir: cwd, stylua reads .stylua.toml from the project root automatically
      command_available?('stylua') ? { name: 'stylua', command: 'stylua', args: [] } : nil
    when '.rs'
      command_available?('rustfmt') ? { name: 'rustfmt', command: 'rustfmt', args: [] } : nil
    when '.py'
      command_available?('ruff') ? { name: 'ruff', command: 'ruff', args: ['format'] } : nil
    when '.yml', '.yaml'
      if command_available?('yamlfmt')
        { name: 'yamlfmt', command: 'yamlfmt', args: ['-w'] }
      elsif command_available?('prettier')
        { name: 'prettier', command: 'prettier', args: ['--write', '--parser', 'yaml'] }
      end
    when '.js', '.jsx', '.ts', '.tsx', '.json'
      if command_available?('eslint')
        { name: 'eslint', command: 'eslint', args: ['--fix'] }
      elsif command_available?('prettier')
        { name: 'prettier', command: 'prettier', args: ['--write'] }
      end
    when '.css'
      command_available?('prettier') ? { name: 'prettier', command: 'prettier', args: ['--write'] } : nil
    when '.go'
      if command_available?('goimports')
        { name: 'goimports', command: 'goimports', args: ['-w'] }
      elsif command_available?('gofmt')
        { name: 'gofmt', command: 'gofmt', args: ['-w'] }
      end
    end
  end
  # rubocop:enable Metrics/CyclomaticComplexity, Metrics/MethodLength

  def run_formatter(formatter)
    command_parts = [formatter[:command]] + formatter[:args] + [current_file_path]

    log "Running: #{command_parts.join(' ')}"

    # Array form avoids shell interpolation issues with special-character filenames.
    # chdir: cwd ensures formatters find project-specific config files
    # (eslintrc, .prettierrc, .stylua.toml, .rubocop.yml, etc.)
    stdout_err, status = Open3.capture2e(*command_parts, chdir: cwd)

    if status.success?
      { success: true, output: stdout_err }
    else
      { success: false, error: stdout_err.strip }
    end
  rescue StandardError => e
    { success: false, error: e.message }
  end

  def add_success_feedback(formatter_name)
    output_data['feedback'] ||= []
    output_data['feedback'] << "Auto-formatted with #{formatter_name}"
  end

  def add_error_feedback(formatter_name, error)
    output_data['feedback'] ||= []
    output_data['feedback'] << "Auto-formatting failed (#{formatter_name}): #{error}"
  end
end

# Testing support - claude_hooks DSL pattern
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(AutoFormatHandler) do |input_data|
    input_data['tool_name'] = 'Write'
    input_data['tool_input'] = { 'file_path' => '/tmp/test.rb' }
    input_data['tool_response'] = { 'success' => true }
    input_data['session_id'] = 'test-session-01'

    File.write('/tmp/test.rb', "def hello\nputs 'world'\nend")
  end
end
