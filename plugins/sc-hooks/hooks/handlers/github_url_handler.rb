#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'

# GitHubUrlHandler
#
# PURPOSE: When Claude WebFetches a github.com repo page, inject a hint that
# `opensrc` / the `gh` CLI usually return cleaner, structured data than the
# JavaScript-heavy HTML github.com serves. This is a SOFT nudge, not a block.
#
# WHY SOFT (not deny): a hard deny would need a perfect, forever-current list of
# github.com's reserved non-repo routes (features, marketplace, orgs, ...) to
# avoid locking Claude out of legitimate pages — and that list can never be
# complete (GitHub adds routes constantly). An advisory hint can't strand Claude,
# so we drop the list entirely: the guidance is phrased conditionally ("if this
# is a repository..."), so when it lands on a non-repo page Claude just ignores
# it and reads the HTML it already fetched.
#
# WHY PreToolUse: it fires exactly when Claude attempts the WebFetch, so the
# hint lands next to the action instead of being sprayed on every prompt.
class GitHubUrlHandler < ClaudeHooks::PreToolUse
  # Extract owner/repo (and optional issue/PR number) from a github.com URL.
  # Character classes mirror GitHub's actual naming rules — anything outside
  # them (e.g. shell metacharacters in a crafted URL) simply doesn't match,
  # keeping the interpolated command hints below shell-safe.
  GITHUB_URL_PATTERN = %r{
    https?://(?:www\.)?github\.com/
    (?<owner>[A-Za-z0-9-]+)/
    (?<repo>[A-Za-z0-9_.-]+)
    (?:/(?<type>issues|pull)/(?<number>\d+))?
  }x

  # Hosts that serve plain text — gh adds nothing, so don't nudge.
  RAW_HOST_PATTERN = %r{https?://(raw\.githubusercontent\.com|gist\.githubusercontent\.com)/}

  def call
    url = tool_input.is_a?(Hash) ? tool_input['url'].to_s : ''
    return output if url.empty?
    return output if url.match?(RAW_HOST_PATTERN) # raw text — gh adds nothing
    return output if url.include?('/raw/')        # .../blob/.../raw style

    match = url.match(GITHUB_URL_PATTERN)
    return output unless match # not a github.com repo-shaped URL

    log "Suggesting opensrc/gh CLI alongside WebFetch for github.com URL: #{url}"
    advise_gh!(guidance(match))
    output
  end

  private

  # Inject context without touching the permission decision: the WebFetch
  # proceeds through the normal flow, Claude just also sees the gh hint.
  def advise_gh!(text)
    @output_data['hookSpecificOutput'] = {
      'hookEventName' => hook_event_name,
      'additionalContext' => text
    }
  end

  # Advisory only, phrased conditionally: if the URL is actually a non-repo site
  # page (marketplace, features, ...), Claude ignores this and uses the HTML it
  # already fetched. That conditional framing is why no reserved-route list is
  # needed.
  def guidance(match)
    repo = "#{match[:owner]}/#{match[:repo]}"
    lines = ['If this github.com URL is a repository, WebFetch returns JavaScript-heavy HTML that ' \
             'is often unreliable for reading repo content. These usually return cleaner, structured ' \
             'data — use whichever fits, or ignore this hint if the URL is a non-repo page:']

    if match[:number]
      cmd = match[:type] == 'issues' ? 'issue' : 'pr'
      lines << "- This issue/PR: gh #{cmd} view #{match[:number]} -R #{repo} --json title,body,comments,state"
    end

    if opensrc_available?
      lines << "- Read source:   opensrc path #{repo}  (fetches + caches the repo source under " \
               "~/.opensrc; compose with rg, e.g. rg \"pattern\" \"$(opensrc path #{repo})\")"
    end
    lines << "- Repo info:     gh repo view #{repo} --json name,description,defaultBranchRef,languages"
    lines << "- README:        gh api repos/#{repo}/readme --jq .content | base64 -d"
    lines << "- File tree:     gh api 'repos/#{repo}/git/trees/HEAD?recursive=1' --jq '.tree[].path'"
    lines << "- One file:      gh api repos/#{repo}/contents/PATH --jq .content | base64 -d"
    lines << '- Full clone:    only when you need git history or a writable tree — ' \
             "gh repo clone #{repo} .cloned-sources/#{match[:repo]} -- --depth 1"

    lines.join("\n")
  end

  # Ultra-fast, subprocess-free CLI detection: scan PATH with stat() only, so the
  # per-WebFetch cost is microseconds — no `command -v` fork. Memoized per process.
  def opensrc_available?
    return @opensrc_available unless @opensrc_available.nil?

    @opensrc_available = ENV.fetch('PATH', '').split(File::PATH_SEPARATOR).any? do |dir|
      next false if dir.empty?

      exe = File.join(dir, 'opensrc')
      File.file?(exe) && File.executable?(exe)
    end
  end
end

# Testing support
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(GitHubUrlHandler) do |input_data|
    input_data['tool_name'] ||= 'WebFetch'
    input_data['tool_input'] ||= { 'url' => ARGV[0] || 'https://github.com/esmuellert/codediff.nvim' }
    input_data['session_id'] ||= 'test-session-01'
  end
end
