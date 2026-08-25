#!/usr/bin/env ruby
# frozen_string_literal: true

# Unit tests for LintCheckHandler: the Stop hook that reruns linters over
# Claude-modified files. Pins the retry guard, the clean-stop paths, the
# extension-based linter dispatch, and error reporting/truncation.
#
# Run directly: ruby test/test_lint_check_handler.rb

require_relative 'support/test_helpers'
require_relative '../plugins/sc-hooks/hooks/handlers/lint_check_handler'

def build_handler(dir, stop_hook_active: false)
  LintCheckHandler.new(
    'session_id' => 'lint-check-test',
    'cwd' => dir,
    'transcript_path' => File.join(dir, 'transcript.jsonl'),
    'hook_event_name' => 'Stop',
    'stop_hook_active' => stop_hook_active
  )
end

puts 'test_lint_check_handler.rb'

# --- retry guard: stop_hook_active must allow a clean stop ---
Dir.mktmpdir do |dir|
  handler = build_handler(dir, stop_hook_active: true)
  handler.define_singleton_method(:git_modified_files) { raise 'must not collect files on retry' }
  handler.call

  check('retry (stop_hook_active) never blocks the stop') do
    !handler.output_data.key?('decision')
  end
  check('retry suppresses transcript output') do
    handler.output_data['suppressOutput'] == true
  end
end

# --- nothing modified: clean stop without running linters ---
Dir.mktmpdir do |dir|
  handler = build_handler(dir)
  handler.define_singleton_method(:git_modified_files) { [] }
  handler.define_singleton_method(:collect_lint_errors) { |_files| raise 'must not lint empty set' }
  handler.call

  check('no modified files allows a clean stop') do
    !handler.output_data.key?('decision') && handler.output_data['suppressOutput'] == true
  end
end

# --- clean lint run: stop proceeds ---
Dir.mktmpdir do |dir|
  handler = build_handler(dir)
  handler.define_singleton_method(:git_modified_files) { [File.join(dir, 'a.rb')] }
  handler.define_singleton_method(:collect_lint_errors) { |_files| [] }
  handler.call

  check('clean lint run allows a clean stop') do
    !handler.output_data.key?('decision')
  end
end

# --- lint errors: stop is blocked with instructions ---
Dir.mktmpdir do |dir|
  handler = build_handler(dir)
  handler.define_singleton_method(:git_modified_files) { [File.join(dir, 'a.rb')] }
  handler.define_singleton_method(:collect_lint_errors) do |_files|
    ["rubocop errors:\na.rb:1:1: C: Style/Foo"]
  end
  handler.call

  check('lint errors block the stop') do
    handler.output_data['decision'] == 'block'
  end
  check('block reason contains the fix instruction and the errors') do
    reason = handler.output_data['reason'].to_s
    reason.include?('Fix these before finishing') && reason.include?('Style/Foo')
  end
end

# --- oversized error output is truncated ---
Dir.mktmpdir do |dir|
  handler = build_handler(dir)
  long_error = "eslint errors:\n#{'x' * 5000}"
  handler.define_singleton_method(:git_modified_files) { [File.join(dir, 'a.ts')] }
  handler.define_singleton_method(:collect_lint_errors) { |_files| [long_error] }
  handler.call

  check('oversized error output is truncated with a marker') do
    reason = handler.output_data['reason'].to_s
    reason.include?('... (truncated') &&
      reason.length < long_error.length
  end
end

# --- extension grouping drives which linters run ---
Dir.mktmpdir do |dir|
  handler = build_handler(dir)
  files = %w[a.ts b.tsx c.js d.jsx e.rb f.py g.rs h.go i.md j.unknown]
  groups = handler.send(:group_by_extension, files)

  check('all JS/TS variants group together') do
    groups[:js]&.sort == %w[a.ts b.tsx c.js d.jsx].sort
  end
  check('rb/py/rs/go each get their own group') do
    groups[:rb] == ['e.rb'] && groups[:py] == ['f.py'] &&
      groups[:rs] == ['g.rs'] && groups[:go] == ['h.go']
  end
  check('unlintable extensions are dropped from grouping') do
    !groups.values.flatten.intersect?(['i.md', 'j.unknown'])
  end
end

Dir.mktmpdir do |dir|
  handler = build_handler(dir)
  ran = []
  %i[run_eslint run_biome run_rubocop run_ruff run_tsc].each do |m|
    handler.define_singleton_method(m) do |_files|
      ran << m
      []
    end
  end
  %i[run_cargo_check run_go_vet].each do |m|
    handler.define_singleton_method(m) do
      ran << m
      []
    end
  end

  handler.send(:collect_lint_errors, %w[a.rb b.py])
  check('only linters for present extensions are invoked') do
    ran.sort == %i[run_rubocop run_ruff].sort
  end

  ran.clear
  handler.send(:collect_lint_errors, %w[a.ts b.rs c.go])
  check('JS files trigger eslint, biome, and tsc; rs/go trigger cargo/vet') do
    ran.sort == %i[run_eslint run_biome run_tsc run_cargo_check run_go_vet].sort
  end
end

finish_tests!
