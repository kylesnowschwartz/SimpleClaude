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
module FileHandlerSupport # rubocop:disable Metrics/ModuleLength
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
    .playwright-cli/
  ].freeze

  # Per-subprocess deadline. A single hung tool would otherwise blow Claude
  # Code's whole-hook timeout and lose every other handler's output with it.
  COMMAND_TIMEOUT_SECONDS = 30

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

  # Pattern matching: directory patterns match whole path segments at any
  # depth (build/ skips build/foo.rs and src/build/foo.rs, but not build.rs),
  # glob patterns use File.fnmatch, and everything else is exact/basename.
  def matches_skip_pattern?(file_path, pattern)
    if pattern.end_with?('/')
      file_path.split('/').include?(pattern.chomp('/'))
    elsif pattern.include?('*')
      File.fnmatch(pattern, file_path, File::FNM_PATHNAME)
    else
      file_path == pattern || File.basename(file_path) == pattern
    end
  end

  # Formatter registry — maps file extensions to available formatters.
  # Returns nil if no formatter is available for the extension.
  def detect_formatter(file_path)
    case File.extname(file_path).downcase
    when '.rb'
      # -a applies safe corrections only; -A includes unsafe ones that can
      # change runtime semantics, which an unattended hook must not do.
      command_available?('rubocop') ? { name: 'RuboCop', command: 'rubocop', args: ['-a'] } : nil
    when '.md'
      if command_available?('markdownlint')
        # --disable is variadic; the trailing -- stops it from swallowing the file path
        { name: 'markdownlint', command: 'markdownlint',
          args: %w[--fix --disable MD013 MD041 MD026 MD012 MD024 --] }
      end
    when '.sh', '.bash'
      command_available?('shfmt') ? { name: 'shfmt', command: 'shfmt', args: ['-w', '-i', '2'] } : nil
    when '.lua'
      command_available?('stylua') ? { name: 'stylua', command: 'stylua', args: [] } : nil
    when '.rs'
      command_available?('rustfmt') ? { name: 'rustfmt', command: 'rustfmt', args: [] } : nil
    when '.py'
      command_available?('ruff') ? { name: 'ruff', command: 'ruff', args: ['format'] } : nil
    when '.yml', '.yaml'
      detect_yaml_formatter
    when '.js', '.jsx', '.ts', '.tsx'
      detect_js_formatter
    when '.css', '.json'
      # Not eslint for .json: it can't parse plain JSON without extra plugins.
      command_available?('prettier') ? { name: 'prettier', command: 'prettier', args: ['--write'] } : nil
    when '.go'
      detect_go_formatter
    end
  end

  # Open3.capture2e with a hard deadline. Returns [output, Process::Status];
  # on timeout the whole process group is killed and the output is annotated.
  # pgroup: true makes the command a group leader so wrapper-spawned children
  # (npm -> node, cargo -> rustc) die with it instead of holding the pipe open.
  def capture2e_with_timeout(*cmd, chdir:, timeout: COMMAND_TIMEOUT_SECONDS)
    Open3.popen2e(*cmd, chdir: chdir, pgroup: true) do |stdin, stdout_err, wait_thr|
      stdin.close
      reader = Thread.new { stdout_err.read }
      timed_out = wait_thr.join(timeout).nil?
      terminate_process_group(wait_thr) if timed_out

      status = wait_thr.value
      output = drain_output(reader)
      output = "#{output}\n(killed: exceeded #{timeout}s timeout)" if timed_out
      [output, status]
    end
  end

  private

  def terminate_process_group(wait_thr)
    Process.kill('TERM', -wait_thr.pid)
    Process.kill('KILL', -wait_thr.pid) unless wait_thr.join(2)
  rescue Errno::ESRCH
    nil # group exited between the join timeout and the kill
  end

  # Bounded read: even after the command exits, an escaped/daemonized child
  # can inherit the pipe and keep it open — never park the hook on it.
  def drain_output(reader)
    return reader.value if reader.join(2)

    reader.kill
    ''
  end

  def detect_yaml_formatter
    if command_available?('yamlfmt')
      { name: 'yamlfmt', command: 'yamlfmt', args: ['-w'] }
    elsif command_available?('prettier')
      { name: 'prettier', command: 'prettier', args: ['--write', '--parser', 'yaml'] }
    end
  end

  def detect_js_formatter
    if command_available?('eslint')
      { name: 'eslint', command: 'eslint', args: ['--fix'] }
    elsif command_available?('prettier')
      { name: 'prettier', command: 'prettier', args: ['--write'] }
    end
  end

  def detect_go_formatter
    if command_available?('goimports')
      { name: 'goimports', command: 'goimports', args: ['-w'] }
    elsif command_available?('gofmt')
      { name: 'gofmt', command: 'gofmt', args: ['-w'] }
    end
  end

  # Ask git itself rather than testing for a .git directory: .git is a FILE
  # in worktrees, and cwd may be a subdirectory of the repo root.
  def git_repo?
    return false unless cwd
    return @git_repo unless @git_repo.nil?

    out, status = Open3.capture2('git', 'rev-parse', '--is-inside-work-tree',
                                 chdir: cwd, err: File::NULL)
    @git_repo = status.success? && out.strip == 'true'
  end

  def skip_reason_for(rel, absolute_path)
    return 'matches ignore pattern' if matches_any_skip_pattern?(rel)
    return 'git-ignored' if git_ignored?(absolute_path)
    return 'binary file' if binary_file?(absolute_path)

    nil
  end

  # Detect binary files by checking for null bytes in the first 8KB.
  # Catches images, compiled files, etc. that git tracks but formatters choke on.
  def binary_file?(absolute_path)
    return false unless File.exist?(absolute_path)

    chunk = File.binread(absolute_path, 8192)
    return false if chunk.nil? || chunk.empty?

    chunk.include?("\x00")
  rescue StandardError
    false
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

  # Staged + unstaged changes to tracked files. --relative scopes the diff to
  # cwd's subtree and prints cwd-relative paths, so File.join(cwd, f) stays
  # correct when cwd is a repo subdirectory (git otherwise prints
  # repo-root-relative paths). Matches ls-files, which is cwd-relative already.
  def git_diff_files
    output, status = Open3.capture2('git', 'diff', '--name-only', '--relative', 'HEAD', chdir: cwd)
    status.success? ? output.strip.split("\n") : []
  end

  # Untracked files (respects .gitignore)
  def git_untracked_files
    output, status = Open3.capture2('git', 'ls-files', '--others', '--exclude-standard', chdir: cwd)
    status.success? ? output.strip.split("\n") : []
  end
end
