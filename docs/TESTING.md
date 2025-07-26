# SimpleClaude Testing Documentation

## Testing Commands with Claude -p

SimpleClaude provides a comprehensive testing framework for validating command functionality using Claude's headless mode (`claude -p`). This allows automated testing of command behavior, agent delegation, and specialized task execution.

### Quick Start

```bash
# Run all tests
./test-commands.sh

# Test specific functionality
./test-commands.sh agents          # Test agent delegation
./test-commands.sh sc-create      # Test sc-create command
./test-commands.sh sc-understand  # Test sc-understand command

# Test any SimpleClaude command
./test-commands.sh sc-fix
./test-commands.sh sc-modify
./test-commands.sh sc-review

# Run custom tests
./test-commands.sh custom "What is 2+2?" "4"
./test-commands.sh custom "Test agent spawning" "Task"
```

### What the Test Checks

1. **Agent Delegation**
   - Verifies commands properly spawn specialized agents via Task() calls
2. **Agent Functionality**

   - Confirms agents have access to their specialized contexts
   - Specifically checks if agent definitions are properly accessible

3. **Command Structure Test**

   - Tests if commands properly delegate to agents and use mode detection
   - Uses sc-understand command as example

4. **Agent Specialization**
   - Verifies access to specialized agent functionality
   - Ensures all 7 agent types are properly defined and accessible

### Understanding claude -p

The `claude -p` (print) flag enables headless testing:

- Sends a prompt to Claude and returns the response
- Supports `--output-format json` for structured responses
- Perfect for automated testing and CI/CD pipelines
- No interactive session required

### Writing New Tests

To add a new test suite to `test-commands.sh`:

```bash
# Add a new function in test-commands.sh
test_my_feature() {
    echo -e "${MAGENTA}Testing My Feature${NC}"
    echo "-------------------------"

    run_claude_test \
        "Your test prompt here" \
        "expected_keyword" \
        "Description of what you're testing"

    echo ""
}

# Add to the case statement
case "$TEST_TYPE" in
    "my-feature")
        test_my_feature
        ;;
    # ... other cases
esac
```

### Test Patterns

1. **Command Mode Detection**

```bash
run_claude_test \
    "Using sc-create for 'user auth API', what mode?" \
    "implementer" \
    "Mode detection test"
```

2. **Sub-agent Spawning**

```bash
run_claude_test \
    "What sub-agents for 'secure payment API'?" \
    "researcher.*coder.*validator" \
    "Sub-agent detection"
```

3. **Agent Resolution**

```bash
run_claude_test \
    "Can you see agent specialists available?" \
    "implementation.*research.*validation" \
    "Agent access test"
```

### Expected Output

```
SimpleClaude Command Testing Framework
======================================
Test mode: all

Testing Agent Architecture
-------------------------
Agent delegation recognition... ✓ Agent delegation recognition
Specialized agent resolution... ✓ Specialized agent resolution
Access to agent functionality... ✓ Access to agent functionality

Testing sc-create Command
-------------------------
Mode detection for 'user auth API'... ✓ Mode detection for 'user auth API'
Sub-agent spawning detection... ✓ Sub-agent spawning detection

Testing sc-understand Command
-----------------------------
Mode detection for 'explain authentication'... ✓ Mode detection for 'explain authentication'
Mode detection for performance analysis... ✓ Mode detection for performance analysis

======================================
Test run complete!
======================================
```

### When to Run This Test

- After modifying the agent architecture
- When adding new specialized agents
- Before major releases
- If Claude Code updates might affect agent delegation

### Test Requirements

- Claude Code must be installed and accessible via `claude` command
- SimpleClaude project structure must be intact
- Test must be run from SimpleClaude root directory

### Troubleshooting

If tests fail:

1. **Check Claude Code Installation**

   ```bash
   claude --version
   ```

2. **Verify File Structure**

   ```bash
   ls -la .claude/agents/
   ls -la .claude/commands/simpleclaude/
   ```

3. **Test Individual Includes**

   ```bash
   claude -p "List available agent specialists"
   ```

4. **Check for Syntax Errors**
   - Ensure all agent files are valid
   - Verify agent definitions are correct

### Manual Testing

You can also manually test specific agents:

```bash
# Test agent access
claude -p --output-format json "List available SimpleClaude agent specialists"

# Test agent loading
claude -p --output-format json "What agent files are available in the SimpleClaude system?"

# Test command functionality
claude -p "Using sc-understand command structure, analyze this: explain authentication"
```
