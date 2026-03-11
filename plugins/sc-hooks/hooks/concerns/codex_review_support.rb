# frozen_string_literal: true

require 'open3'
require 'tempfile'

# Codex CLI execution methods for handlers that send content for external review.
#
# Expects the includer to provide:
#   - cwd  (from ClaudeHooks::Base)
#   - log  (from ClaudeHooks::Base)
module CodexReviewSupport
  def codex_available?
    _, status = Open3.capture2('which', 'codex')
    status.success?
  end

  # Sends plan content to Codex for review.
  # Returns { text: String|nil, duration: Float, timed_out: Boolean }.
  def codex_review(plan_content, prompt_text, timeout:, model: nil)
    plan_file = write_tempfile('sc-plan-review', '.md', plan_content)
    output_file = write_tempfile('sc-plan-review-output', '.txt', '')
    cmd = build_review_command(plan_file.path, output_file.path, prompt_text, model)

    stdout_text, duration, timed_out = timed_execution(cmd, timeout)
    text = read_nonempty(output_file.path) || stdout_text
    { text: text, duration: duration, timed_out: timed_out }
  ensure
    plan_file&.close!
    output_file&.close!
  end

  private

  def build_review_command(plan_path, output_path, prompt_text, model)
    prompt = "Read the file at #{plan_path} and review the implementation plan.\n\n#{prompt_text}"
    log "Running codex review for #{plan_path}"
    codex_command(prompt, output_path, model: model)
  end

  def codex_command(prompt, output_path, model: nil)
    cmd = ['codex', 'exec', '--full-auto']
    cmd += ['-C', cwd] if cwd
    cmd += ['-m', model] if model && !model.empty?
    cmd + ['-o', output_path, prompt]
  end

  def timed_execution(cmd, timeout)
    start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    result, timed_out = run_with_timeout(cmd, timeout)
    duration = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - start).round(1)
    [result, duration, timed_out]
  end

  def run_with_timeout(cmd, timeout)
    stdin, stdout, stderr, wait_thr = Open3.popen3(*cmd)
    stdin.close
    reader = Thread.new { stdout.read rescue nil } # rubocop:disable Style/RescueModifier

    return [collect_output(reader, stderr), false] if wait_thr.join(timeout)

    log "Process timed out after #{timeout}s — killing pid #{wait_thr.pid}", level: :warn
    terminate_process(wait_thr.pid)
    [nil, true]
  ensure
    [stdin, stdout, stderr].each { |io| io&.close rescue nil } # rubocop:disable Style/RescueModifier
  end

  def collect_output(reader, stderr)
    stderr_text = stderr.read
    log "Codex stderr: #{stderr_text}" unless stderr_text.empty?
    text = reader.value&.strip
    text&.empty? ? nil : text
  end

  def terminate_process(pid)
    Process.kill('TERM', pid)
    sleep 0.5
    Process.kill('KILL', pid) rescue nil # rubocop:disable Style/RescueModifier
  rescue Errno::ESRCH
    nil # already exited
  end

  def write_tempfile(prefix, suffix, content)
    tf = Tempfile.new([prefix, suffix])
    tf.write(content)
    tf.flush
    tf
  end

  def read_nonempty(path)
    return nil unless File.exist?(path)

    text = File.read(path).strip
    text.empty? ? nil : text
  end
end
