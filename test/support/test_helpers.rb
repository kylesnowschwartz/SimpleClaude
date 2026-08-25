# frozen_string_literal: true

# Shared harness for SimpleClaude's standalone test scripts (test/test_*.rb).
# Same check/FAILURES pattern as test_auto_format_batch.rb: each script is a
# plain ruby executable that prints ok/FAIL lines and exits nonzero on failure.

require 'open3'
require 'fileutils'
require 'tmpdir'

# Keep hook logs out of ~/.claude when tests instantiate handlers.
ENV['RUBY_CLAUDE_HOOKS_LOG_DIR'] ||= File.join(Dir.tmpdir, 'sc-hook-test-logs')

FAILURES = [] # rubocop:disable Style/MutableConstant -- intentional test accumulator

def check(desc)
  ok = yield
  puts ok ? "  ok - #{desc}" : "  FAIL - #{desc}"
  FAILURES << desc unless ok
rescue StandardError => e
  puts "  FAIL - #{desc} (#{e.class}: #{e.message})"
  FAILURES << desc
end

def finish_tests!
  puts
  if FAILURES.empty?
    puts 'PASS'
    exit 0
  else
    puts "FAIL (#{FAILURES.length}): #{FAILURES.join('; ')}"
    exit 1
  end
end

def init_git_repo(dir)
  Open3.capture2('git', 'init', '-q', chdir: dir)
  Open3.capture2('git', '-c', 'user.email=t@t', '-c', 'user.name=t',
                 'commit', '--allow-empty', '-q', '-m', 'init', chdir: dir)
end

# A fixed-outcome stand-in for Process::Status in stubbed subprocess calls.
class FakeStatus
  def initialize(success)
    @success = success
  end

  def success?
    @success
  end

  def exitstatus
    @success ? 0 : 1
  end
end
