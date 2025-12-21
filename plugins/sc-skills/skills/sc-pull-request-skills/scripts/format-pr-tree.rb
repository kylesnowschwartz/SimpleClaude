#!/usr/bin/env ruby
# frozen_string_literal: true

# Formats PR comment threads as ASCII trees
# Usage: get-pr-comments.sh <PR> | format-pr-tree.rb

require 'json'

def format_tree(data)
  return 'No PR data' unless data
  return 'All review threads resolved.' if data['threads'].empty?

  lines = []
  lines << data['title'].to_s
  lines << data['url']
  lines << ''

  data['threads'].each_with_index do |thread, idx|
    path = thread['path']
    line_num = thread['line']
    location = line_num ? "#{path}:#{line_num}" : path

    lines << location

    comments = thread['comments'] || []
    comments.each_with_index do |comment, cidx|
      last_comment = cidx == comments.length - 1
      prefix = '    ' * cidx
      last_comment && cidx == comments.length - 1 ? '└── ' : '├── '
      branch = '└── ' # All comments are sequential replies, so always use └──

      author = comment['author']
      body = comment['body'].to_s.strip

      lines << "#{prefix}#{branch}@#{author}:"
      body.each_line do |body_line|
        lines << "#{prefix}    #{body_line.rstrip}"
      end
    end

    lines << '' unless idx == data['threads'].length - 1
  end

  lines.join("\n")
end

if __FILE__ == $PROGRAM_NAME
  input = ARGF.read
  data = JSON.parse(input)
  puts format_tree(data)
end
