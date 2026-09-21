#!/usr/bin/env ruby
# frozen_string_literal: true

# Tests for project-local executable resolution.
#
# tool_command prefers the project's own copy of a tool (bin/,
# node_modules/.bin/, .venv/bin/, venv/bin/) over whatever the same name
# resolves to on PATH, so formatters and linters run at the version the
# project pins. With no project copy it falls back to the bare name on PATH.
#
# Run directly: ruby test/test_tool_command.rb

require 'fileutils'
require 'tmpdir'
require_relative '../plugins/sc-hooks/hooks/concerns/file_handler_support'
require_relative '../plugins/sc-hooks/hooks/concerns/lint_runner_support'

FAILURES = [] # rubocop:disable Style/MutableConstant -- intentional test accumulator

def check(description)
  passed = yield
  puts passed ? "  ok - #{description}" : "  FAIL - #{description}"
  FAILURES << description unless passed
rescue StandardError => e
  puts "  FAIL - #{description} (#{e.class}: #{e.message})"
  FAILURES << description
end

# Mirrors LintCheckHandler's concern set, with subprocess launches recorded
# instead of run.
class ToolCommandHarness
  include FileHandlerSupport
  include LintRunnerSupport

  attr_reader :cwd, :calls, :logs, :path_checks

  # on_path: either true/false for every tool, or a list of tool names.
  def initialize(cwd, on_path: [])
    @cwd = cwd
    @on_path = on_path
    @calls = []
    @logs = []
    @path_checks = []
  end

  def command_available?(command)
    @path_checks << command
    @on_path == true || (@on_path.respond_to?(:include?) && @on_path.include?(command))
  end

  def capture2e_with_timeout(*cmd, **kwargs)
    @calls << { cmd: cmd, kwargs: kwargs }
    ['', SuccessStatus.new]
  end

  def log(message, level: :info)
    @logs << [level, message]
  end

  # Stands in for the Process::Status a real subprocess would return.
  class SuccessStatus
    def success?
      true
    end
  end
end

def write_executable(dir, relative_path, mode: 0o755)
  path = File.join(dir, relative_path)
  FileUtils.mkdir_p(File.dirname(path))
  File.write(path, "#!/bin/sh\n")
  File.chmod(mode, path)
  path
end

puts 'test_tool_command.rb'

# --- bin/ binstubs beat a global install ---
Dir.mktmpdir do |dir|
  binstub = write_executable(dir, 'bin/rubocop')
  harness = ToolCommandHarness.new(dir, on_path: true)

  check('bin/rubocop resolves to the project binstub even when rubocop is on PATH') do
    harness.tool_command('rubocop') == binstub
  end
end

# --- node_modules/.bin ---
Dir.mktmpdir do |dir|
  local_eslint = write_executable(dir, 'node_modules/.bin/eslint')
  harness = ToolCommandHarness.new(dir)

  check('node_modules/.bin/eslint resolves to the project copy') do
    harness.tool_command('eslint') == local_eslint
  end
end

# --- Python virtualenvs, both spellings ---
Dir.mktmpdir do |dir|
  local_ruff = write_executable(dir, '.venv/bin/ruff')
  check('.venv/bin/ruff resolves to the project copy') do
    ToolCommandHarness.new(dir).tool_command('ruff') == local_ruff
  end
end

Dir.mktmpdir do |dir|
  local_ruff = write_executable(dir, 'venv/bin/ruff')
  check('venv/bin/ruff resolves to the project copy when .venv is absent') do
    ToolCommandHarness.new(dir).tool_command('ruff') == local_ruff
  end
end

# --- search order ---
Dir.mktmpdir do |dir|
  binstub = write_executable(dir, 'bin/prettier')
  write_executable(dir, 'node_modules/.bin/prettier')

  check('bin/ wins over node_modules/.bin/ when both have the tool') do
    ToolCommandHarness.new(dir).tool_command('prettier') == binstub
  end
end

# --- non-executable files are not candidates ---
Dir.mktmpdir do |dir|
  write_executable(dir, 'bin/shfmt', mode: 0o644)
  harness = ToolCommandHarness.new(dir, on_path: ['shfmt'])

  check('a non-executable bin/shfmt is ignored in favour of PATH') do
    harness.tool_command('shfmt') == 'shfmt'
  end
end

# --- PATH fallback ---
Dir.mktmpdir do |dir|
  check('a tool with no project copy falls back to the bare name on PATH') do
    ToolCommandHarness.new(dir, on_path: ['stylua']).tool_command('stylua') == 'stylua'
  end

  check('a tool that is neither local nor on PATH resolves to nil') do
    ToolCommandHarness.new(dir, on_path: []).tool_command('stylua').nil?
  end
end

# --- memoization ---
Dir.mktmpdir do |dir|
  harness = ToolCommandHarness.new(dir, on_path: ['yamlfmt'])
  3.times { harness.tool_command('yamlfmt') }

  check('repeated lookups check PATH once') do
    harness.path_checks == ['yamlfmt']
  end
end

# --- detect_formatter composes the resolved command ---
Dir.mktmpdir do |dir|
  binstub = write_executable(dir, 'bin/rubocop')
  harness = ToolCommandHarness.new(dir, on_path: true)

  check('detect_formatter uses the binstub path for a .rb file') do
    harness.detect_formatter(File.join(dir, 'thing.rb')) ==
      { name: 'RuboCop', command: binstub, args: ['-a'] }
  end
end

# --- a project-local candidate outranks the preferred tool on PATH ---
Dir.mktmpdir do |dir|
  local_prettier = write_executable(dir, 'node_modules/.bin/prettier')
  harness = ToolCommandHarness.new(dir, on_path: %w[eslint prettier])

  check('detect_formatter on .js prefers local prettier over eslint on PATH') do
    harness.detect_formatter(File.join(dir, 'app.js')) ==
      { name: 'prettier', command: local_prettier, args: ['--write'] }
  end
end

Dir.mktmpdir do |dir|
  local_eslint = write_executable(dir, 'node_modules/.bin/eslint')
  write_executable(dir, 'node_modules/.bin/prettier')
  harness = ToolCommandHarness.new(dir)

  check('detect_formatter on .js keeps eslint first when both are local') do
    harness.detect_formatter(File.join(dir, 'app.js')) ==
      { name: 'eslint', command: local_eslint, args: ['--fix'] }
  end
end

Dir.mktmpdir do |dir|
  harness = ToolCommandHarness.new(dir, on_path: %w[eslint prettier])

  check('detect_formatter on .js keeps eslint first when both are only on PATH') do
    harness.detect_formatter(File.join(dir, 'app.js')) == { name: 'eslint', command: 'eslint', args: ['--fix'] }
  end
end

# --- run_rubocop spawns the binstub in the project directory ---
Dir.mktmpdir do |dir|
  binstub = write_executable(dir, 'bin/rubocop')
  File.write(File.join(dir, '.rubocop.yml'), "AllCops:\n  NewCops: enable\n")
  harness = ToolCommandHarness.new(dir, on_path: true)
  harness.run_rubocop([File.join(dir, 'thing.rb')])

  check('run_rubocop spawns the binstub with --format simple') do
    harness.calls.length == 1 &&
      harness.calls.first[:cmd] == [binstub, '--format', 'simple', File.join(dir, 'thing.rb')]
  end
  check('run_rubocop spawns in the project directory') do
    harness.calls.first[:kwargs][:chdir] == dir
  end
end

# --- run_tsc uses the project TypeScript compiler ---
Dir.mktmpdir do |dir|
  local_tsc = write_executable(dir, 'node_modules/.bin/tsc')
  File.write(File.join(dir, 'tsconfig.json'), '{}')
  harness = ToolCommandHarness.new(dir, on_path: true)
  harness.run_tsc([])

  check('run_tsc spawns node_modules/.bin/tsc with --noEmit') do
    harness.calls.length == 1 && harness.calls.first[:cmd] == [local_tsc, '--noEmit']
  end
end

puts
if FAILURES.empty?
  puts 'PASS'
  exit 0
else
  puts "FAIL (#{FAILURES.length}): #{FAILURES.join('; ')}"
  exit 1
end
