#!/usr/bin/env ruby
# frozen_string_literal: true

require 'claude_hooks'
require 'open3'
require 'shellwords'

# Auto Format Handler
#
# PURPOSE: Automatically format/lint files after Write, Edit, or MultiEdit operations
# TRIGGERS: After Claude Code modifies files using Write, Edit, or MultiEdit tools
#
# SUPPORTED FORMATTERS:
# - Ruby: RuboCop with auto-correct (-A flag)
# - JavaScript/TypeScript: Prettier, ESLint --fix
# - Python: Black, autopep8
# - Go: gofmt
# - Rust: rustfmt
# - JSON: jq with pretty formatting
# - YAML: yq with proper indentation
# - CSS/SCSS: Prettier
# - Markdown: Prettier
#
# CONFIGURATION:
# Create .claude/format-config.json in your project root to customize:
# {
#   "formatters": {
#     ".rb": { "name": "RuboCop", "command": "rubocop", "args": ["-A"] },
#     ".py": { "name": "Black", "command": "black", "args": ["--line-length", "88"] }
#   },
#   "skip_patterns": ["dist/", "build/", "*.min.js", "node_modules/"],
#   "enabled": true
# }

class AutoFormatHandler < ClaudeHooks::PostToolUse
  def call
    # Only process successful file modification tools
    return output_data unless file_modification_tool? && tool_successful?

    file_path = tool_input['file_path']
    return output_data unless file_path && File.exist?(file_path)

    # Check if formatting is enabled for this project
    return output_data unless formatting_enabled?

    # Skip if file matches ignore patterns
    return output_data if should_skip_file?(file_path)

    log "Auto-formatting file: #{file_path}"

    formatter = detect_formatter(file_path)
    unless formatter
      log "No formatter available for: #{file_path}"
      return output_data
    end

    format_result = run_formatter(formatter, file_path)

    if format_result[:success]
      log "Successfully formatted #{file_path} with #{formatter[:name]}"

      # Provide helpful feedback to Claude about what was formatted
      if format_result[:changes_made]
        add_feedback("✓ Auto-formatted #{File.basename(file_path)} with #{formatter[:name]}")
      else
        log "No formatting changes needed for #{file_path}"
      end
    else
      log "Formatting failed for #{file_path}: #{format_result[:error]}", level: :error
      add_feedback("⚠ Auto-formatting failed for #{File.basename(file_path)}: #{format_result[:error]}")
    end

    output_data
  end

  private

  def file_modification_tool?
    %w[Write Edit MultiEdit].include?(tool_name)
  end

  def tool_successful?
    return true unless tool_result.is_a?(Hash)

    # Check for success indicators - tool succeeded if no error and exit_code is 0 or nil
    !tool_result.key?('error') &&
      tool_result.fetch('success', true) &&
      (!tool_result.key?('exit_code') || tool_result['exit_code']&.zero?)
  end

  def formatting_enabled?
    config = load_project_config
    config.fetch('enabled', true)
  end

  def should_skip_file?(file_path)
    config = load_project_config
    skip_patterns = config.fetch('skip_patterns', default_skip_patterns)

    skip_patterns.any? do |pattern|
      # Convert glob patterns to regex for file matching
      if pattern.include?('*')
        regex_pattern = pattern.gsub('*', '.*')
        file_path.match?(/#{regex_pattern}/)
      else
        file_path.include?(pattern)
      end
    end
  end

  def default_skip_patterns
    [
      'node_modules/',
      'dist/',
      'build/',
      '.git/',
      '*.min.js',
      '*.min.css',
      'vendor/',
      'tmp/',
      '.bundle/'
    ]
  end

  def load_project_config
    config_path = File.join(Dir.pwd, '.claude', 'format-config.json')
    return {} unless File.exist?(config_path)

    JSON.parse(File.read(config_path))
  rescue JSON::ParserError => e
    log "Invalid format config: #{e.message}", level: :error
    {}
  rescue StandardError => e
    log "Error loading format config: #{e.message}", level: :error
    {}
  end

  def detect_formatter(file_path)
    extension = File.extname(file_path).downcase

    # Check project-specific overrides first
    project_config = load_project_config
    if project_config.dig('formatters', extension)
      formatter_config = project_config['formatters'][extension]
      return {
        name: formatter_config['name'],
        command: formatter_config['command'],
        args: formatter_config['args'] || []
      }
    end

    # Default formatter detection based on file extension
    case extension
    when '.rb'
      return { name: 'RuboCop', command: 'rubocop', args: ['-A'] } if command_available?('rubocop')

    when '.js', '.jsx', '.ts', '.tsx'
      # Prefer Prettier over ESLint for formatting
      return { name: 'Prettier', command: 'npx', args: ['prettier', '--write'] } if command_available?('npx')
      return { name: 'ESLint', command: 'npx', args: ['eslint', '--fix'] } if command_available?('npx')

    when '.py'
      return { name: 'Black', command: 'black', args: [] } if command_available?('black')
      return { name: 'autopep8', command: 'autopep8', args: ['--in-place'] } if command_available?('autopep8')

    when '.go'
      return { name: 'gofmt', command: 'gofmt', args: ['-w'] } if command_available?('gofmt')

    when '.rs'
      return { name: 'rustfmt', command: 'rustfmt', args: [] } if command_available?('rustfmt')

    when '.json', '.jsonl'
      return { name: 'jq', command: 'jq', args: ['.', '--indent', '2', '--sort-keys'] } if command_available?('jq')

    when '.yml', '.yaml'
      return { name: 'yq', command: 'yq', args: ['eval', '--inplace', '--indent', '2'] } if command_available?('yq')

    when '.css', '.scss', '.sass'
      return { name: 'Prettier', command: 'npx', args: ['prettier', '--write'] } if command_available?('npx')

    when '.md', '.markdown'
      return { name: 'Prettier', command: 'npx', args: ['prettier', '--write'] } if command_available?('npx')

    when '.html', '.htm'
      return { name: 'Prettier', command: 'npx', args: ['prettier', '--write'] } if command_available?('npx')

    when '.xml'
      return { name: 'xmllint', command: 'xmllint', args: ['--format', '--output'] } if command_available?('xmllint')
    end

    nil
  end

  def command_available?(command)
    # Cache command availability to avoid repeated system calls
    @command_cache ||= {}

    return @command_cache[command] if @command_cache.key?(command)

    @command_cache[command] = system("which #{command} > /dev/null 2>&1")
  end

  def run_formatter(formatter, file_path)
    # Store original file content to detect changes
    original_content = begin
      File.read(file_path)
    rescue StandardError
      nil
    end

    # Handle special cases for different formatters
    case formatter[:name]
    when 'jq'
      # jq needs special handling for in-place editing
      run_jq_formatter(file_path)
    when 'xmllint'
      # xmllint needs output file specified
      run_xmllint_formatter(file_path)
    else
      # Standard formatter execution
      run_standard_formatter(formatter, file_path)
    end.tap do |result|
      # Check if changes were made
      if result[:success] && original_content
        new_content = begin
          File.read(file_path)
        rescue StandardError
          nil
        end
        result[:changes_made] = original_content != new_content
      end
    end
  end

  def run_standard_formatter(formatter, file_path)
    command_parts = [formatter[:command]] + formatter[:args] + [file_path]
    command = command_parts.map { |part| Shellwords.escape(part) }.join(' ')

    log "Running: #{command}"

    stdout_err, status = Open3.capture2e(command)

    if status.success?
      { success: true, output: stdout_err }
    else
      { success: false, error: stdout_err.strip }
    end
  rescue StandardError => e
    { success: false, error: e.message }
  end

  def run_jq_formatter(file_path)
    # Read, format, and write back for jq
    original_content = File.read(file_path)

    command = "jq . --indent 2 --sort-keys #{Shellwords.escape(file_path)}"
    log "Running: #{command}"

    stdout, stderr, status = Open3.capture3(command)

    if status.success?
      File.write(file_path, stdout)
      { success: true, output: 'Formatted JSON successfully' }
    else
      { success: false, error: stderr.strip }
    end
  rescue StandardError => e
    # Restore original content on error
    File.write(file_path, original_content) if original_content
    { success: false, error: e.message }
  end

  def run_xmllint_formatter(file_path)
    temp_file = "#{file_path}.tmp"
    command = "xmllint --format --output #{Shellwords.escape(temp_file)} #{Shellwords.escape(file_path)}"

    log "Running: #{command}"

    stdout_err, status = Open3.capture2e(command)

    if status.success? && File.exist?(temp_file)
      File.rename(temp_file, file_path)
      { success: true, output: 'Formatted XML successfully' }
    else
      File.delete(temp_file) if File.exist?(temp_file)
      { success: false, error: stdout_err.strip }
    end
  rescue StandardError => e
    File.delete(temp_file) if File.exist?(temp_file)
    { success: false, error: e.message }
  end

  def add_feedback(message)
    # Add feedback that Claude will see about the formatting result
    output_data[:feedback] ||= []
    output_data[:feedback] << message
  end
end

# Testing support - run this file directly to test with sample data
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(AutoFormatHandler) do |input_data|
    input_data['tool_name'] = 'Write'
    input_data['tool_input'] = { 'file_path' => '/tmp/test.rb' }
    input_data['tool_result'] = { 'success' => true }
    input_data['session_id'] = 'test-session-01'

    # Create a test file
    File.write('/tmp/test.rb', "def hello\nputs 'world'\nend")
  end
end
