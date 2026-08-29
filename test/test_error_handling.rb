#!/usr/bin/env ruby
# frozen_string_literal: true

require 'fileutils'
require 'tmpdir'
require_relative '../scripts/install'
require_relative '../plugins/sc-hooks/hooks/concerns/lint_runner_support'

FAILURES = [] # rubocop:disable Style/MutableConstant

def check(description)
  passed = yield
  puts passed ? "  ok - #{description}" : "  FAIL - #{description}"
  FAILURES << description unless passed
rescue StandardError => e
  puts "  FAIL - #{description} (#{e.class}: #{e.message})"
  FAILURES << description
end

def with_home(home)
  previous = Dir.home
  ENV['HOME'] = home
  yield
ensure
  ENV['HOME'] = previous
end

class LintRunnerHarness
  include LintRunnerSupport

  attr_reader :logs

  def initialize
    @logs = []
  end

  def cwd
    Dir.pwd
  end

  def command_available?(_command)
    true
  end

  def capture2e_with_timeout(*)
    raise Errno::ENOENT, 'missing executable'
  end

  def log(message, level:)
    @logs << [level, message]
  end

  private

  def rubocop_configured?
    true
  end
end

puts 'test_error_handling.rb'

check('installer command failures raise with exit status and command context') do
  installer = SimpleClaude::Installer.new(force: true)
  installer.send(:run_cmd, 'sh', '-c', 'exit 7')
  false
rescue SimpleClaude::InstallError => e
  e.message.include?('exit 7') && e.message.include?('sh')
end

check('malformed plugin registries stop installation') do
  Dir.mktmpdir do |home|
    registry = File.join(home, '.claude', 'plugins', 'installed_plugins.json')
    FileUtils.mkdir_p(File.dirname(registry))
    File.write(registry, '{invalid')

    with_home(home) do
      SimpleClaude::Installer.new(force: true).send(:plugin_installed?, 'sc-hooks')
    end
  end
  false
rescue SimpleClaude::InstallError => e
  e.message.include?('Unable to read plugin registry')
end

check('plugin registries require an object root') do
  ['null', '[]'].all? do |contents|
    begin
      Dir.mktmpdir do |home|
        registry = File.join(home, '.claude', 'plugins', 'installed_plugins.json')
        FileUtils.mkdir_p(File.dirname(registry))
        File.write(registry, contents)

        with_home(home) do
          SimpleClaude::Installer.new(force: true).send(:plugin_installed?, 'sc-hooks')
        end
      end
    rescue SimpleClaude::InstallError => e
      next e.message.include?('Plugin registry has no valid root object')
    end

    false
  end
end

check('linter startup failures are returned as actionable lint errors') do
  harness = LintRunnerHarness.new
  errors = harness.run_rubocop(['example.rb'])
  errors.one? && errors.first.include?('rubocop failed to run') &&
    harness.logs.any? { |level, message| level == :error && message == errors.first }
end

puts
if FAILURES.empty?
  puts 'PASS'
  exit 0
else
  puts "FAIL (#{FAILURES.length}): #{FAILURES.join('; ')}"
  exit 1
end
