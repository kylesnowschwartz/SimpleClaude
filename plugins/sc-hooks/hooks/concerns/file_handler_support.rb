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
  def should_skip_file?(absolute_path)
    return false unless absolute_path

    rel = relative_file_path(absolute_path)
    skip_reason = skip_reason_for(rel, absolute_path)
    log("Skipping #{rel} - #{skip_reason}") if skip_reason
    !skip_reason.nil?
  end

  # Uses git check-ignore to respect .gitignore + global gitignore.
  # Returns false in non-git directories or on any error.
  def git_ignored?(absolute_path)
    return false unless git_repo?

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

  # Override point — subclasses can append project-specific patterns.
  def skip_patterns
    DEFAULT_SKIP_PATTERNS
  end

  # Returns absolute paths of files modified since HEAD (staged + unstaged + untracked),
  # filtered through skip checks. Requires a git repo at cwd.
  def git_modified_files
    return [] unless git_repo?

    collect_and_filter_modified_files
  end

  # Pattern matching: directory patterns use include? for nested matches,
  # glob patterns use File.fnmatch, and everything else is exact/basename.
  def matches_skip_pattern?(file_path, pattern)
    if pattern.end_with?('/')
      dir = pattern.chomp('/')
      file_path.include?("#{dir}/") || file_path.start_with?(dir)
    elsif pattern.include?('*')
      File.fnmatch(pattern, file_path, File::FNM_PATHNAME)
    else
      file_path == pattern || File.basename(file_path) == pattern
    end
  end

  private

  def git_repo?
    cwd && File.directory?(File.join(cwd, '.git'))
  end

  def skip_reason_for(rel, absolute_path)
    return 'matches ignore pattern' if matches_any_skip_pattern?(rel)
    return 'git-ignored' if git_ignored?(absolute_path)

    nil
  end

  def matches_any_skip_pattern?(rel)
    skip_patterns.any? { |pattern| matches_skip_pattern?(rel, pattern) }
  end

  def collect_and_filter_modified_files
    (git_diff_files + git_untracked_files)
      .reject(&:empty?)
      .uniq
      .map { |f| File.join(cwd, f) }
      .select { |f| File.exist?(f) }
      .reject { |f| should_skip_file?(f) }
  end

  # Staged + unstaged changes to tracked files
  def git_diff_files
    output, status = Open3.capture2('git', 'diff', '--name-only', 'HEAD', chdir: cwd)
    status.success? ? output.strip.split("\n") : []
  end

  # Untracked files (respects .gitignore)
  def git_untracked_files
    output, status = Open3.capture2('git', 'ls-files', '--others', '--exclude-standard', chdir: cwd)
    status.success? ? output.strip.split("\n") : []
  end
end
