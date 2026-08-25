#!/usr/bin/env ruby
# frozen_string_literal: true

# Unit tests for GitHubUrlHandler: the PreToolUse hook that injects gh/opensrc
# hints for github.com WebFetches. Pins the soft-nudge contract — advisory
# additionalContext only, never a permission decision — and the URL filters.
#
# Run directly: ruby test/test_github_url_handler.rb

require_relative 'support/test_helpers'
require_relative '../plugins/sc-hooks/hooks/handlers/github_url_handler'

def run_handler(url = nil, tool_input: nil, opensrc: false)
  tool_input ||= { 'url' => url }
  handler = GitHubUrlHandler.new(
    'session_id' => 'github-url-test',
    'cwd' => Dir.pwd,
    'transcript_path' => '/nonexistent/transcript.jsonl',
    'hook_event_name' => 'PreToolUse',
    'tool_name' => 'WebFetch',
    'tool_input' => tool_input,
    'tool_use_id' => 'toolu_test'
  )
  handler.define_singleton_method(:opensrc_available?) { opensrc }
  handler.call
  handler.output_data
end

def additional_context(output_data)
  output_data.dig('hookSpecificOutput', 'additionalContext')
end

puts 'test_github_url_handler.rb'

# --- URLs that must NOT trigger the hint ---
check('non-github URL adds no hint') do
  additional_context(run_handler('https://example.com/owner/repo')).nil?
end
check('raw.githubusercontent.com adds no hint') do
  additional_context(run_handler('https://raw.githubusercontent.com/o/r/main/README.md')).nil?
end
check('gist.githubusercontent.com adds no hint') do
  additional_context(run_handler('https://gist.githubusercontent.com/o/abc/raw/f.txt')).nil?
end
check('/raw/ style blob URL adds no hint') do
  additional_context(run_handler('https://github.com/o/r/raw/main/README.md')).nil?
end
check('empty url adds no hint') do
  additional_context(run_handler('')).nil?
end
check('non-hash tool_input adds no hint') do
  additional_context(run_handler(tool_input: 'https://github.com/o/r')).nil?
end
check('github.com root page (no repo path) adds no hint') do
  additional_context(run_handler('https://github.com/')).nil?
end

# --- repo-shaped URLs get advisory context ---
repo_output = run_handler('https://github.com/kylesnowschwartz/SimpleClaude')
repo_context = additional_context(repo_output)

check('repo URL injects additionalContext') { !repo_context.nil? }
check('hint includes gh repo view for owner/repo') do
  repo_context.include?('gh repo view kylesnowschwartz/SimpleClaude')
end
check('hint includes README and file-tree gh api commands') do
  repo_context.include?('repos/kylesnowschwartz/SimpleClaude/readme') &&
    repo_context.include?('git/trees/HEAD')
end
check('hint is phrased conditionally, not as a block') do
  repo_context.start_with?('If this github.com URL is a repository')
end
check('hint never sets a permission decision') do
  !repo_output['hookSpecificOutput'].key?('permissionDecision')
end
check('hint does not stop the tool call') do
  repo_output['continue'] == true
end
check('www.github.com is treated like github.com') do
  ctx = additional_context(run_handler('https://www.github.com/o/r'))
  ctx&.include?('gh repo view o/r')
end

# --- issue / PR URLs add a targeted command line ---
check('issue URL suggests gh issue view with number and repo') do
  ctx = additional_context(run_handler('https://github.com/o/r/issues/42'))
  ctx&.include?('gh issue view 42 -R o/r')
end
check('pull URL suggests gh pr view with number and repo') do
  ctx = additional_context(run_handler('https://github.com/o/r/pull/7'))
  ctx&.include?('gh pr view 7 -R o/r')
end
check('plain repo URL has no issue/PR line') do
  !repo_context.include?('gh issue view') && !repo_context.include?('gh pr view')
end

# --- opensrc availability toggles its line ---
check('opensrc line appears when the CLI is on PATH') do
  ctx = additional_context(run_handler('https://github.com/o/r', opensrc: true))
  ctx&.include?('opensrc path o/r')
end
check('opensrc line is omitted when the CLI is missing') do
  !repo_context.include?('opensrc')
end

# --- URL parsing keeps interpolated commands shell-safe ---
check('shell metacharacters in the repo segment do not reach the hint') do
  ctx = additional_context(run_handler('https://github.com/o/repo$(rm%20-rf)/issues/1'))
  ctx.nil? || !ctx.include?('$(')
end

finish_tests!
