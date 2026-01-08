#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../../vendor/claude_hooks/lib/claude_hooks'

# GitHubUrlHandler
#
# PURPOSE: When a GitHub URL is detected in the user prompt, inject context
# instructing Claude to use `gh` CLI rather than WebFetch for fetching content.
#
# GitHub's web pages are heavily JavaScript-rendered and WebFetch often fails
# to extract useful content. The `gh` CLI provides direct API access with
# better structured data.
class GitHubUrlHandler < ClaudeHooks::UserPromptSubmit
  # Match GitHub repository URLs
  GITHUB_REPO_PATTERN = %r{
    https?://github\.com/
    (?<owner>[^/]+)/
    (?<repo>[^/\s?#]+)
    (?:/(?<path>[^\s?#]*))?
  }x

  # Match specific issue/PR URLs
  GITHUB_ISSUE_PATTERN = %r{
    https?://github\.com/
    (?<owner>[^/]+)/
    (?<repo>[^/]+)/
    (?<type>issues|pull)/
    (?<number>\d+)
  }x

  def call
    prompt_text = current_prompt.to_s.strip
    return if prompt_text.empty?

    # Check for issue/PR URLs first (more specific)
    issue_matches = prompt_text.scan(GITHUB_ISSUE_PATTERN)

    # Then check for general repo URLs
    repo_matches = prompt_text.scan(GITHUB_REPO_PATTERN)
    return if repo_matches.empty?

    # Build context
    repos = repo_matches.map { |owner, repo, _path| "#{owner}/#{repo}" }.uniq
    repo = repos.first

    context = build_context(repo, issue_matches)
    add_additional_context!(context)
    output
  end

  private

  def build_context(repo, issue_matches)
    sections = []
    sections << header_section
    sections << issue_pr_section(issue_matches) if issue_matches.any?
    sections << understand_repo_section(repo)
    sections << explore_code_section(repo)
    sections << check_activity_section(repo)
    sections << exceptions_section
    sections << footer_section

    "<github-cli-guidance>\n#{sections.join("\n")}</github-cli-guidance>\n"
  end

  def header_section
    <<~SECTION
      GitHub URL detected. Use `gh` CLI instead of WebFetch for GitHub content.
      WebFetch on github.com returns JavaScript-heavy pages with little useful data.
    SECTION
  end

  def issue_pr_section(matches)
    return '' if matches.empty?

    examples = matches.map do |owner, repo, type, number|
      cmd = type == 'issues' ? 'issue' : 'pr'
      "  gh #{cmd} view #{number} -R #{owner}/#{repo} --json title,body,comments,state"
    end.uniq.join("\n")

    <<~SECTION

      **View specific issue/PR:**
      ```bash
      #{examples}
      ```
    SECTION
  end

  def understand_repo_section(repo)
    <<~SECTION

      ## Understand the repo

      **Quick overview (description, languages, topics):**
      ```bash
      gh repo view #{repo} --json name,description,defaultBranchRef,languages,repositoryTopics
      ```

      **Read the README:**
      ```bash
      gh api repos/#{repo}/readme --jq '.content' | base64 -d
      ```

      **Check releases:**
      ```bash
      gh release list -R #{repo} --limit 5
      ```
    SECTION
  end

  def explore_code_section(repo)
    <<~SECTION

      ## Explore the code

      **For serious code exploration, clone it locally:**
      ```bash
      mkdir -p .cloned-sources && gh repo clone #{repo} .cloned-sources/#{repo.split('/').last} -- --depth 1
      ```
      Then use local file tools (Read, Grep, Glob) on `.cloned-sources/` for fast exploration.

      **Quick file tree (without cloning):**
      ```bash
      gh api 'repos/#{repo}/git/trees/HEAD?recursive=1' --jq '.tree[].path' | head -50
      ```

      **Fetch a specific file:**
      ```bash
      gh api repos/#{repo}/contents/path/to/file --jq '.content' | base64 -d
      ```
    SECTION
  end

  def check_activity_section(repo)
    <<~SECTION

      ## Check activity

      **Recent commits:**
      ```bash
      gh api repos/#{repo}/commits --jq '.[0:5] | .[].commit.message'
      ```

      **Open issues:**
      ```bash
      gh issue list -R #{repo} --json number,title,state --limit 10
      ```

      **Open PRs:**
      ```bash
      gh pr list -R #{repo} --json number,title,state --limit 10
      ```
    SECTION
  end

  def exceptions_section
    <<~SECTION

      ## When WebFetch IS fine
      - `raw.githubusercontent.com` URLs (plain text, no JS)
      - GitHub Gist raw URLs
    SECTION
  end

  def footer_section
    ''
  end
end

# Testing support
if __FILE__ == $PROGRAM_NAME
  ClaudeHooks::CLI.test_runner(GitHubUrlHandler) do |input_data|
    input_data['prompt'] ||= ARGV[0] || 'Check out https://github.com/esmuellert/codediff.nvim'
    input_data['session_id'] ||= 'test-session-01'
  end
end
