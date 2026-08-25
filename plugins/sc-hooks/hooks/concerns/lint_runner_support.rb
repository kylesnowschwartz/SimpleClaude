# frozen_string_literal: true

require 'open3'
# Enumerable#to_set is not built-in before Ruby 3.2, and end users' `env ruby`
# may resolve to macOS system ruby (2.6).
require 'set' # rubocop:disable Lint/RedundantRequireStatement

# Lint runner methods shared across handlers that need to invoke linters.
#
# Expects the includer to provide:
#   - cwd                     (from ClaudeHooks::Base)
#   - log                     (from ClaudeHooks::Base)
#   - command_available?      (from FileHandlerSupport)
#   - relative_file_path      (from FileHandlerSupport)
#   - capture2e_with_timeout  (from FileHandlerSupport)
module LintRunnerSupport
  ESLINT_CONFIG_FILES = %w[
    eslint.config.js eslint.config.mjs eslint.config.cjs eslint.config.ts
    .eslintrc.js .eslintrc.cjs .eslintrc.json .eslintrc.yml .eslintrc.yaml .eslintrc
  ].freeze

  # A linter invocation: the CLI to run, its fixed arguments, and the predicate
  # that decides whether this project is configured to use it at all.
  Linter = Struct.new(:command, :args, :configured, keyword_init: true)

  # Per-file linters (report-only, never auto-fix). Keyed by the name used in
  # reported errors; files are appended to args at call time.
  PER_FILE_LINTERS = {
    'eslint' => Linter.new(command: 'eslint', args: %w[--no-fix --format compact],
                           configured: :eslint_configured?),
    'rubocop' => Linter.new(command: 'rubocop', args: %w[--format simple],
                            configured: :rubocop_configured?),
    'ruff' => Linter.new(command: 'ruff', args: %w[check], configured: :ruff_configured?),
    'biome' => Linter.new(command: 'biome', args: %w[lint], configured: :biome_configured?)
  }.freeze

  # Project-wide checks. They take no file arguments and are gated on the
  # project's build manifest rather than on a linter config file.
  PROJECT_CHECKS = {
    'cargo check' => Linter.new(command: 'cargo', args: %w[check --message-format short],
                                configured: :cargo_project?),
    'go vet' => Linter.new(command: 'go', args: ['vet', './...'], configured: :go_project?)
  }.freeze

  # Runs one of PER_FILE_LINTERS over the given files. Returns [] when the
  # linter isn't configured, isn't installed, or reports no errors.
  def run_per_file_linter(name, files)
    return [] if files.nil? || files.empty?

    run_linter(name, PER_FILE_LINTERS.fetch(name), files)
  end

  # Runs one of PROJECT_CHECKS over the whole project.
  def run_project_check(name)
    run_linter(name, PROJECT_CHECKS.fetch(name))
  end

  # Run tsc --noEmit but filter to only errors in modified files.
  # Prevents pre-existing type errors from blocking indefinitely.
  def run_tsc(modified_files)
    tsc = find_tsc
    return [] unless tsc
    return [] unless File.exist?(File.join(cwd, 'tsconfig.json'))

    capture_lint_output('tsc', [tsc, '--noEmit']) do |stdout_err|
      filter_tsc_errors(stdout_err, modified_files)
    end
  end

  private

  def run_linter(name, linter, files = [])
    return [] unless send(linter.configured)
    return [] unless command_available?(linter.command)

    capture_lint_output(name, [linter.command, *linter.args, *files])
  end

  # Invoke a lint command, returning [] on success. On failure the block (when
  # given) maps the combined output to error strings; otherwise the whole output
  # is reported under `name`. A crashed linter is logged and treated as no-op:
  # a broken tool must not wedge the hook.
  def capture_lint_output(name, command_parts)
    stdout_err, status = capture2e_with_timeout(*command_parts, chdir: cwd)
    return [] if status.success?
    return yield(stdout_err) if block_given?

    ["#{name} errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "#{name} failed to run: #{e.message}", level: :error
    []
  end

  def rubocop_configured?
    File.exist?(File.join(cwd, '.rubocop.yml'))
  end

  def eslint_configured?
    return true if ESLINT_CONFIG_FILES.any? { |f| File.exist?(File.join(cwd, f)) }

    package_json_has_key?('eslintConfig')
  end

  def ruff_configured?
    return true if File.exist?(File.join(cwd, 'ruff.toml')) || File.exist?(File.join(cwd, '.ruff.toml'))

    pyproject = File.join(cwd, 'pyproject.toml')
    return false unless File.exist?(pyproject)

    File.read(pyproject) =~ /^\[tool\.ruff[\].]/
  rescue StandardError
    false
  end

  def biome_configured?
    File.exist?(File.join(cwd, 'biome.json')) || File.exist?(File.join(cwd, 'biome.jsonc'))
  end

  def cargo_project?
    File.exist?(File.join(cwd, 'Cargo.toml'))
  end

  def go_project?
    File.exist?(File.join(cwd, 'go.mod'))
  end

  def package_json_has_key?(key)
    package_json = File.join(cwd, 'package.json')
    return false unless File.exist?(package_json)

    require 'json'
    JSON.parse(File.read(package_json)).key?(key)
  rescue StandardError
    false
  end

  # Prefer project-local tsc over global to match the project's TS version.
  def find_tsc
    local_tsc = File.join(cwd, 'node_modules', '.bin', 'tsc')
    return local_tsc if File.executable?(local_tsc)

    command_available?('tsc') ? 'tsc' : nil
  end

  # Filter tsc output to only errors in files Claude modified.
  def filter_tsc_errors(tsc_output, modified_files)
    modified_basenames = modified_files.to_set { |f| relative_file_path(f) }
    relevant_lines = tsc_output.lines.select do |line|
      # tsc error lines: "src/foo.ts(10,5): error TS2345: ..."
      modified_basenames.any? { |basename| line.start_with?(basename) }
    end

    return [] if relevant_lines.empty?

    ["tsc --noEmit errors (in modified files):\n#{relevant_lines.join}"]
  end
end
