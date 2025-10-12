# Claude Hooks Ruby DSL - Base Implementation

This directory contains base Ruby classes and entrypoints for all 8 Claude Code hook types, demonstrating the architecture and providing starting points for custom implementations.

**Important:** The hooks system is included with SimpleClaude but operates independently from the main install script. While `./scripts/install.rb` installs SimpleClaude commands, agents, and output-styles, hook configuration requires manual setup in your `~/.claude/settings.json` file.

## Quick Start

1. **Install SimpleClaude (includes hooks):**
   ```bash
   # From the SimpleClaude repository root
   ./scripts/install.rb
   ```
   Note: The SimpleClaude install script installs commands, agents, and output-styles, but hooks must be configured separately.

2. **Install the claude_hooks gem:**
   ```bash
   gem install claude_hooks
   ```

3. **Configure hooks in your settings:**
   Copy the hooks configuration from `.claude/settings.local.json` to your main `~/.claude/settings.json`, or create a new hooks section based on the examples below.

4. **Make entrypoints executable (if needed):**
   ```bash
   chmod +x ~/.claude/hooks/entrypoints/*.rb
   ```

5. **Test a handler:**
   ```bash
   ruby ~/.claude/hooks/handlers/session_start_handler.rb
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

After installing SimpleClaude, the hooks are located at:

```
~/.claude/hooks/                 # Installed hooks directory
├── handlers/                    # Business logic classes
│   ├── auto_format_handler.rb   # Auto-formatting handler
│   ├── session_start_handler.rb
│   ├── user_prompt_submit_handler.rb
│   ├── pre_tool_use_handler.rb
│   ├── post_tool_use_handler.rb
│   ├── notification_handler.rb
│   ├── stop_handler.rb
│   ├── subagent_stop_handler.rb
│   └── pre_compact_handler.rb
├── entrypoints/                 # Orchestration scripts
│   ├── session_start.rb
│   ├── user_prompt_submit.rb
│   ├── pre_tool_use.rb
│   ├── post_tool_use.rb
│   ├── notification.rb
│   ├── stop.rb
│   ├── subagent_stop.rb
│   └── pre_compact.rb
└── # No settings file - configure in ~/.claude/settings.json
```

**Note:** Hook configuration is done in your main `~/.claude/settings.json` file, not in a separate settings file within the hooks directory.

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

## API Methods Available to Handlers

### Common Methods (All Hook Types)
```ruby
session_id          # Current session ID
transcript_path     # Path to transcript file
cwd                 # Current working directory
read_transcript     # Read full transcript content
config              # Access configuration
log(msg, level:)    # Session-based logging
```

### Hook-Specific Methods

**UserPromptSubmit:**
```ruby
prompt                      # User's prompt
add_additional_context!(ctx) # Add context to prompt
block_prompt!(reason)       # Block prompt processing
```

**PreToolUse:**
```ruby
tool_name               # Name of tool being used
tool_input              # Tool input data
approve_tool!(reason)   # Allow tool usage
block_tool!(reason)     # Deny tool usage
ask_for_permission!(r)  # Request user permission
```

## Testing Individual Components

### Test a Handler
```bash
# Run handler with sample data
ruby ~/.claude/hooks/handlers/session_start_handler.rb

# With custom input
echo '{"session_id": "test", "prompt": "Hello"}' | ruby ~/.claude/hooks/handlers/user_prompt_submit_handler.rb
```

### Test an Entrypoint
```bash
# Test complete hook flow
echo '{"session_id": "test"}' | ruby ~/.claude/hooks/entrypoints/session_start.rb
```

## Creating Custom Handlers

1. **Inherit from the appropriate base class:**
   ```ruby
   class MyCustomHandler < ClaudeHooks::UserPromptSubmit
     def call
       # Your logic here
       output_data
     end
   end
   ```

2. **Add to the entrypoint:**
   ```ruby
   require_relative '../handlers/my_custom_handler'
   
   my_handler = MyCustomHandler.new(input_data)
   my_result = my_handler.call
   results << my_result
   ```

3. **Test your handler:**
   ```ruby
   if __FILE__ == $0
     ClaudeHooks::CLI.test_runner(MyCustomHandler)
   end
   ```

## Configuration Examples

Add these configurations to your `~/.claude/settings.json` file:

### Basic Configuration
```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": ".claude/hooks/entrypoints/session_start.rb"
      }]
    }]
  }
}
```

### Conditional Hooks
```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "matcher": "help.*implement",
      "hooks": [{
        "type": "command",
        "command": ".claude/hooks/entrypoints/user_prompt_submit.rb"
      }]
    }]
  }
}
```

### Multiple Handlers (Production Example)
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [{
        "type": "command",
        "command": ".claude/hooks/entrypoints/post_tool_use.rb"
      }]
    }]
  }
}
```

**Note:** The command paths are relative to your `~/.claude/` directory. Claude Code will resolve `.claude/hooks/entrypoints/` to the full path automatically.

## Environment Variables

- `RUBY_CLAUDE_HOOKS_LOG_DIR`: Directory for hook logs
- `RUBY_CLAUDE_HOOKS_CONFIG_MERGE_STRATEGY`: Config merge strategy
- `RUBY_CLAUDE_HOOKS_DEBUG_MODE`: Enable debug output
- `CLAUDE_PROJECT_DIR`: Project directory (set by Claude Code)

## Debugging

1. **Enable debug mode:**
   ```bash
   export RUBY_CLAUDE_HOOKS_DEBUG_MODE=true
   ```

2. **Check logs:**
   ```bash
   tail -f ~/.claude/logs/hooks/session-*.log
   ```

3. **Test components individually:**
   ```bash
   # Test handler
   ruby ~/.claude/hooks/handlers/session_start_handler.rb
   
   # Test entrypoint
   echo '{}' | ruby ~/.claude/hooks/entrypoints/session_start.rb
   ```

## Next Steps

1. Install SimpleClaude using `./scripts/install.rb` from the repository root
2. Install the claude_hooks gem: `gem install claude_hooks`
3. Review the handler implementations in `~/.claude/hooks/handlers/`
4. Customize the business logic for your use cases in the handlers
5. Add hook configurations to your `~/.claude/settings.json` file
6. Test your implementation using the testing commands above

For more details about the claude_hooks gem architecture, see the official documentation at: https://github.com/gabriel-dehan/claude_hooks
