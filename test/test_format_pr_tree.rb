#!/usr/bin/env ruby
# frozen_string_literal: true

# Unit tests for format-pr-tree.rb: the sc-refactor script that renders PR
# review JSON (from get-pr-comments.sh) as an ASCII tree.
#
# Run directly: ruby test/test_format_pr_tree.rb

require 'json'
require_relative 'support/test_helpers'
require_relative '../plugins/sc-refactor/scripts/format-pr-tree'

puts 'test_format_pr_tree.rb'

# --- degenerate inputs ---
check('nil data reports no PR data') { format_tree(nil) == 'No PR data' }
check('empty sections report all threads resolved') do
  format_tree({ 'title' => 'T', 'url' => 'u' }) == 'All review threads resolved.'
end

# --- reviews section ---
review_data = {
  'title' => 'Add feature',
  'url' => 'https://github.com/o/r/pull/1',
  'reviews' => [
    { 'author' => 'alice', 'state' => 'APPROVED', 'body' => "LGTM\nnice work  " }
  ]
}
review_out = format_tree(review_data)

check('header shows title then url') do
  review_out.lines.first(2).map(&:chomp) == ['Add feature', 'https://github.com/o/r/pull/1']
end
check('review renders author, state, and indented body') do
  review_out.include?('Reviews') &&
    review_out.include?('└── @alice (APPROVED):') &&
    review_out.include?('    LGTM') &&
    review_out.include?('    nice work')
end
check('body lines are right-stripped') do
  review_out.lines.none? { |l| l.chomp.end_with?(' ') }
end

# --- PR-level comments section ---
comment_out = format_tree(
  'title' => 'T', 'url' => 'u',
  'prComments' => [{ 'author' => 'bob', 'body' => 'ping' }]
)
check('PR comments render under their own heading') do
  comment_out.include?('PR Comments') && comment_out.include?('└── @bob:') &&
    comment_out.include?('    ping')
end

# --- file threads: location, resolution marker, nesting ---
thread_data = {
  'title' => 'T', 'url' => 'u',
  'threads' => [
    {
      'path' => 'lib/foo.rb', 'line' => 12, 'isResolved' => false,
      'comments' => [
        { 'author' => 'alice', 'body' => 'rename this' },
        { 'author' => 'bob', 'body' => 'done' }
      ]
    },
    { 'path' => 'README.md', 'line' => nil, 'isResolved' => true,
      'comments' => [{ 'author' => 'carol', 'body' => 'typo' }] }
  ]
}
thread_out = format_tree(thread_data)

check('thread location renders as path:line') { thread_out.include?('lib/foo.rb:12') }
check('line-less thread renders bare path') do
  thread_out.match?(/^README\.md \[RESOLVED\]$/)
end
check('resolved threads carry the [RESOLVED] marker') do
  thread_out.include?('README.md [RESOLVED]') && !thread_out.include?('lib/foo.rb:12 [RESOLVED]')
end
check('replies nest one level deeper per comment') do
  lines = thread_out.lines.map(&:chomp)
  first = lines.index('└── @alice:')
  reply = lines.index('    └── @bob:')
  first && reply && reply > first && lines[reply + 1] == '        done'
end
check('threads are separated by blank lines, without a trailing one') do
  lines = thread_out.lines.map(&:chomp)
  lines.include?('') && lines.last == '    typo'
end

# --- all sections together keep their order ---
full_out = format_tree(
  'title' => 'T', 'url' => 'u',
  'reviews' => [{ 'author' => 'a', 'state' => 'COMMENTED', 'body' => 'r' }],
  'prComments' => [{ 'author' => 'b', 'body' => 'c' }],
  'threads' => [{ 'path' => 'f.rb', 'line' => 1,
                  'comments' => [{ 'author' => 'c', 'body' => 't' }] }]
)
check('sections appear in reviews, comments, threads order') do
  reviews_at = full_out.index('Reviews')
  comments_at = full_out.index('PR Comments')
  threads_at = full_out.index('f.rb:1')
  reviews_at && comments_at && threads_at &&
    reviews_at < comments_at && comments_at < threads_at
end

# --- CLI: stdin JSON to stdout tree ---
script = File.expand_path('../plugins/sc-refactor/scripts/format-pr-tree.rb', __dir__)
stdout, status = Open3.capture2('ruby', script, stdin_data: JSON.generate(review_data))
check('script reads JSON on stdin and prints the tree') do
  status.success? && stdout.include?('└── @alice (APPROVED):')
end

finish_tests!
