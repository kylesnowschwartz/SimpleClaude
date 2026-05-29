#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'

# GitHubUrlHandler
#
# PURPOSE: When Claude WebFetches a github.com repo page, inject a hint that the
# `gh` CLI usually returns cleaner, structured data than the JavaScript-heavy
# HTML github.com serves. This is a SOFT nudge, not a block.
#
# WHY SOFT (not deny): a hard deny needs a perfect list of github.com's reserved
# routes to avoid locking Claude out of legitimate non-repo pages (features,
# marketplace, orgs, ...) — and that list can never be complete (GitHub adds
# routes constantly). A soft nudge can't ever strand Claude, which makes the
# reserved-route list harmless when incomplete: a missed entry just yields a
# slightly off-target hint on a page that still fetched fine. We trade
# guaranteed-pivot-to-gh for guaranteed forward progress.
#
# WHY PreToolUse: it fires exactly when Claude attempts the WebFetch, so the
# hint lands next to the action instead of being sprayed on every prompt.
class GitHubUrlHandler < ClaudeHooks::PreToolUse
  # Extract owner/repo (and optional issue/PR number) from a github.com URL.
  GITHUB_URL_PATTERN = %r{
    https?://(?:www\.)?github\.com/
    (?<owner>[^/\s]+)/
    (?<repo>[^/\s?#]+)
    (?:/(?<type>issues|pull)/(?<number>\d+))?
  }x

  # Hosts that serve plain text — gh adds nothing, so don't nudge.
  RAW_HOST_PATTERN = %r{https?://(raw\.githubusercontent\.com|gist\.githubusercontent\.com)/}

  # github.com first-path segments that are reserved site routes, not user/org
  # names (GitHub blocks registering these as usernames). Skipping them keeps the
  # hint relevant — `gh repo view features/copilot` is nonsense. This list is
  # best-effort, NOT load-bearing: because the nudge is soft, a missed entry only
  # means a harmless off-target hint, never a blocked fetch. Common routes only.
  RESERVED_OWNERS = %w[
    features orgs sponsors settings marketplace topics about pricing security
    enterprise explore new login logout join notifications codespaces apps
    search dashboard pulls issues account organizations site contact collections
    trending events sessions readme copilot
  ].freeze

  def call
    url = tool_input.is_a?(Hash) ? tool_input['url'].to_s : ''
    return output if url.empty?
    return output if url.match?(RAW_HOST_PATTERN) # raw text — gh adds nothing
    return output if url.include?('/raw/')        # .../blob/.../raw style

    match = url.match(GITHUB_URL_PATTERN)
    return output unless match # not a github.com repo-shaped URL
    return output if RESERVED_OWNERS.include?(match[:owner].downcase) # site page, not a repo

    log "Suggesting gh CLI alongside WebFetch for github.com URL: #{url}"
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

  def guidance(match)
    repo = "#{match[:owner]}/#{match[:repo]}"
    lines = ['WebFetch on github.com returns JavaScript-heavy HTML that is unreliable for reading ' \
             'repo content — do NOT answer from it. Re-perform this request now with the `gh` CLI ' \
             'and base your response on that output instead. Use the command that fits the request:']

    if match[:number]
      cmd = match[:type] == 'issues' ? 'issue' : 'pr'
      lines << "- This URL:   gh #{cmd} view #{match[:number]} -R #{repo} --json title,body,comments,state"
    end

    lines << "- Repo info:  gh repo view #{repo} --json name,description,defaultBranchRef,languages"
    lines << "- README:     gh api repos/#{repo}/readme --jq .content | base64 -d"
    lines << "- File tree:  gh api 'repos/#{repo}/git/trees/HEAD?recursive=1' --jq '.tree[].path'"
    lines << "- One file:   gh api repos/#{repo}/contents/PATH --jq .content | base64 -d"
    lines << '- Clone it:   mkdir -p .cloned-sources && gh repo clone ' \
             "#{repo} .cloned-sources/#{match[:repo]} -- --depth 1"
    lines << ''
    lines << "Run the matching command for #{repo} before you respond; treat its output as the " \
             'source of truth and discard the fetched HTML.'

    lines.join("\n")
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
