# frozen_string_literal: true

require 'open3'

# Lint runner methods shared across handlers that need to invoke linters.
#
# Expects the includer to provide:
#   - cwd                (from ClaudeHooks::Base)
#   - log                (from ClaudeHooks::Base)
#   - command_available? (from FileHandlerSupport)
#   - relative_file_path (from FileHandlerSupport)
module LintRunnerSupport
  # --- Per-file linters (report-only) ---

  def run_eslint(files)
    return [] unless command_available?('eslint')

    stdout_err, status = Open3.capture2e(
      'eslint', '--no-fix', '--format', 'compact', *files,
      chdir: cwd
    )
    return [] if status.success?

    ["eslint errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "eslint failed to run: #{e.message}", level: :error
    []
  end

  def run_rubocop(files)
    return [] unless command_available?('rubocop')

    stdout_err, status = Open3.capture2e(
      'rubocop', '--format', 'simple', *files,
      chdir: cwd
    )
    return [] if status.success?

    ["rubocop errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "rubocop failed to run: #{e.message}", level: :error
    []
  end

  def run_ruff(files)
    return [] unless command_available?('ruff')

    stdout_err, status = Open3.capture2e(
      'ruff', 'check', *files,
      chdir: cwd
    )
    return [] if status.success?

    ["ruff errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "ruff failed to run: #{e.message}", level: :error
    []
  end

  # --- Project-wide checks ---

  # Run tsc --noEmit but filter to only errors in modified files.
  # Prevents pre-existing type errors from blocking indefinitely.
  def run_tsc(modified_files)
    tsc = find_tsc
    return [] unless tsc
    return [] unless File.exist?(File.join(cwd, 'tsconfig.json'))

    stdout_err, status = Open3.capture2e(tsc, '--noEmit', chdir: cwd)
    return [] if status.success?

    filter_tsc_errors(stdout_err, modified_files)
  rescue StandardError => e
    log "tsc failed to run: #{e.message}", level: :error
    []
  end

  def run_cargo_check
    return [] unless command_available?('cargo') && File.exist?(File.join(cwd, 'Cargo.toml'))

    stdout_err, status = Open3.capture2e('cargo', 'check', '--message-format', 'short', chdir: cwd)
    status.success? ? [] : ["cargo check errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "cargo check failed to run: #{e.message}", level: :error
    []
  end

  def run_go_vet
    return [] unless command_available?('go')
    return [] unless File.exist?(File.join(cwd, 'go.mod'))

    stdout_err, status = Open3.capture2e('go', 'vet', './...', chdir: cwd)
    return [] if status.success?

    ["go vet errors:\n#{stdout_err.strip}"]
  rescue StandardError => e
    log "go vet failed to run: #{e.message}", level: :error
    []
  end

  private

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
