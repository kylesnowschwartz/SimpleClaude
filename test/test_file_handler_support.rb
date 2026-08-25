#!/usr/bin/env ruby
# frozen_string_literal: true

# Unit tests for FileHandlerSupport: skip-pattern matching, git awareness,
# formatter detection, path utilities, and the subprocess timeout wrapper.
#
# Run directly: ruby test/test_file_handler_support.rb

require_relative 'support/test_helpers'
require_relative '../plugins/sc-hooks/hooks/concerns/file_handler_support'

# Minimal includer providing the cwd/log contract the concern expects.
class FileHandlerHost
  include FileHandlerSupport

  attr_reader :cwd, :logs

  def initialize(cwd)
    @cwd = cwd
    @logs = []
  end

  def log(message, level: :info)
    @logs << { message: message, level: level }
  end
end

def stub_available(host, available_commands)
  host.define_singleton_method(:command_available?) do |command|
    available_commands.include?(command)
  end
end

puts 'test_file_handler_support.rb'

# --- matches_skip_pattern? ---
Dir.mktmpdir do |dir|
  host = FileHandlerHost.new(dir)

  check('directory pattern matches at top level') do
    host.matches_skip_pattern?('build/foo.rs', 'build/')
  end
  check('directory pattern matches at any depth') do
    host.matches_skip_pattern?('src/build/foo.rs', 'build/')
  end
  check('directory pattern does not match a file with the same stem') do
    !host.matches_skip_pattern?('build.rs', 'build/')
  end
  check('glob pattern matches basename globs') do
    host.matches_skip_pattern?('app.min.js', '*.min.js')
  end
  check('glob pattern with FNM_PATHNAME does not cross slashes') do
    !host.matches_skip_pattern?('lib/app.min.js', '*.min.js')
  end
  check('plain pattern matches exact path or basename') do
    host.matches_skip_pattern?('deep/dir/Rakefile', 'Rakefile') &&
      host.matches_skip_pattern?('Rakefile', 'Rakefile') &&
      !host.matches_skip_pattern?('Rakefile.bak', 'Rakefile')
  end
end

# --- relative_file_path ---
Dir.mktmpdir do |dir|
  host = FileHandlerHost.new(dir)

  check('path inside cwd becomes relative') do
    host.relative_file_path(File.join(dir, 'a/b.rb')) == 'a/b.rb'
  end
  check('path outside cwd stays absolute') do
    host.relative_file_path('/somewhere/else.rb') == '/somewhere/else.rb'
  end
end

# --- should_skip_file?: patterns, git-ignore, binary detection ---
Dir.mktmpdir do |dir|
  init_git_repo(dir)
  host = FileHandlerHost.new(dir)

  plain = File.join(dir, 'plain.rb')
  File.write(plain, "x = 1\n")
  check('normal source file is not skipped') { !host.should_skip_file?(plain) }

  FileUtils.mkdir_p(File.join(dir, 'node_modules'))
  dep = File.join(dir, 'node_modules', 'dep.js')
  File.write(dep, "module.exports = {}\n")
  check('file under node_modules/ is skipped by pattern') { host.should_skip_file?(dep) }

  File.write(File.join(dir, '.gitignore'), "ignored.txt\n")
  ignored = File.join(dir, 'ignored.txt')
  File.write(ignored, "secret\n")
  check('git-ignored file is skipped') { host.should_skip_file?(ignored) }

  binary = File.join(dir, 'blob.dat')
  File.binwrite(binary, "PNG\x00\x01\x02")
  check('file with null bytes is skipped as binary') { host.should_skip_file?(binary) }

  check('skip decisions are logged with a reason') do
    host.logs.any? { |l| l[:message].include?('node_modules/dep.js') }
  end
end

# --- git_ignored? outside a git repo ---
Dir.mktmpdir do |dir|
  host = FileHandlerHost.new(dir)
  target = File.join(dir, 'file.txt')
  File.write(target, "hi\n")

  check('git_ignored? returns false outside a git repo') { !host.git_ignored?(target) }
  check('git_modified_files returns [] outside a git repo') { host.git_modified_files == [] }
end

# --- git_modified_files: tracked changes + untracked, minus skips ---
Dir.mktmpdir do |dir|
  init_git_repo(dir)
  tracked = File.join(dir, 'tracked.rb')
  File.write(tracked, "a = 1\n")
  Open3.capture2('git', 'add', 'tracked.rb', chdir: dir)
  Open3.capture2('git', '-c', 'user.email=t@t', '-c', 'user.name=t',
                 'commit', '-q', '-m', 'add tracked', chdir: dir)

  File.write(tracked, "a = 2\n") # unstaged modification
  untracked = File.join(dir, 'new_file.md')
  File.write(untracked, "# new\n")
  FileUtils.mkdir_p(File.join(dir, 'vendor'))
  skipped = File.join(dir, 'vendor', 'lib.rb')
  File.write(skipped, "v = 1\n")

  host = FileHandlerHost.new(dir)
  modified = host.git_modified_files

  check('modified tracked file is included as an absolute path') { modified.include?(tracked) }
  check('untracked file is included') { modified.include?(untracked) }
  check('file matching a skip pattern is excluded') { !modified.include?(skipped) }
end

# --- command_available? caching ---
Dir.mktmpdir do |dir|
  host = FileHandlerHost.new(dir)

  check('existing command is reported available') { host.command_available?('sh') }
  check('missing command is reported unavailable') do
    !host.command_available?('definitely-not-a-real-command-xyz')
  end
  check('result is memoized per command') do
    first = host.command_available?('sh')
    cache = host.instance_variable_get(:@command_cache)
    first && cache.key?('sh') && cache.key?('definitely-not-a-real-command-xyz')
  end
end

# --- detect_formatter registry ---
Dir.mktmpdir do |dir|
  host = FileHandlerHost.new(dir)
  stub_available(host, %w[rubocop markdownlint shfmt stylua rustfmt ruff yamlfmt eslint prettier goimports gofmt])

  check('.rb maps to rubocop with safe-corrections flag only') do
    f = host.detect_formatter('a.rb')
    f[:command] == 'rubocop' && f[:args] == ['-a']
  end
  check('.md maps to markdownlint --fix with trailing --') do
    f = host.detect_formatter('a.md')
    f[:command] == 'markdownlint' && f[:args].first == '--fix' && f[:args].last == '--'
  end
  check('.py maps to ruff format') do
    f = host.detect_formatter('a.py')
    f[:command] == 'ruff' && f[:args] == ['format']
  end
  check('extension matching is case-insensitive') do
    host.detect_formatter('README.MD')&.dig(:name) == 'markdownlint'
  end
  check('unknown extension returns nil') { host.detect_formatter('a.zig').nil? }
end

Dir.mktmpdir do |dir|
  host = FileHandlerHost.new(dir)
  stub_available(host, %w[yamlfmt eslint prettier goimports gofmt])

  check('.yml prefers yamlfmt when both yamlfmt and prettier exist') do
    host.detect_formatter('a.yml')&.dig(:name) == 'yamlfmt'
  end
  check('.ts prefers eslint when both eslint and prettier exist') do
    host.detect_formatter('a.ts')&.dig(:name) == 'eslint'
  end
  check('.go prefers goimports over gofmt') do
    host.detect_formatter('a.go')&.dig(:name) == 'goimports'
  end
end

Dir.mktmpdir do |dir|
  host = FileHandlerHost.new(dir)
  stub_available(host, %w[prettier gofmt])

  check('.js falls back to prettier when eslint is unavailable') do
    host.detect_formatter('a.js')&.dig(:name) == 'prettier'
  end
  check('.yaml falls back to prettier with yaml parser') do
    f = host.detect_formatter('a.yaml')
    f[:name] == 'prettier' && f[:args].include?('yaml')
  end
  check('.go falls back to gofmt when goimports is unavailable') do
    host.detect_formatter('a.go')&.dig(:name) == 'gofmt'
  end
end

Dir.mktmpdir do |dir|
  host = FileHandlerHost.new(dir)
  stub_available(host, [])

  check('no available tools means no formatter for any extension') do
    %w[a.rb a.md a.sh a.lua a.rs a.py a.yml a.ts a.css a.go].all? do |f|
      host.detect_formatter(f).nil?
    end
  end
end

# --- capture2e_with_timeout ---
Dir.mktmpdir do |dir|
  host = FileHandlerHost.new(dir)

  check('captures combined output and success status') do
    out, status = host.capture2e_with_timeout('sh', '-c', 'echo out; echo err 1>&2', chdir: dir)
    status.success? && out.include?('out') && out.include?('err')
  end
  check('reports failure status for nonzero exit') do
    _out, status = host.capture2e_with_timeout('sh', '-c', 'exit 3', chdir: dir)
    !status.success? && status.exitstatus == 3
  end
  check('kills the process and annotates output on timeout') do
    started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    out, status = host.capture2e_with_timeout('sh', '-c', 'sleep 30', chdir: dir, timeout: 1)
    elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started
    elapsed < 10 && !status.success? && out.include?('exceeded 1s timeout')
  end
end

finish_tests!
