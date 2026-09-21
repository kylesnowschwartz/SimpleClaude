#!/usr/bin/env ruby
# frozen_string_literal: true

# Regression test for running RuboCop through the project's bundle.
#
# The bug: both the formatter registry and the lint runner shelled out to a
# bare `rubocop`. In a Bundler project that resolves the globally installed
# rubocop, whose version can differ from the one Gemfile.lock pins; plugins
# declared in .rubocop.yml are then activated against the wrong core and abort
# with "Unable to activate rubocop-rspec-3.10.2, because rubocop-1.86.0
# conflicts with rubocop (~> 1.86, >= 1.86.2)". That is not a lint finding, so
# the lint handler reported it on every Stop and nothing Claude changed in the
# project could clear it.
#
# These tests pin the fix:
#   1. Gemfile.lock lists rubocop and `bundle check` passes => bundle exec rubocop
#   2. anything less falls back to the bare binary (or nil when none is installed)
#   3. the decision is memoized: one `bundle check` per handler, however many files
#   4. detect_formatter and run_rubocop both compose the chosen command
#
# Run directly: ruby test/test_rubocop_command.rb

require 'fileutils'
require 'tmpdir'
require_relative '../plugins/sc-hooks/hooks/concerns/file_handler_support'
require_relative '../plugins/sc-hooks/hooks/concerns/lint_runner_support'

FAILURES = [] # rubocop:disable Style/MutableConstant -- intentional test accumulator

def check(desc)
  ok = yield
  puts ok ? "  ok - #{desc}" : "  FAIL - #{desc}"
  FAILURES << desc unless ok
rescue StandardError => e
  puts "  FAIL - #{desc} (#{e.class}: #{e.message})"
  FAILURES << desc
end

FakeStatus = Struct.new(:ok) do
  def success?
    ok
  end
end

# Includes both concerns the way LintCheckHandler does. Subprocesses are
# recorded rather than spawned; `bundle check` answers with a canned status.
class RubocopCommandHarness
  include FileHandlerSupport
  include LintRunnerSupport

  attr_reader :cwd, :calls

  def initialize(cwd, available:, bundle_satisfied: true)
    @cwd = cwd
    @available = available
    @bundle_satisfied = bundle_satisfied
    @calls = []
  end

  def command_available?(command)
    @available.include?(command)
  end

  def capture2e_with_timeout(*cmd, **)
    @calls << cmd
    ['', FakeStatus.new(cmd.first(2) == %w[bundle check] ? @bundle_satisfied : true)]
  end

  def log(*); end
end

BUNDLED_LOCKFILE = <<~LOCK
  GEM
    remote: https://rubygems.org/
    specs:
      rubocop (1.90.0)
        rubocop-ast (>= 1.47.1, < 2.0)
      rubocop-ast (1.47.1)
      rubocop-rspec (3.10.2)
        rubocop (~> 1.86, >= 1.86.2)

  DEPENDENCIES
    rubocop
    rubocop-rspec
LOCK

# rubocop appears only as a dependency of rubocop-rspec (6-space indent) and in
# DEPENDENCIES (2-space indent) — neither is a bundled rubocop spec.
UNBUNDLED_LOCKFILE = <<~LOCK
  GEM
    remote: https://rubygems.org/
    specs:
      rubocop-ast (1.47.1)
      rubocop-rspec (3.10.2)
        rubocop (~> 1.86, >= 1.86.2)

  DEPENDENCIES
    rubocop
LOCK

def bundle_checks(harness)
  harness.calls.count { |cmd| cmd.first(2) == %w[bundle check] }
end

def bundle?
  _out, status = Open3.capture2('which', 'bundle')
  status.success?
rescue StandardError
  false
end

puts 'test_rubocop_command.rb'

# --- Bundled rubocop wins when the bundle is installed ---
Dir.mktmpdir do |dir|
  File.write(File.join(dir, 'Gemfile.lock'), BUNDLED_LOCKFILE)
  File.write(File.join(dir, '.rubocop.yml'), "AllCops:\n  NewCops: enable\n")
  harness = RubocopCommandHarness.new(dir, available: %w[bundle rubocop])

  check('Gemfile.lock with rubocop and a satisfied bundle => bundle exec rubocop') do
    harness.send(:rubocop_command) == %w[bundle exec rubocop]
  end
  check('bundle check runs in the project directory') do
    bundle_checks(harness) == 1
  end
  check('formatter registry composes bundle exec rubocop -a') do
    formatter = harness.detect_formatter(File.join(dir, 'thing.rb'))
    formatter == { name: 'RuboCop', command: 'bundle', args: %w[exec rubocop -a] }
  end
  check('lint runner invokes bundle exec rubocop --format simple <files>') do
    harness.calls.clear
    file = File.join(dir, 'thing.rb')
    result = harness.run_rubocop([file])
    result == [] && harness.calls.last == ['bundle', 'exec', 'rubocop', '--format', 'simple', file]
  end
  check('decision is memoized across formatter lookups and lint runs') do
    3.times { |i| harness.detect_formatter(File.join(dir, "file_#{i}.rb")) }
    harness.run_rubocop([File.join(dir, 'thing.rb')])
    bundle_checks(harness).zero?
  end
end

# --- Fallbacks to the bare binary ---
Dir.mktmpdir do |dir|
  File.write(File.join(dir, 'Gemfile.lock'), BUNDLED_LOCKFILE)
  harness = RubocopCommandHarness.new(dir, available: %w[bundle rubocop], bundle_satisfied: false)

  check('bundle listed but not installed (bundle check fails) => bare rubocop') do
    harness.send(:rubocop_command) == ['rubocop']
  end
end

Dir.mktmpdir do |dir|
  File.write(File.join(dir, 'Gemfile.lock'), UNBUNDLED_LOCKFILE)
  harness = RubocopCommandHarness.new(dir, available: %w[bundle rubocop])

  check('Gemfile.lock without a rubocop spec => bare rubocop') do
    harness.send(:rubocop_command) == ['rubocop']
  end
  check('no bundle check is spawned when rubocop is not bundled') do
    bundle_checks(harness).zero?
  end
end

Dir.mktmpdir do |dir|
  harness = RubocopCommandHarness.new(dir, available: %w[bundle rubocop])

  check('no Gemfile.lock => bare rubocop') do
    harness.send(:rubocop_command) == ['rubocop']
  end
end

Dir.mktmpdir do |dir|
  File.write(File.join(dir, 'Gemfile.lock'), BUNDLED_LOCKFILE)
  harness = RubocopCommandHarness.new(dir, available: %w[rubocop])

  check('bundle not on PATH => bare rubocop even with a bundled lockfile') do
    harness.send(:rubocop_command) == ['rubocop']
  end
end

Dir.mktmpdir do |dir|
  harness = RubocopCommandHarness.new(dir, available: [])

  check('neither bundle nor rubocop installed => nil') do
    harness.send(:rubocop_command).nil?
  end
  check('formatter registry yields no RuboCop formatter') do
    harness.detect_formatter(File.join(dir, 'thing.rb')).nil?
  end
  check('lint runner skips rubocop') do
    File.write(File.join(dir, '.rubocop.yml'), '')
    harness.run_rubocop([File.join(dir, 'thing.rb')]) == []
  end
end

# --- Real `bundle check` against an unsatisfiable lockfile ---
if bundle?
  Dir.mktmpdir do |dir|
    File.write(File.join(dir, 'Gemfile'), "source 'https://rubygems.org'\ngem 'rubocop'\n")
    File.write(File.join(dir, 'Gemfile.lock'), BUNDLED_LOCKFILE.sub('1.90.0', '999.0.0'))
    harness = RubocopCommandHarness.new(dir, available: %w[bundle rubocop])
    harness.define_singleton_method(:capture2e_with_timeout) do |*cmd, **kw|
      calls << cmd
      FileHandlerSupport.instance_method(:capture2e_with_timeout).bind_call(self, *cmd, **kw)
    end

    check('a real bundle check against missing gems falls back to bare rubocop') do
      harness.send(:rubocop_command) == ['rubocop']
    end
  end
else
  puts '  SKIP - bundle not on PATH (real bundle check)'
end

puts
if FAILURES.empty?
  puts 'PASS'
  exit 0
else
  puts "FAIL (#{FAILURES.length}): #{FAILURES.join('; ')}"
  exit 1
end
