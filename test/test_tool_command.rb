#!/usr/bin/env ruby
# frozen_string_literal: true

# Tests for project-local executable resolution.
#
# tool_command prefers the project's own copy of a tool (bin/,
# node_modules/.bin/, .venv/bin/, venv/bin/) over whatever the same name
# resolves to on PATH, so formatters and linters run at the version the
# project pins. For RuboCop it then tries the project's bundle, and finally
# falls back to the bare name on PATH. It returns an argv array whose first
# element may be an environment Hash, or nil.
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
  # bundle_probe: canned answer for `bundle exec <tool> --version` — :ok,
  #   :fail, or :raises.
  # real_subprocesses: spawn for real instead of answering from the canned set.
  # reset_cache: start from an empty module-level resolution cache. Pass false
  #   to model a second handler in the same Stop.
  def initialize(cwd, on_path: [], bundle_probe: :fail, real_subprocesses: false, reset_cache: true)
    FileHandlerSupport.reset_tool_command_cache! if reset_cache
    @cwd = cwd
    @on_path = on_path
    @bundle_probe = bundle_probe
    @real_subprocesses = real_subprocesses
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
    return spawn_for_real(cmd, kwargs) if @real_subprocesses
    return answer_bundle_probe if bundle_probe?(cmd)

    ['', ExitStatus.new(0)]
  end

  # Probe calls recorded so far, as {env:, argv:, kwargs:}.
  def bundle_probes
    @calls.select { |call| bundle_probe?(call[:cmd]) }.map do |call|
      env, argv = split_env(call[:cmd])
      { env: env, argv: argv, kwargs: call[:kwargs] }
    end
  end

  # Anything spawned that is not the probe.
  def tool_calls
    @calls.reject { |call| bundle_probe?(call[:cmd]) }
  end

  def log(message, level: :info)
    @logs << [level, message]
  end

  # Stands in for the Process::Status a real subprocess would return.
  class ExitStatus
    attr_reader :exitstatus

    def initialize(exitstatus)
      @exitstatus = exitstatus
    end

    def success?
      @exitstatus.zero?
    end
  end

  private

  # The probe is the only bundle launch that ends in --version.
  def bundle_probe?(cmd)
    _env, argv = split_env(cmd)
    argv.first(2) == %w[bundle exec] && argv.last == '--version'
  end

  # Open3 takes an optional env hash ahead of the argv.
  def split_env(cmd)
    cmd.first.is_a?(Hash) ? [cmd.first, cmd[1..]] : [nil, cmd]
  end

  def answer_bundle_probe
    raise Errno::ENOENT, 'bundle' if @bundle_probe == :raises

    ['', ExitStatus.new(@bundle_probe == :ok ? 0 : 1)]
  end

  # Reaches past this class's stub to the implementation under test.
  def spawn_for_real(cmd, kwargs)
    FileHandlerSupport.instance_method(:capture2e_with_timeout).bind_call(self, *cmd, **kwargs)
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
    harness.tool_command('rubocop') == [binstub]
  end
end

# --- node_modules/.bin ---
Dir.mktmpdir do |dir|
  local_eslint = write_executable(dir, 'node_modules/.bin/eslint')
  harness = ToolCommandHarness.new(dir)

  check('node_modules/.bin/eslint resolves to the project copy') do
    harness.tool_command('eslint') == [local_eslint]
  end
end

# --- Python virtualenvs, both spellings ---
Dir.mktmpdir do |dir|
  local_ruff = write_executable(dir, '.venv/bin/ruff')
  check('.venv/bin/ruff resolves to the project copy') do
    ToolCommandHarness.new(dir).tool_command('ruff') == [local_ruff]
  end
end

Dir.mktmpdir do |dir|
  local_ruff = write_executable(dir, 'venv/bin/ruff')
  check('venv/bin/ruff resolves to the project copy when .venv is absent') do
    ToolCommandHarness.new(dir).tool_command('ruff') == [local_ruff]
  end
end

# --- search order ---
Dir.mktmpdir do |dir|
  binstub = write_executable(dir, 'bin/prettier')
  write_executable(dir, 'node_modules/.bin/prettier')

  check('bin/ wins over node_modules/.bin/ when both have the tool') do
    ToolCommandHarness.new(dir).tool_command('prettier') == [binstub]
  end
end

# --- non-executable files are not candidates ---
Dir.mktmpdir do |dir|
  write_executable(dir, 'bin/shfmt', mode: 0o644)
  harness = ToolCommandHarness.new(dir, on_path: ['shfmt'])

  check('a non-executable bin/shfmt is ignored in favour of PATH') do
    harness.tool_command('shfmt') == ['shfmt']
  end
end

# --- PATH fallback ---
Dir.mktmpdir do |dir|
  check('a tool with no project copy falls back to the bare name on PATH') do
    ToolCommandHarness.new(dir, on_path: ['stylua']).tool_command('stylua') == ['stylua']
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
      { name: 'RuboCop', argv: [binstub, '-a'] }
  end
end

# --- a project-local candidate outranks the preferred tool on PATH ---
Dir.mktmpdir do |dir|
  local_prettier = write_executable(dir, 'node_modules/.bin/prettier')
  harness = ToolCommandHarness.new(dir, on_path: %w[eslint prettier])

  check('detect_formatter on .js prefers local prettier over eslint on PATH') do
    harness.detect_formatter(File.join(dir, 'app.js')) ==
      { name: 'prettier', argv: [local_prettier, '--write'] }
  end
end

Dir.mktmpdir do |dir|
  local_eslint = write_executable(dir, 'node_modules/.bin/eslint')
  write_executable(dir, 'node_modules/.bin/prettier')
  harness = ToolCommandHarness.new(dir)

  check('detect_formatter on .js keeps eslint first when both are local') do
    harness.detect_formatter(File.join(dir, 'app.js')) ==
      { name: 'eslint', argv: [local_eslint, '--fix'] }
  end
end

Dir.mktmpdir do |dir|
  harness = ToolCommandHarness.new(dir, on_path: %w[eslint prettier])

  check('detect_formatter on .js keeps eslint first when both are only on PATH') do
    harness.detect_formatter(File.join(dir, 'app.js')) == { name: 'eslint', argv: %w[eslint --fix] }
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

# --- the project bundle sits between the binstub and PATH, for rubocop only ---
def write_gemfile(dir, name: 'Gemfile', body: "source 'https://rubygems.org'\ngem 'rubocop'\n")
  path = File.join(dir, name)
  File.write(path, body)
  path
end

def bundled_rubocop(gemfile)
  [{ 'BUNDLE_GEMFILE' => gemfile }, 'bundle', 'exec', 'rubocop']
end

Dir.mktmpdir do |dir|
  gemfile = write_gemfile(dir)
  harness = ToolCommandHarness.new(dir, on_path: %w[bundle rubocop], bundle_probe: :ok)
  resolved = harness.tool_command('rubocop')
  probe = harness.bundle_probes.first

  check('a bundle that runs rubocop resolves to bundle exec rubocop') do
    resolved == bundled_rubocop(gemfile)
  end
  check('the exec argv pins BUNDLE_GEMFILE to the project gemfile') do
    resolved.first == { 'BUNDLE_GEMFILE' => gemfile }
  end
  check('the probe launches the tool rather than inspecting the lockfile') do
    probe && probe[:argv] == %w[bundle exec rubocop --version]
  end
  check('the probe runs frozen and against the same gemfile') do
    probe && probe[:env] == { 'BUNDLE_GEMFILE' => gemfile, 'BUNDLE_FROZEN' => 'true' }
  end
  check('the probe runs in the project directory') do
    probe && probe[:kwargs][:chdir] == dir
  end
end

Dir.mktmpdir do |dir|
  gemfile = write_gemfile(dir, name: 'gems.rb')
  harness = ToolCommandHarness.new(dir, on_path: %w[bundle rubocop], bundle_probe: :ok)

  check('gems.rb is accepted as the project gemfile') do
    harness.tool_command('rubocop') == bundled_rubocop(gemfile)
  end
end

Dir.mktmpdir do |dir|
  binstub = write_executable(dir, 'bin/rubocop')
  write_gemfile(dir)
  harness = ToolCommandHarness.new(dir, on_path: %w[bundle rubocop], bundle_probe: :ok)

  check('a bin/rubocop binstub wins over the bundle') do
    harness.tool_command('rubocop') == [binstub]
  end
  check('no probe is spawned when a binstub already answers') do
    harness.bundle_probes.empty?
  end
end

Dir.mktmpdir do |dir|
  write_gemfile(dir)

  check('a failing probe falls back to rubocop on PATH') do
    ToolCommandHarness.new(dir, on_path: %w[bundle rubocop])
                      .tool_command('rubocop') == ['rubocop']
  end
  check('a failing probe with no rubocop on PATH resolves to nil') do
    ToolCommandHarness.new(dir, on_path: ['bundle'])
                      .tool_command('rubocop').nil?
  end
end

Dir.mktmpdir do |dir|
  harness = ToolCommandHarness.new(dir, on_path: %w[bundle rubocop], bundle_probe: :ok)

  check('no gemfile means no probe and a PATH fallback') do
    harness.tool_command('rubocop') == ['rubocop'] && harness.bundle_probes.empty?
  end
end

Dir.mktmpdir do |dir|
  write_gemfile(dir)
  harness = ToolCommandHarness.new(dir, on_path: ['rubocop'], bundle_probe: :ok)

  check('bundle missing from PATH means no probe and a PATH fallback') do
    harness.tool_command('rubocop') == ['rubocop'] && harness.bundle_probes.empty?
  end
end

Dir.mktmpdir do |dir|
  write_gemfile(dir)
  harness = ToolCommandHarness.new(dir, on_path: %w[bundle rubocop], bundle_probe: :raises)

  check('a probe that raises falls back to PATH instead of escaping') do
    harness.tool_command('rubocop') == ['rubocop']
  end
  check('a probe that raises is logged as a warning') do
    harness.logs.any? { |level, message| level == :warn && message.include?('bundle exec rubocop --version') }
  end
end

Dir.mktmpdir do |dir|
  write_gemfile(dir)
  harness = ToolCommandHarness.new(dir, on_path: %w[bundle rubocop], bundle_probe: :ok)
  3.times { harness.tool_command('rubocop') }

  check('repeated lookups probe the bundle once') do
    harness.bundle_probes.length == 1
  end
end

# --- the resolution cache spans every handler in one Stop ---
Dir.mktmpdir do |dir|
  gemfile = write_gemfile(dir)
  first = ToolCommandHarness.new(dir, on_path: %w[bundle rubocop], bundle_probe: :ok)
  second = ToolCommandHarness.new(dir, on_path: %w[bundle rubocop], bundle_probe: :ok, reset_cache: false)
  resolutions = [first.tool_command('rubocop'), second.tool_command('rubocop')]

  check('a second handler on the same directory reuses the first resolution') do
    first.bundle_probes.length == 1 && second.bundle_probes.empty?
  end
  check('both handlers get the same launcher') do
    resolutions == [bundled_rubocop(gemfile), bundled_rubocop(gemfile)]
  end
end

Dir.mktmpdir do |dir|
  gemfile = write_gemfile(dir)
  harness = ToolCommandHarness.new(dir, on_path: %w[bundle rubocop], bundle_probe: :ok)

  check('detect_formatter on .rb carries the bundle launcher and its env') do
    harness.detect_formatter(File.join(dir, 'thing.rb')) ==
      { name: 'RuboCop', argv: bundled_rubocop(gemfile) + ['-a'] }
  end
end

Dir.mktmpdir do |dir|
  gemfile = write_gemfile(dir)
  File.write(File.join(dir, '.rubocop.yml'), "AllCops:\n  NewCops: enable\n")
  harness = ToolCommandHarness.new(dir, on_path: %w[bundle rubocop], bundle_probe: :ok)
  harness.run_rubocop([File.join(dir, 'thing.rb')])

  check('run_rubocop spawns bundle exec rubocop --format simple') do
    harness.tool_calls.length == 1 &&
      harness.tool_calls.first[:cmd] ==
        bundled_rubocop(gemfile) + ['--format', 'simple', File.join(dir, 'thing.rb')]
  end
end

Dir.mktmpdir do |dir|
  write_gemfile(dir)
  File.write(File.join(dir, 'eslint.config.js'), 'export default [];')
  harness = ToolCommandHarness.new(dir, on_path: %w[bundle eslint], bundle_probe: :ok)
  harness.run_eslint([File.join(dir, 'app.js')])

  check('a non-Ruby tool never probes the bundle') do
    harness.tool_command('eslint') == ['eslint'] && harness.bundle_probes.empty?
  end
end

# --- real Bundler launches ---
# These run the actual probe rather than a canned status, so the exit-code
# contract and the frozen-mode guarantee are checked against Bundler itself.
#
# Bundler passes BUNDLE_GEMFILE and RUBYOPT to children; inherited from this
# test process they would point the probe at the wrong bundle.
def without_ambient_bundler(&block)
  require 'bundler'
  Bundler.with_unbundled_env(&block)
rescue LoadError
  %w[BUNDLE_GEMFILE RUBYOPT RUBYLIB].each { |key| ENV.delete(key) }
  block.call
end

def install_local_bundle(dir)
  installed = without_ambient_bundler do
    system('bundle', 'lock', '--local', chdir: dir, out: File::NULL, err: File::NULL) &&
      system('bundle', 'install', '--local', chdir: dir, out: File::NULL, err: File::NULL)
  end
  drop_checksums_section(File.join(dir, 'Gemfile.lock')) if installed
  installed
end

# A lock resolved with --local carries an empty CHECKSUMS entry, which frozen
# mode rejects before it ever looks for the executable. Dropping the section
# leaves the probe failing for the reason the test is about.
def drop_checksums_section(lock)
  File.write(lock, File.read(lock).sub(/\nCHECKSUMS\n(?:.*\n)*?\n/, "\n"))
end

if system('which', 'bundle', out: File::NULL, err: File::NULL)
  Dir.mktmpdir do |dir|
    write_gemfile(dir)
    lock = File.join(dir, 'Gemfile.lock')
    File.write(lock, <<~LOCK)
      GEM
        remote: https://rubygems.org/
        specs:
          rubocop (999.0.0)

      PLATFORMS
        ruby

      DEPENDENCIES
        rubocop
    LOCK
    lock_before = File.binread(lock)
    harness = ToolCommandHarness.new(dir, on_path: %w[bundle rubocop], real_subprocesses: true)
    resolved = without_ambient_bundler { harness.tool_command('rubocop') }

    check('a real probe against an uninstallable bundle falls back to PATH') do
      harness.bundle_probes.length == 1 && resolved == ['rubocop']
    end
    check('a real probe leaves Gemfile.lock untouched') do
      File.binread(lock) == lock_before
    end
  end

  # rubocop-ast is a different gem that `bundle show rubocop` would match by
  # name, and whose bundle cannot run the rubocop executable.
  Dir.mktmpdir do |dir|
    write_gemfile(dir, body: "source 'https://rubygems.org'\ngem 'rubocop-ast', '1.46.0'\n")
    installed = install_local_bundle(dir)
    harness = ToolCommandHarness.new(dir, on_path: %w[bundle rubocop], real_subprocesses: true)
    resolved = without_ambient_bundler { harness.tool_command('rubocop') }

    check('a bundle holding only rubocop-ast falls back to rubocop on PATH') do
      installed && harness.bundle_probes.length == 1 && resolved == ['rubocop']
    end
  end
else
  puts '  skip - real bundle probes (bundle is not on PATH)'
end

puts
if FAILURES.empty?
  puts 'PASS'
  exit 0
else
  puts "FAIL (#{FAILURES.length}): #{FAILURES.join('; ')}"
  exit 1
end
