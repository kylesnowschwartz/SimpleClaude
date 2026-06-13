#!/usr/bin/env ruby
# frozen_string_literal: true

# Regression test for the Stop-hook auto-format performance bug.
#
# The bug: AutoFormatHandler#format_files spawned one formatter subprocess PER
# FILE, serially. With a dirty tree of N markdown files, that meant N cold
# markdownlint (Node) starts every Stop — ~90s and over the hook timeout.
#
# These tests pin the fix:
#   1. group_by_formatter collapses same-formatter files into ONE group
#   2. format_files runs exactly ONE subprocess for N markdown files
#   3. the wall-clock budget short-circuits remaining batches when exhausted
#
# Run directly: ruby test/test_auto_format_batch.rb
# markdownlint must be on PATH (skips with a clear message otherwise).

require 'open3'
require 'fileutils'
require 'tmpdir'

HANDLER = File.expand_path('../plugins/sc-hooks/hooks/handlers/auto_format_handler.rb', __dir__)
require HANDLER

FAILURES = [] # rubocop:disable Style/MutableConstant -- intentional test accumulator

def check(desc)
  ok = yield
  puts ok ? "  ok - #{desc}" : "  FAIL - #{desc}"
  FAILURES << desc unless ok
rescue StandardError => e
  puts "  FAIL - #{desc} (#{e.class}: #{e.message})"
  FAILURES << desc
end

def markdownlint?
  _out, status = Open3.capture2('which', 'markdownlint')
  status.success?
rescue StandardError
  false
end

# Build a handler bound to `dir`, with a counter that records every
# capture2e_with_timeout invocation (one per formatter batch).
def handler_for(dir)
  input = {
    'session_id' => 'auto-format-batch-test',
    'cwd' => dir,
    'transcript_path' => File.join(dir, 'transcript.jsonl'),
    'hook_event_name' => 'Stop',
    'stop_hook_active' => false
  }
  handler = AutoFormatHandler.new(input)
  calls = []
  handler.define_singleton_method(:capture2e_with_timeout) do |*cmd, **kw|
    calls << { cmd: cmd, timeout: kw[:timeout] }
    super(*cmd, **kw)
  end
  [handler, calls]
end

def write_ugly_markdown(dir, count)
  count.times.map do |i|
    path = File.join(dir, "note_#{i}.md")
    # Trailing spaces (MD009) + no final newline (MD047) are both enabled and
    # auto-fixable, so markdownlint --fix is guaranteed to change the file.
    File.write(path, "# Note #{i}   \n\nsome body text   ")
    path
  end
end

puts 'test_auto_format_batch.rb'

unless markdownlint?
  puts '  SKIP - markdownlint not on PATH'
  exit 0
end

# --- Test 1: grouping collapses same-formatter files into one group ---
Dir.mktmpdir do |dir|
  md = write_ugly_markdown(dir, 5)
  rb = File.join(dir, 'thing.rb')
  File.write(rb, "x=1\n")

  handler, = handler_for(dir)
  groups = handler.send(:group_by_formatter, md + [rb])

  md_group = groups.find { |formatter, _| formatter[:name] == 'markdownlint' }
  check('5 markdown files collapse into a single markdownlint group') do
    md_group && md_group[1].length == 5
  end
  check('rubocop and markdownlint are distinct groups') do
    groups.keys.map { |f| f[:name] }.uniq.length == groups.length && groups.length >= 1
  end
end

# --- Test 2: N markdown files => exactly ONE subprocess, all formatted ---
Dir.mktmpdir do |dir|
  Open3.capture2('git', 'init', '-q', chdir: dir)
  Open3.capture2('git', '-c', 'user.email=t@t', '-c', 'user.name=t',
                 'commit', '--allow-empty', '-q', '-m', 'init', chdir: dir)
  paths = write_ugly_markdown(dir, 6)
  before = paths.to_h { |p| [p, File.read(p)] }

  handler, calls = handler_for(dir)
  handler.call

  check('exactly one formatter subprocess for 6 markdown files') do
    calls.length == 1
  end
  check('all 6 markdown files were actually reformatted') do
    paths.all? { |p| File.read(p) != before[p] }
  end
  check('the single invocation passed all 6 files as arguments') do
    calls.length == 1 && (paths - calls.first[:cmd]).empty?
  end
  check('batch timeout is within the per-command ceiling') do
    t = calls.first&.dig(:timeout)
    t&.positive? && t <= FileHandlerSupport::COMMAND_TIMEOUT_SECONDS
  end
end

# --- Test 3: exhausted wall-clock budget short-circuits remaining batches ---
Dir.mktmpdir do |dir|
  Open3.capture2('git', 'init', '-q', chdir: dir)
  Open3.capture2('git', '-c', 'user.email=t@t', '-c', 'user.name=t',
                 'commit', '--allow-empty', '-q', '-m', 'init', chdir: dir)
  paths = write_ugly_markdown(dir, 3)
  before = paths.to_h { |p| [p, File.read(p)] }

  handler, calls = handler_for(dir)
  # First read sets the deadline at t=0+budget; every later read jumps past it,
  # so the budget check trips before any batch runs.
  reads = [0]
  handler.define_singleton_method(:monotonic_now) do
    reads[0] += 1
    reads[0] == 1 ? 0.0 : 10_000.0
  end
  handler.call

  check('no subprocess runs once the budget is exhausted') do
    calls.empty?
  end
  check('files are left untouched when the budget is exhausted') do
    paths.all? { |p| File.read(p) == before[p] }
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
