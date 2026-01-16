#!/usr/bin/env ruby
# frozen_string_literal: true

# Formats PR comment threads as ASCII trees
# Usage: get-pr-comments.sh <PR> | format-pr-tree.rb

require 'json'

def format_tree(data)
  return 'No PR data' unless data

  pr_comments = data['prComments'] || []
  threads = data['threads'] || []

  return 'All review threads resolved.' if pr_comments.empty? && threads.empty?

  lines = []
  lines << data['title'].to_s
  lines << data['url']
  lines << ''

  # PR-level comments (not attached to files)
  unless pr_comments.empty?
    lines << 'PR Comments'
    pr_comments.each do |comment|
      author = comment['author']
      body = comment['body'].to_s.strip

      lines << "└── @#{author}:"
      body.each_line do |body_line|
        lines << "    #{body_line.rstrip}"
      end
    end
    lines << '' unless threads.empty?
  end

  # File-level review threads
  threads.each_with_index do |thread, idx|
    path = thread['path']
    line_num = thread['line']
    location = line_num ? "#{path}:#{line_num}" : path
    location += ' [RESOLVED]' if thread['isResolved']

    lines << location

    comments = thread['comments'] || []
    comments.each_with_index do |comment, cidx|
      prefix = '    ' * cidx

      author = comment['author']
      body = comment['body'].to_s.strip

      lines << "#{prefix}└── @#{author}:"
      body.each_line do |body_line|
        lines << "#{prefix}    #{body_line.rstrip}"
      end
    end

    lines << '' unless idx == threads.length - 1
  end

  lines.join("\n")
end

if __FILE__ == $PROGRAM_NAME
  input = ARGF.read
  data = JSON.parse(input)
  puts format_tree(data)
end
