#!/usr/bin/env ruby
# frozen_string_literal: true

# Unit tests for LintRunnerSupport: per-project config detection that gates
# each linter, tsc discovery/filtering, and the run_* error-reporting contract.
#
# Run directly: ruby test/test_lint_runner_support.rb

require 'json'
require_relative 'support/test_helpers'
require_relative '../plugins/sc-hooks/hooks/concerns/file_handler_support'
require_relative '../plugins/sc-hooks/hooks/concerns/lint_runner_support'

# Minimal includer satisfying the contract both concerns document.
class LintRunnerHost
  include FileHandlerSupport
  include LintRunnerSupport

  attr_reader :cwd, :logs

  def initialize(cwd)
    @cwd = cwd
    @logs = []
  end

  def log(message, level: :info)
    @logs << { message: message, level: level }
  end
end

def host_with_stubs(dir, available: [], lint_output: nil, lint_success: true)
  host = LintRunnerHost.new(dir)
  host.define_singleton_method(:command_available?) { |cmd| available.include?(cmd) }
  unless lint_output.nil?
    host.define_singleton_method(:capture2e_with_timeout) do |*_cmd, **_kw|
      [lint_output, FakeStatus.new(lint_success)]
    end
  end
  host
end

puts 'test_lint_runner_support.rb'

# --- config detection gates ---
Dir.mktmpdir do |dir|
  host = LintRunnerHost.new(dir)

  check('rubocop not configured without .rubocop.yml') do
    !host.send(:rubocop_configured?)
  end
  check('eslint not configured without config file or package.json key') do
    !host.send(:eslint_configured?)
  end
  check('ruff not configured without ruff.toml or pyproject section') do
    !host.send(:ruff_configured?)
  end
  check('biome not configured without biome.json') do
    !host.send(:biome_configured?)
  end
end

Dir.mktmpdir do |dir|
  File.write(File.join(dir, '.rubocop.yml'), "AllCops:\n  NewCops: enable\n")
  File.write(File.join(dir, 'eslint.config.js'), "export default [];\n")
  File.write(File.join(dir, 'biome.json'), "{}\n")
  File.write(File.join(dir, 'ruff.toml'), "line-length = 100\n")
  host = LintRunnerHost.new(dir)

  check('rubocop configured via .rubocop.yml') { host.send(:rubocop_configured?) }
  check('eslint configured via eslint.config.js') { host.send(:eslint_configured?) }
  check('biome configured via biome.json') { host.send(:biome_configured?) }
  check('ruff configured via ruff.toml') { host.send(:ruff_configured?) }
end

Dir.mktmpdir do |dir|
  File.write(File.join(dir, 'package.json'), JSON.generate({ 'eslintConfig' => {} }))
  host = LintRunnerHost.new(dir)

  check('eslint configured via package.json eslintConfig key') do
    host.send(:eslint_configured?)
  end
end

Dir.mktmpdir do |dir|
  File.write(File.join(dir, 'package.json'), '{ not json')
  File.write(File.join(dir, 'pyproject.toml'), "[tool.poetry]\nname = \"x\"\n")
  host = LintRunnerHost.new(dir)

  check('malformed package.json is treated as not configured') do
    !host.send(:eslint_configured?)
  end
  check('pyproject without [tool.ruff] does not configure ruff') do
    !host.send(:ruff_configured?)
  end
end

Dir.mktmpdir do |dir|
  File.write(File.join(dir, 'pyproject.toml'), "[tool.ruff]\nline-length = 100\n")
  host = LintRunnerHost.new(dir)

  check('pyproject with [tool.ruff] configures ruff') { host.send(:ruff_configured?) }
end

Dir.mktmpdir do |dir|
  File.write(File.join(dir, 'pyproject.toml'), "[tool.ruff.lint]\nselect = [\"E\"]\n")
  host = LintRunnerHost.new(dir)

  check('pyproject with [tool.ruff.lint] subsection configures ruff') do
    host.send(:ruff_configured?)
  end
end

# --- run_* linters: gating and error reporting ---
Dir.mktmpdir do |dir|
  host = host_with_stubs(dir, available: %w[rubocop eslint ruff biome],
                              lint_output: 'should never run', lint_success: false)

  check('run_rubocop returns [] when project has no .rubocop.yml') do
    host.run_rubocop(['a.rb']) == []
  end
  check('run_eslint returns [] when eslint is not configured') do
    host.run_eslint(['a.js']) == []
  end
  check('run_ruff returns [] when ruff is not configured') do
    host.run_ruff(['a.py']) == []
  end
  check('run_biome returns [] when biome is not configured') do
    host.run_biome(['a.js']) == []
  end
end

Dir.mktmpdir do |dir|
  File.write(File.join(dir, '.rubocop.yml'), "AllCops:\n  NewCops: enable\n")

  clean = host_with_stubs(dir, available: %w[rubocop], lint_output: 'no offenses', lint_success: true)
  check('run_rubocop returns [] when the linter passes') do
    clean.run_rubocop(['a.rb']) == []
  end

  dirty = host_with_stubs(dir, available: %w[rubocop],
                               lint_output: "a.rb:1:1: C: Style/Foo\n", lint_success: false)
  check('run_rubocop reports labeled errors when the linter fails') do
    errors = dirty.run_rubocop(['a.rb'])
    errors.length == 1 && errors.first.start_with?('rubocop errors:') &&
      errors.first.include?('Style/Foo')
  end

  missing = host_with_stubs(dir, available: [], lint_output: 'should never run', lint_success: false)
  check('run_rubocop returns [] when rubocop is not installed') do
    missing.run_rubocop(['a.rb']) == []
  end

  raising = host_with_stubs(dir, available: %w[rubocop])
  raising.define_singleton_method(:capture2e_with_timeout) { |*_c, **_k| raise 'boom' }
  check('run_rubocop rescues subprocess errors and logs them') do
    raising.run_rubocop(['a.rb']) == [] &&
      raising.logs.any? { |l| l[:level] == :error && l[:message].include?('boom') }
  end
end

# --- project-wide checks ---
Dir.mktmpdir do |dir|
  host = host_with_stubs(dir, available: %w[cargo go tsc],
                              lint_output: 'should never run', lint_success: false)

  check('run_cargo_check returns [] without Cargo.toml') { host.run_cargo_check == [] }
  check('run_go_vet returns [] without go.mod') { host.run_go_vet == [] }
  check('run_tsc returns [] without tsconfig.json') { host.run_tsc(['a.ts']) == [] }
end

Dir.mktmpdir do |dir|
  File.write(File.join(dir, 'Cargo.toml'), "[package]\nname = \"x\"\n")
  File.write(File.join(dir, 'go.mod'), "module x\n")
  host = host_with_stubs(dir, available: %w[cargo go],
                              lint_output: 'error[E0308]: mismatched types', lint_success: false)

  check('run_cargo_check reports labeled errors on failure') do
    errors = host.run_cargo_check
    errors.length == 1 && errors.first.start_with?('cargo check errors:')
  end
  check('run_go_vet reports labeled errors on failure') do
    errors = host.run_go_vet
    errors.length == 1 && errors.first.start_with?('go vet errors:')
  end
end

# --- tsc discovery and modified-file filtering ---
Dir.mktmpdir do |dir|
  local_bin = File.join(dir, 'node_modules', '.bin')
  FileUtils.mkdir_p(local_bin)
  local_tsc = File.join(local_bin, 'tsc')
  File.write(local_tsc, "#!/bin/sh\nexit 0\n")
  FileUtils.chmod(0o755, local_tsc)

  host = host_with_stubs(dir, available: [])
  check('find_tsc prefers project-local node_modules/.bin/tsc') do
    host.send(:find_tsc) == local_tsc
  end
end

Dir.mktmpdir do |dir|
  global = host_with_stubs(dir, available: %w[tsc])
  check('find_tsc falls back to global tsc') { global.send(:find_tsc) == 'tsc' }

  none = host_with_stubs(dir, available: [])
  check('find_tsc returns nil when no tsc exists') { none.send(:find_tsc).nil? }
end

Dir.mktmpdir do |dir|
  File.write(File.join(dir, 'tsconfig.json'), "{}\n")
  tsc_output = <<~OUT
    src/touched.ts(3,7): error TS2322: Type 'string' is not assignable to type 'number'.
    src/legacy.ts(9,1): error TS2304: Cannot find name 'legacyThing'.
  OUT
  host = host_with_stubs(dir, available: %w[tsc], lint_output: tsc_output, lint_success: false)

  errors = host.run_tsc([File.join(dir, 'src/touched.ts')])
  check('run_tsc keeps errors in modified files') do
    errors.length == 1 && errors.first.include?('TS2322')
  end
  check('run_tsc drops pre-existing errors in untouched files') do
    !errors.first.include?('TS2304')
  end

  untouched = host.run_tsc([File.join(dir, 'src/other.ts')])
  check('run_tsc returns [] when all errors are in untouched files') { untouched == [] }
end

finish_tests!
