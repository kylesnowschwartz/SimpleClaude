#!/usr/bin/env ruby
# frozen_string_literal: true

# PreToolUse Entrypoint
#
# Runs PreToolUse handlers before a tool runs and merges their outputs
# (most restrictive permission wins).

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require_relative '../concerns/entrypoint_runner'

require_relative '../handlers/github_url_handler'

EntrypointRunner.run('PreToolUse', ClaudeHooks::Output::PreToolUse, [GitHubUrlHandler])
