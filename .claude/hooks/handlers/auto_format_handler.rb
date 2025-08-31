#!/usr/bin/env ruby
# frozen_string_literal: true

require 'claude_hooks'
require 'open3'
require 'shellwords'

# Auto Format Handler
#
# PURPOSE: Automatically format/lint files after Write, Edit, or MultiEdit operations
# DESIGN: Lightweight, obvious, maintainable using claude_hooks DSL patterns
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

class AutoFormatHandler < ClaudeHooks::PostToolUse
  def call
    log "Auto-format handler triggered for #{tool_name}"

    # Early returns for invalid conditions - keep it obvious
    return output_data unless should_process_tool?
    return output_data unless file_path_available?
    return output_data unless formatting_enabled?
    return output_data if should_skip_file?

    # Core formatting logic
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
    # Simple, clear success detection using DSL accessors
    return false if tool_response&.dig('error')
    return false if tool_response&.dig('success') == false
    return false if tool_response&.dig('exit_code')&.nonzero?

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

  def formatting_enabled?
    # Use claude_hooks config helpers instead of custom JSON loading
    enabled = config.get_config_value('AUTO_FORMAT_ENABLED', 'enabled', true)

    log 'Auto-formatting disabled by configuration' unless enabled

    enabled
  end

  def should_skip_file?
    return false unless current_file_path

    relative_path = relative_file_path

    # Check against simple, obvious skip patterns
    if skip_patterns.any? { |pattern| matches_skip_pattern?(relative_path, pattern) }
      log "Skipping #{relative_path} - matches ignore pattern"
      return true
    end

    false
  end

  def relative_file_path
    # Use claude_hooks cwd helper instead of Dir.pwd
    File.expand_path(current_file_path).sub("#{cwd}/", '')
  end

  def skip_patterns
    @skip_patterns ||= load_skip_patterns
  end

  def load_skip_patterns
    patterns = default_skip_patterns

    # Try to load .claudeignore from project
    claudeignore_path = project_path_for('.claudeignore')
    if claudeignore_path && File.exist?(claudeignore_path)
      patterns += load_ignore_file(claudeignore_path)
      log "Loaded ignore patterns from #{claudeignore_path}"
    end

    # Try to load from home directory
    home_claudeignore = home_path_for('.claudeignore')
    if File.exist?(home_claudeignore)
      patterns += load_ignore_file(home_claudeignore)
      log "Loaded ignore patterns from #{home_claudeignore}"
    end

    patterns
  end

  def default_skip_patterns
    %w[
      node_modules/
      dist/
      build/
      .git/
      *.min.js
      *.min.css
      vendor/
      tmp/
      .bundle/
    ]
  end

  def load_ignore_file(file_path)
    File.readlines(file_path, chomp: true)
        .reject { |line| line.strip.empty? || line.start_with?('#') }
        .map(&:strip)
  rescue StandardError => e
    log "Error loading ignore file #{file_path}: #{e.message}", level: :error
    []
  end

  def matches_skip_pattern?(file_path, pattern)
    # Simplified pattern matching - obvious and maintainable
    if pattern.end_with?('/')
      # Directory pattern
      file_path.start_with?(pattern[0..-2])
    elsif pattern.include?('*')
      # Simple glob pattern using Ruby's built-in File.fnmatch
      File.fnmatch(pattern, file_path)
    else
      # Exact match or basename match
      file_path == pattern || File.basename(file_path) == pattern
    end
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

  def detect_formatter
    extension = File.extname(current_file_path).downcase

    # Simple, obvious formatter detection
    case extension
    when '.rb'
      command_available?('rubocop') ? { name: 'RuboCop', command: 'rubocop', args: ['-A'] } : nil
    when '.js', '.jsx', '.ts', '.tsx'
      if command_available?('prettier')
        { name: 'Prettier', command: 'prettier', args: ['--write'] }
      elsif command_available?('eslint')
        { name: 'ESLint', command: 'eslint', args: ['--fix'] }
      end
    when '.py'
      if command_available?('black')
        { name: 'Black', command: 'black', args: [] }
      elsif command_available?('autopep8')
        { name: 'autopep8', command: 'autopep8', args: ['--in-place'] }
      end
    when '.go'
      command_available?('gofmt') ? { name: 'gofmt', command: 'gofmt', args: ['-w'] } : nil
    when '.rs'
      command_available?('rustfmt') ? { name: 'rustfmt', command: 'rustfmt', args: [] } : nil
    when '.json'
      command_available?('jq') ? { name: 'jq', command: 'jq', args: ['.', '--indent', '2'] } : nil
    when '.yml', '.yaml'
      command_available?('yq') ? { name: 'yq', command: 'yq', args: ['eval', '--inplace', '--indent', '2'] } : nil
    when '.css', '.scss', '.md'
      command_available?('prettier') ? { name: 'Prettier', command: 'prettier', args: ['--write'] } : nil
    end
  end

  def command_available?(command)
    # Cache command availability to avoid repeated system calls
    @command_cache ||= {}

    return @command_cache[command] if @command_cache.key?(command)

    @command_cache[command] = system("which #{command} > /dev/null 2>&1")
  end

  def run_formatter(formatter)
    # Store original content to detect changes
    original_content = File.read(current_file_path)

    if formatter[:name] == 'jq'
      run_jq_formatter
    else
      run_standard_formatter(formatter)
    end.tap do |result|
      # Check if changes were made and report
      if result[:success]
        new_content = File.read(current_file_path)
        result[:changes_made] = original_content != new_content
      end
    end
  rescue StandardError => e
    { success: false, error: e.message }
  end

  def run_standard_formatter(formatter)
    command_parts = [formatter[:command]] + formatter[:args] + [current_file_path]
    command = command_parts.map { |part| Shellwords.escape(part) }.join(' ')

    log "Running: #{command}"

    stdout_err, status = Open3.capture2e(command)

    if status.success?
      { success: true, output: stdout_err }
    else
      { success: false, error: stdout_err.strip }
    end
  end

  def run_jq_formatter
    # Special handling for jq which needs pipe input
    command = "jq . --indent 2 --sort-keys #{Shellwords.escape(current_file_path)}"

    log "Running: #{command}"

    stdout, stderr, status = Open3.capture3(command)

    if status.success?
      File.write(current_file_path, stdout)
      { success: true, output: 'Formatted JSON successfully' }
    else
      { success: false, error: stderr.strip }
    end
  end

  def add_success_feedback(formatter_name)
    # Use output_data hash directly - obvious and DSL-idiomatic
    output_data['feedback'] ||= []
    output_data['feedback'] << "✓ Auto-formatted with #{formatter_name}"
  end

  def add_error_feedback(formatter_name, error)
    output_data['feedback'] ||= []
    output_data['feedback'] << "⚠ Auto-formatting failed (#{formatter_name}): #{error}"
  end
end

# Testing support - claude_hooks DSL pattern
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(AutoFormatHandler) do |input_data|
    input_data['tool_name'] = 'Write'
    input_data['tool_input'] = { 'file_path' => '/tmp/test.rb' }
    input_data['tool_response'] = { 'success' => true }
    input_data['session_id'] = 'test-session-01'

    # Create a test file for demonstration
    File.write('/tmp/test.rb', "def hello\nputs 'world'\nend")
  end
end
