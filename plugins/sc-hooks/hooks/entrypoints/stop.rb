#!/usr/bin/env ruby
# frozen_string_literal: true

# Stop Entrypoint
#
# Runs all Stop handlers when Claude Code finishes responding.
#
# Multi-handler merge pattern: if ANY handler blocks (forces continuation),
# the merged output blocks. Reasons from multiple handlers are concatenated.

require_relative '../../vendor/claude_hooks/lib/claude_hooks'
require_relative '../concerns/entrypoint_runner'

require_relative '../handlers/auto_format_handler'
require_relative '../handlers/lint_check_handler'

# ORDER MATTERS: AutoFormatHandler must run before LintCheckHandler so
# formatters fix style issues before linters report on them.
EntrypointRunner.run('Stop', ClaudeHooks::Output::Stop, [
                       AutoFormatHandler,
                       LintCheckHandler
                     ])
