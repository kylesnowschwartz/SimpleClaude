# frozen_string_literal: true

require 'open3'
require 'shellwords'

# Shared infrastructure for file-handling hooks (auto-format, lint-check, etc.)
#
# Expects the includer to provide:
#   - cwd    (from ClaudeHooks::Base - project working directory)
#   - log    (from ClaudeHooks::Base - logging method)
#
# Provides skip-pattern matching, git-ignore awareness, command availability
# caching, and path utilities shared across handlers.

module FileHandlerSupport
  DEFAULT_SKIP_PATTERNS = %w[
    node_modules/
    dist/
    build/
    .git/
    *.min.js
    *.min.css
    vendor/
    tmp/
    .bundle/
    .cloned-sources/
    .worktrees/
    .agent-history/
  ].freeze

  # Check if a file should be skipped by pattern match or git-ignore.
  # Accepts an absolute or relative path.
  def should_skip_file?(absolute_path)
    return false unless absolute_path

    rel = relative_file_path(absolute_path)

    if skip_patterns.any? { |pattern| matches_skip_pattern?(rel, pattern) }
      log "Skipping #{rel} - matches ignore pattern"
      return true
    end

    if git_ignored?(absolute_path)
      log "Skipping #{rel} - git-ignored"
      return true
    end

    false
  end

  # Uses git check-ignore to respect .gitignore + global gitignore.
  # Returns false in non-git directories or on any error.
  def git_ignored?(absolute_path)
    return false unless cwd
    return false unless File.directory?(File.join(cwd, '.git'))

    system('git', 'check-ignore', '-q', absolute_path.to_s, chdir: cwd,
                                                            out: File::NULL, err: File::NULL)
  end

  # Cached which-check. Uses Open3 array form to avoid shell interpolation.
  def command_available?(command)
    @command_cache ||= {}
    return @command_cache[command] if @command_cache.key?(command)

    path, status = Open3.capture2('which', command)
    @command_cache[command] = status.success? && !path.strip.empty?
  end

  # Returns the path relative to cwd. Falls back to the absolute path
  # if it's outside the project tree.
  def relative_file_path(absolute_path)
    expanded = File.expand_path(absolute_path)
    prefix = "#{cwd}/"
    expanded.start_with?(prefix) ? expanded.delete_prefix(prefix) : expanded
  end

  # Override point - subclasses can append project-specific patterns.
  def skip_patterns
    DEFAULT_SKIP_PATTERNS
  end

  # Pattern matching: directory patterns use include? for nested matches,
  # glob patterns use File.fnmatch, and everything else is exact/basename.
  def matches_skip_pattern?(file_path, pattern)
    if pattern.end_with?('/')
      # Directory pattern - match anywhere in the path (nested matches)
      file_path.include?("#{pattern.chomp('/')}/") || file_path.start_with?(pattern.chomp('/'))
    elsif pattern.include?('*')
      File.fnmatch(pattern, file_path, File::FNM_PATHNAME)
    else
      file_path == pattern || File.basename(file_path) == pattern
    end
  end
end
