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
  # --- Per-file linters (report-only) ---

  def run_eslint(files)
    return [] unless eslint_configured?
    return [] unless command_available?('eslint')

    stdout_err, status = capture2e_with_timeout('eslint', '--no-fix', '--format', 'compact', *files,
                                                chdir: cwd)
    return [] if status.success?

    ["eslint errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "eslint failed to run: #{e.message}", level: :error
    []
  end

  def run_rubocop(files)
    return [] unless rubocop_configured?
    return [] unless command_available?('rubocop')

    stdout_err, status = capture2e_with_timeout('rubocop', '--format', 'simple', *files,
                                                chdir: cwd)
    return [] if status.success?

    ["rubocop errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "rubocop failed to run: #{e.message}", level: :error
    []
  end

  def run_ruff(files)
    return [] unless ruff_configured?
    return [] unless command_available?('ruff')

    stdout_err, status = capture2e_with_timeout('ruff', 'check', *files,
                                                chdir: cwd)
    return [] if status.success?

    ["ruff errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "ruff failed to run: #{e.message}", level: :error
    []
  end

  def run_biome(files)
    return [] unless biome_configured?
    return [] unless command_available?('biome')

    stdout_err, status = capture2e_with_timeout('biome', 'lint', *files,
                                                chdir: cwd)
    return [] if status.success?

    ["biome errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "biome failed to run: #{e.message}", level: :error
    []
  end

  # --- Project-wide checks ---

  # Run tsc --noEmit but filter to only errors in modified files.
  # Prevents pre-existing type errors from blocking indefinitely.
  def run_tsc(modified_files)
    tsc = find_tsc
    return [] unless tsc
    return [] unless File.exist?(File.join(cwd, 'tsconfig.json'))

    stdout_err, status = capture2e_with_timeout(tsc, '--noEmit', chdir: cwd)
    return [] if status.success?

    filter_tsc_errors(stdout_err, modified_files)
  rescue StandardError => e
    log "tsc failed to run: #{e.message}", level: :error
    []
  end

  def run_cargo_check
    return [] unless command_available?('cargo') && File.exist?(File.join(cwd, 'Cargo.toml'))

    stdout_err, status = capture2e_with_timeout('cargo', 'check', '--message-format', 'short', chdir: cwd)
    status.success? ? [] : ["cargo check errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "cargo check failed to run: #{e.message}", level: :error
    []
  end

  def run_go_vet
    return [] unless command_available?('go')
    return [] unless File.exist?(File.join(cwd, 'go.mod'))

    stdout_err, status = capture2e_with_timeout('go', 'vet', './...', chdir: cwd)
    return [] if status.success?

    ["go vet errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "go vet failed to run: #{e.message}", level: :error
    []
  end

  private

  ESLINT_CONFIG_FILES = %w[
    eslint.config.js eslint.config.mjs eslint.config.cjs eslint.config.ts
    .eslintrc.js .eslintrc.cjs .eslintrc.json .eslintrc.yml .eslintrc.yaml .eslintrc
  ].freeze

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
