# Claude Hooks Ruby DSL - Base Implementation

This directory contains base Ruby classes and entrypoints for all 8 Claude Code hook types, demonstrating the architecture and providing starting points for custom implementations.

**Important:** Hooks are distributed as the `sc-hooks` marketplace plugin in SimpleClaude v2.0+. The installation script handles plugin installation, and hooks are auto-configured via the plugin's `hooks.json` file.

## Quick Start

1. **Install SimpleClaude plugins (includes sc-hooks):**
   ```bash
   # From the SimpleClaude repository root
   ./scripts/install.rb
   ```
   This installs three plugins: `simpleclaude-core` (core), `sc-hooks` (session management), and `sc-extras` (utilities).

2. **Install the claude_hooks gem:**
   ```bash
   gem install claude_hooks
   ```

3. **Hooks are auto-configured:**
   The `sc-hooks` plugin includes a `hooks.json` file that registers all hooks automatically. No manual configuration needed unless you want to customize.

4. **Verify installation:**
   ```bash
   # Check that hooks are installed
   ls -la ~/.claude/plugins/sc-hooks/hooks/
   ```

## Architecture Overview

```
Claude Code → Entrypoints (orchestration) → Handlers (business logic) → Base Classes (framework)
```

- **Entrypoints**: Ruby scripts that Claude Code directly invokes
- **Handlers**: Focused classes implementing specific business logic
- **Base Classes**: Framework layer provided by `claude_hooks` gem

## Hook Types Available

| Hook Type | Purpose | When It Triggers |
|-----------|---------|------------------|
| **SessionStart** | Session initialization | When Claude Code starts a new session |
| **UserPromptSubmit** | Prompt modification/validation | When user submits a prompt |
| **PreToolUse** | Tool permission control | Before any tool execution |
| **PostToolUse** | Tool result processing | After any tool execution |
| **Notification** | System notification handling | When Claude sends notifications |
| **Stop** | Session cleanup | When Claude Code stops |
| **SubagentStop** | Subagent result processing | When a subagent completes |
| **PreCompact** | Transcript preservation | Before transcript compaction |

## File Structure

After installing the `sc-hooks` plugin, hooks are located at:

```
~/.claude/plugins/sc-hooks/hooks/  # Plugin hooks directory
├── handlers/                      # Business logic classes
│   ├── auto_format_handler.rb     # Auto-formatting for file edits
│   ├── copy_message_handler.rb    # Copy messages to clipboard
│   ├── session_start_handler.rb   # Session initialization
│   ├── user_prompt_submit_handler.rb  # Prompt modification
│   ├── pre_tool_use_handler.rb    # Tool permission control
│   ├── post_tool_use_handler.rb   # Tool result processing
│   ├── notification_handler.rb    # Notification routing
│   ├── stop_handler.rb            # Session cleanup (example)
│   ├── stop_you_are_not_right.rb  # Reflexive agreement detector (active)
│   ├── subagent_stop_handler.rb   # Subagent result processing
│   ├── pre_compact_handler.rb     # Transcript preservation
│   └── transcript_parser.rb       # Transcript analysis utility
├── entrypoints/                   # Orchestration scripts
│   ├── session_start.rb
│   ├── user_prompt_submit.rb
│   ├── pre_tool_use.rb
│   ├── post_tool_use.rb
│   ├── notification.rb
│   ├── stop.rb
│   ├── subagent_stop.rb
│   └── pre_compact.rb
└── hooks.json                     # Plugin hook configuration
```

**Note:** The `hooks.json` file automatically registers all hooks. You can override or extend by adding hooks to your `~/.claude/settings.json`, but the defaults work out of the box.

## Common Use Cases by Hook Type

### SessionStart
- Initialize project configuration
- Setup session logging
- Load user preferences
- Check system requirements

### UserPromptSubmit
- Add project context to prompts
- Validate/block inappropriate requests
- Apply prompt templates
- Log user interactions

### PreToolUse
- Block dangerous commands
- Require approval for sensitive operations
- Apply rate limiting
- Security validation

### PostToolUse
- Parse command output
- Extract errors/warnings
- Update project state
- Log metrics

### Notification
- Route to external systems (Slack, email)
- Filter sensitive information
- Log important events
- Trigger automated responses

### Stop
- Save session state
- Generate summaries
- Cleanup resources
- Send completion notifications

### SubagentStop
- Process subagent results
- Extract key insights
- Cache results for reuse
- Trigger follow-up actions

### PreCompact
- Backup full transcript
- Extract key insights
- Mark important segments for preservation
- Generate custom summaries

## claude_hooks Gem API Reference

For complete API documentation, hook lifecycle details, and available methods, see the official repository:

**https://github.com/gabriel-dehan/claude_hooks**

The gem provides base classes for all 8 hook types with methods for reading transcripts, modifying prompts, controlling tool execution, and more. Refer to the repo for the authoritative API documentation.

## Creating Custom Handlers

To create custom handlers:

1. Study the existing handlers in `~/.claude/plugins/sc-hooks/hooks/handlers/` as examples
2. Refer to the [claude_hooks gem documentation](https://github.com/gabriel-dehan/claude_hooks) for base class APIs
3. Add your handler to the appropriate entrypoint in `~/.claude/plugins/sc-hooks/hooks/entrypoints/`

**Note:** Use `${CLAUDE_PLUGIN_ROOT}` to reference the plugin directory. For `sc-hooks`, this resolves to `~/.claude/plugins/sc-hooks/`. The plugin's `hooks.json` already configures these, so manual configuration is only needed for customization.

## Environment Variables

The `claude_hooks` gem supports several environment variables for configuration. The most commonly used:

- `RUBY_CLAUDE_HOOKS_DEBUG_MODE`: Enable verbose debug output
- `CLAUDE_PROJECT_DIR`: Project directory (automatically set by Claude Code)

For the complete list, see the [claude_hooks documentation](https://github.com/gabriel-dehan/claude_hooks).

## Debugging

1. **Enable debug mode:**
   ```bash
   export RUBY_CLAUDE_HOOKS_DEBUG_MODE=true
   ```

2. **Check logs:**
   ```bash
   tail -f ~/.claude/logs/hooks/session-*.log
   ```
