# SimpleClaude Testing Documentation

## Testing Commands with Claude -p

SimpleClaude provides a comprehensive testing framework for validating command functionality using Claude's headless mode (`claude -p`). This allows automated testing of command behavior, @include directives, and custom prompts.

### Quick Start

```bash
# Run all tests
./test-commands.sh

# Test specific functionality
./test-commands.sh includes        # Test nested @includes
./test-commands.sh sc-create      # Test sc-create command
./test-commands.sh sc-understand  # Test sc-understand command

# Test any SimpleClaude command
./test-commands.sh sc-fix
./test-commands.sh sc-modify
./test-commands.sh sc-review

# Run custom tests
./test-commands.sh custom "What is 2+2?" "4"
./test-commands.sh custom "Explain @include directives" "include"
```

### What the Test Checks

1. **Basic @include Recognition**
   - Verifies Claude Code recognizes and processes @include directives
2. **Nested @include Resolution**

   - Confirms nested includes (includes within includes) are properly resolved
   - Specifically checks if MCP tools directive from sub-agents.yml is accessible

3. **Command Structure Test**

   - Tests if commands properly load all includes and can use mode detection
   - Uses sc-understand command as example

4. **Specific Nested Content Access**
   - Verifies access to deeply nested content (sub-agent types)
   - Ensures all 7 included YAML files are properly loaded

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

3. **Include Resolution**

```bash
run_claude_test \
    "Can you see @include shared/simpleclaude/modes.yml?" \
    "planner.*implementer.*tester" \
    "Include file access"
```

### Expected Output

```
SimpleClaude Command Testing Framework
======================================
Test mode: all

Testing Nested @include Functionality
-------------------------------------
Basic @include recognition... ✓ Basic @include recognition
Nested @include resolution... ✓ Nested @include resolution
Access to deeply nested content... ✓ Access to deeply nested content

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

- After modifying the include structure
- When adding new shared YAML files
- Before major releases
- If Claude Code updates might affect @include behavior

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
   ls -la .claude/shared/simpleclaude/
   ls -la .claude/commands/simpleclaude/
   ```

3. **Test Individual Includes**

   ```bash
   claude -p "Show content of @include shared/simpleclaude/sub-agents.yml"
   ```

4. **Check for Syntax Errors**
   - Ensure all YAML files are valid
   - Verify @include paths are correct

### Manual Testing

You can also manually test specific includes:

```bash
# Test single include
claude -p --output-format json "Can you see @include shared/simpleclaude/modes.yml"

# Test nested include resolution
claude -p --output-format json "What's in the mcp_tools_directive from includes.md?"

# Test command functionality
claude -p "Using sc-understand command structure, analyze this: explain authentication"
```
