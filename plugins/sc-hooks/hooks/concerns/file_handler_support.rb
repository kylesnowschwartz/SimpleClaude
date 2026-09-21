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

  # Directories, relative to the project root, where a project keeps its own
  # copies of tools: Bundler binstubs and Rails scripts in bin/, npm/yarn/pnpm
  # in node_modules/.bin/, Python virtualenvs in .venv/bin/ or venv/bin/.
  PROJECT_BIN_DIRS = ['bin', 'node_modules/.bin', '.venv/bin', 'venv/bin'].freeze

  # Tools a project can pin through its Gemfile rather than a bin directory,
  # and so are worth asking Bundler about before falling back to PATH.
  BUNDLER_MANAGED_TOOLS = %w[rubocop].freeze

  # The two names Bundler accepts for a project's gem manifest.
  GEMFILE_NAMES = %w[Gemfile gems.rb].freeze

  # Resolving a tool can cost a Bundler launch, and every handler in one Stop
  # asks the same question of the same directory, so answers live on the module
  # instead of the instance. A Stop is a single Ruby process, which makes that
  # process the cache's lifetime.
  def self.tool_command_cache
    @tool_command_cache ||= {}
  end

  def self.reset_tool_command_cache!
    @tool_command_cache = {}
  end

  # Check if a file should be skipped by pattern match or git-ignore.
  def should_skip_file?(absolute_path)
    return false unless absolute_path

    rel = relative_file_path(absolute_path)
    skip_reason = skip_reason_for(rel, absolute_path)
    log("Skipping #{rel} - #{skip_reason}") if skip_reason
    !skip_reason.nil?
  end

  # Uses git check-ignore to respect .gitignore + global gitignore.
  def git_ignored?(absolute_path)
    return false unless git_repo?

    _output, error, status = Open3.capture3('git', 'check-ignore', '-q', absolute_path.to_s, chdir: cwd)
    return true if status.success?
    return false if status.exitstatus == 1

    raise "git check-ignore failed (exit #{status.exitstatus}): #{error.strip}"
  end

  # Cached which-check. Uses Open3 array form to avoid shell interpolation.
  def command_available?(command)
    @command_cache ||= {}
    return @command_cache[command] if @command_cache.key?(command)

    path, status = Open3.capture2('which', command)
    @command_cache[command] = status.success? && !path.strip.empty?
  end

  # Argv to run a tool with, or nil when no copy is reachable. In order: the
  # project's own copy, then `bundle exec` for a tool the project's bundle
  # supplies, then the bare name on PATH. A version the project pins wins over
  # a global install regardless of which is newer.
  #
  # The first element may be an environment Hash, which Open3 accepts ahead of
  # the argv, so callers splat the whole thing into capture2e_with_timeout.
  def tool_command(tool)
    cache = FileHandlerSupport.tool_command_cache
    key = [cwd, tool]
    return cache[key] if cache.key?(key)

    cache[key] = resolve_tool_command(tool)
  end

  # Absolute path to the project's own copy of a tool, or nil. Missing and
  # unreadable paths are absent as far as File.file? and File.executable? are
  # concerned, so a project without the tool simply yields nil.
  def project_tool_path(tool)
    @project_tool_paths ||= {}
    return @project_tool_paths[tool] if @project_tool_paths.key?(tool)

    @project_tool_paths[tool] = search_project_bin_dirs(tool)
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
      formatter_entry('RuboCop', 'rubocop', ['-a'])
    when '.md'
      # --disable is variadic; the trailing -- stops it from swallowing the file path
      formatter_entry('markdownlint', 'markdownlint', %w[--fix --disable MD013 MD041 MD026 MD012 MD024 --])
    when '.sh', '.bash'
      formatter_entry('shfmt', 'shfmt', ['-w', '-i', '2'])
    when '.lua'
      formatter_entry('stylua', 'stylua', [])
    when '.rs'
      formatter_entry('rustfmt', 'rustfmt', [])
    when '.py'
      formatter_entry('ruff', 'ruff', ['format'])
    when '.yml', '.yaml'
      detect_yaml_formatter
    when '.js', '.jsx', '.ts', '.tsx'
      detect_js_formatter
    when '.css', '.json'
      # Not eslint for .json: it can't parse plain JSON without extra plugins.
      formatter_entry('prettier', 'prettier', ['--write'])
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

  def resolve_tool_command(tool)
    local = project_tool_path(tool)
    return [local] if local

    bundled_tool_command(tool) || (command_available?(tool) ? [tool] : nil)
  end

  # `bundle exec <tool>` when the project's bundle can actually run the tool,
  # else nil. Finding a gemfile is a cheap gate on the launch below.
  def bundled_tool_command(tool)
    return nil unless BUNDLER_MANAGED_TOOLS.include?(tool)

    gemfile = project_gemfile
    return nil unless gemfile
    return nil unless command_available?('bundle')

    bundle_runs?(tool, gemfile) ? [bundle_exec_env(gemfile), 'bundle', 'exec', tool] : nil
  end

  def project_gemfile
    return nil unless cwd

    GEMFILE_NAMES.map { |name| File.join(cwd, name) }.find { |path| File.file?(path) }
  end

  # Launching the tool is the only reliable test. Gemfile.lock cannot say
  # whether the bundle is installed, whether the group holding the tool is
  # excluded, or whether all the bundle really has is a name-similar gem such
  # as rubocop-ast. Frozen mode keeps the launch from rewriting Gemfile.lock
  # when the Gemfile has drifted, and a drifted bundle exits nonzero, which is
  # the right answer anyway.
  def bundle_runs?(tool, gemfile)
    env = bundle_exec_env(gemfile).merge('BUNDLE_FROZEN' => 'true')
    output, status = capture2e_with_timeout(env, 'bundle', 'exec', tool, '--version', chdir: cwd)
    return true if status.success?

    log("bundle cannot run #{tool}, using PATH instead: #{output.strip.lines.last.to_s.strip}", level: :info)
    false
  rescue StandardError => e
    log("bundle exec #{tool} --version failed: #{e.class}: #{e.message}", level: :warn)
    false
  end

  # Pinning the gemfile makes the probe and the real run resolve one bundle
  # even when this process inherited a BUNDLE_GEMFILE from somewhere else.
  def bundle_exec_env(gemfile)
    { 'BUNDLE_GEMFILE' => gemfile }
  end

  def search_project_bin_dirs(tool)
    return nil unless cwd

    PROJECT_BIN_DIRS.each do |dir|
      candidate = File.join(cwd, dir, tool)
      return candidate if File.file?(candidate) && File.executable?(candidate)
    end
    nil
  end

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

  # Formatter registry entry for a tool, or nil when the tool cannot be run.
  def formatter_entry(name, tool, args)
    launcher = tool_command(tool)
    return nil unless launcher

    { name: name, argv: launcher + args }
  end

  # Picks from ordered [name, tool, args] candidates. A candidate the project
  # ships its own copy of beats one that is merely on PATH, whatever the
  # preference order, because the project pins the version it wants; among
  # equally-sourced candidates the listed order decides.
  def first_formatter(candidates)
    local = candidates.find { |_name, tool, _args| project_tool_path(tool) }
    chosen = local || candidates.find { |_name, tool, _args| tool_command(tool) }
    return nil unless chosen

    formatter_entry(*chosen)
  end

  def detect_yaml_formatter
    first_formatter([['yamlfmt', 'yamlfmt', ['-w']],
                     ['prettier', 'prettier', ['--write', '--parser', 'yaml']]])
  end

  def detect_js_formatter
    first_formatter([['eslint', 'eslint', ['--fix']],
                     ['prettier', 'prettier', ['--write']]])
  end

  def detect_go_formatter
    first_formatter([['goimports', 'goimports', ['-w']],
                     ['gofmt', 'gofmt', ['-w']]])
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
  rescue StandardError => e
    log("Skipping #{relative_file_path(absolute_path)} - unable to inspect file: #{e.message}", level: :warn)
    true
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
    return git_file_list('diff', '--name-only', '--relative', 'HEAD') if git_head?

    git_file_list('diff', '--name-only', '--relative') +
      git_file_list('diff', '--name-only', '--relative', '--cached')
  end

  # Untracked files (respects .gitignore)
  def git_untracked_files
    git_file_list('ls-files', '--others', '--exclude-standard')
  end

  def git_head?
    _output, _error, status = Open3.capture3('git', 'rev-parse', '--verify', 'HEAD', chdir: cwd)
    status.success?
  end

  def git_file_list(*args)
    output, error, status = Open3.capture3('git', *args, chdir: cwd)
    return output.strip.split("\n") if status.success?

    raise "git #{args.join(' ')} failed (exit #{status.exitstatus}): #{error.strip}"
  end
end
