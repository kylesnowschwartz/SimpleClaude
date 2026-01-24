# frozen_string_literal: true

require_relative 'claude_hooks/version'
require_relative 'claude_hooks/configuration'
require_relative 'claude_hooks/logger'
require_relative 'claude_hooks/base'
require_relative 'claude_hooks/cli'

# Hook classes
require_relative 'claude_hooks/user_prompt_submit'
require_relative 'claude_hooks/pre_tool_use'
require_relative 'claude_hooks/permission_request'
require_relative 'claude_hooks/post_tool_use'
require_relative 'claude_hooks/notification'
require_relative 'claude_hooks/stop'
require_relative 'claude_hooks/subagent_stop'
require_relative 'claude_hooks/pre_compact'
require_relative 'claude_hooks/session_start'
require_relative 'claude_hooks/session_end'

# Output classes
require_relative 'claude_hooks/output/base'
require_relative 'claude_hooks/output/user_prompt_submit'
require_relative 'claude_hooks/output/pre_tool_use'
require_relative 'claude_hooks/output/permission_request'
require_relative 'claude_hooks/output/post_tool_use'
require_relative 'claude_hooks/output/notification'
require_relative 'claude_hooks/output/stop'
require_relative 'claude_hooks/output/subagent_stop'
require_relative 'claude_hooks/output/pre_compact'
require_relative 'claude_hooks/output/session_start'
require_relative 'claude_hooks/output/session_end'

module ClaudeHooks
  class Error < StandardError; end
end
