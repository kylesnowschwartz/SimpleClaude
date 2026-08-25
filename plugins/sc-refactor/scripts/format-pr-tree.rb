#!/usr/bin/env ruby
# frozen_string_literal: true

# Formats PR comment threads as ASCII trees
# Usage: get-pr-comments.sh <PR> | format-pr-tree.rb

require 'json'

# One comment rendered as a tree node: an "@author" header followed by its
# indented body. `suffix` annotates the header (e.g. a review state) and
# `prefix` indents the whole node for nested replies.
def comment_node(author, body, suffix: nil, prefix: '')
  lines = ["#{prefix}└── @#{author}#{suffix}:"]
  body.to_s.strip.each_line { |body_line| lines << "#{prefix}    #{body_line.rstrip}" }
  lines
end

def format_section(title, comments, suffix_key: nil)
  return [] if comments.empty?

  nodes = comments.flat_map do |comment|
    suffix = suffix_key ? " (#{comment[suffix_key]})" : nil
    comment_node(comment['author'], comment['body'], suffix: suffix)
  end
  [title] + nodes
end

def format_thread(thread)
  path = thread['path']
  line_num = thread['line']
  location = line_num ? "#{path}:#{line_num}" : path
  location += ' [RESOLVED]' if thread['isResolved']

  nodes = (thread['comments'] || []).each_with_index.flat_map do |comment, cidx|
    comment_node(comment['author'], comment['body'], prefix: '    ' * cidx)
  end
  [location] + nodes
end

def format_tree(data)
  return 'No PR data' unless data

  reviews = data['reviews'] || []
  pr_comments = data['prComments'] || []
  threads = data['threads'] || []

  return 'All review threads resolved.' if reviews.empty? && pr_comments.empty? && threads.empty?

  lines = [data['title'].to_s, data['url'], '']

  # Review bodies (main substantive feedback)
  lines += format_section('Reviews', reviews, suffix_key: 'state')
  lines << '' unless reviews.empty? || pr_comments.empty? || threads.empty?

  # PR-level comments (not attached to files)
  lines += format_section('PR Comments', pr_comments)
  lines << '' unless pr_comments.empty? || threads.empty?

  # File-level review threads
  threads.each_with_index do |thread, idx|
    lines += format_thread(thread)
    lines << '' unless idx == threads.length - 1
  end

  lines.join("\n")
end

if __FILE__ == $PROGRAM_NAME
  input = ARGF.read
  data = JSON.parse(input)
  puts format_tree(data)
end
