#!/bin/bash
# Generic test script for SimpleClaude commands using claude -p
# Usage: ./test-commands.sh [specific-test]
# Examples:
#   ./test-commands.sh              # Run all tests
#   ./test-commands.sh includes     # Test nested includes only
#   ./test-commands.sh sc-create    # Test sc-create command
#   ./test-commands.sh custom "prompt" "expected_result"

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Get test type from argument
TEST_TYPE="${1:-all}"

echo -e "${YELLOW}SimpleClaude Command Testing Framework${NC}"
echo "======================================"
echo -e "${BLUE}Test mode: $TEST_TYPE${NC}"
echo ""

# Function to check if command succeeded
check_result() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $1${NC}"
    return 0
  else
    echo -e "${RED}✗ $1${NC}"
    return 1
  fi
}

# Function to run a claude -p test
run_claude_test() {
  local prompt="$1"
  local expected="$2"
  local description="$3"

  echo -n "$description... "
  result=$(claude -p --output-format json "$prompt" 2>/dev/null || echo '{"error": "command failed"}')

  if [ -n "$expected" ]; then
    if echo "$result" | grep -q "$expected"; then
      check_result "$description"
      return 0
    else
      echo -e "${RED}✗ $description${NC}"
      echo -e "${RED}  Expected: '$expected'${NC}"
      echo -e "${RED}  Got: $(echo "$result" | jq -r '.result // .error' 2>/dev/null || echo "$result")${NC}"
      return 1
    fi
  else
    # Just check if command succeeded
    if echo "$result" | grep -q '"subtype":"success"'; then
      check_result "$description"
      return 0
    else
      echo -e "${RED}✗ $description${NC}"
      echo -e "${RED}  Error: $(echo "$result" | jq -r '.error // "Unknown error"' 2>/dev/null)${NC}"
      return 1
    fi
  fi
}

# Test suite for nested includes
test_includes() {
  echo -e "${MAGENTA}Testing Nested @include Functionality${NC}"
  echo "-------------------------------------"

  run_claude_test \
    "Can you see the content from this include directive: @.claude/shared/simpleclaude/includes.md" \
    "includes.md" \
    "Basic @include recognition"

  run_claude_test \
    "When you process @.claude/shared/simpleclaude/includes.md, can you see the actual content from the nested includes like the MCP tools directive from sub-agents.yml?" \
    "mcp_tools_directive" \
    "Nested @include resolution"

  run_claude_test \
    "In the SimpleClaude system loaded via @.claude/shared/simpleclaude/includes.md, what are the 4 sub-agent types defined?" \
    "researcher.*coder" \
    "Access to deeply nested content"

  echo ""
}

# Test suite for sc-create command
test_sc_create() {
  echo -e "${MAGENTA}Testing sc-create Command${NC}"
  echo "-------------------------"

  # Load command content
  cmd_content=$(cat .claude/commands/simpleclaude/sc-create.md | sed 's/\$ARGUMENTS/user auth API/g')

  run_claude_test \
    "Using this command definition, what mode would be selected: $cmd_content" \
    "implementer" \
    "Mode detection for 'user auth API'"

  run_claude_test \
    "Using sc-create command structure from SimpleClaude, what sub-agents would be spawned for 'secure payment API'?" \
    "researcher.*coder.*validator" \
    "Sub-agent spawning detection"

  echo ""
}

# Test suite for sc-understand command
test_sc_understand() {
  echo -e "${MAGENTA}Testing sc-understand Command${NC}"
  echo "-----------------------------"

  cmd_content=$(head -30 .claude/commands/simpleclaude/sc-understand.md)

  run_claude_test \
    "Using this command definition, what mode is selected for 'explain authentication': $cmd_content" \
    "planner" \
    "Mode detection for 'explain authentication'"

  run_claude_test \
    "In sc-understand command, what mode is used for 'analyze performance bottlenecks'?" \
    "implementer" \
    "Mode detection for performance analysis"

  echo ""
}

# Test suite for custom commands
test_custom() {
  local prompt="$2"
  local expected="$3"

  echo -e "${MAGENTA}Running Custom Test${NC}"
  echo "-------------------"

  if [ -z "$prompt" ]; then
    echo -e "${RED}Error: Custom test requires prompt as second argument${NC}"
    echo "Usage: $0 custom \"prompt\" [\"expected_result\"]"
    exit 1
  fi

  run_claude_test "$prompt" "$expected" "Custom test"
  echo ""
}

# Generic command tester
test_command() {
  local cmd_name="$1"
  local test_prompt="$2"
  local expected_result="$3"

  echo -e "${MAGENTA}Testing $cmd_name Command${NC}"
  echo "-------------------------------------"

  if [ -f ".claude/commands/simpleclaude/$cmd_name.md" ]; then
    cmd_content=$(cat ".claude/commands/simpleclaude/$cmd_name.md")

    run_claude_test \
      "Using this $cmd_name command definition: $cmd_content. $test_prompt" \
      "$expected_result" \
      "$cmd_name command test"
  else
    echo -e "${RED}Command file not found: $cmd_name.md${NC}"
  fi

  echo ""
}

# Main test runner
case "$TEST_TYPE" in
"all")
  test_includes
  test_sc_create
  test_sc_understand
  ;;
"includes")
  test_includes
  ;;
"sc-create")
  test_sc_create
  ;;
"sc-understand")
  test_sc_understand
  ;;
"custom")
  test_custom "$@"
  ;;
*)
  # Try to test as a command name
  if [ -f ".claude/commands/simpleclaude/$TEST_TYPE.md" ]; then
    echo -e "${YELLOW}Testing $TEST_TYPE as a command${NC}"
    test_command "$TEST_TYPE" "What mode would be used?" "planner\\|implementer\\|tester"
  else
    echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
    echo ""
    echo "Available test types:"
    echo "  all          - Run all tests"
    echo "  includes     - Test nested @include functionality"
    echo "  sc-create    - Test sc-create command"
    echo "  sc-understand - Test sc-understand command"
    echo "  custom       - Run a custom test"
    echo "  [command]    - Test any SimpleClaude command by name"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 includes"
    echo "  $0 sc-fix"
    echo "  $0 custom \"What is 2+2?\" \"4\""
    exit 1
  fi
  ;;
esac

# Summary
echo -e "${GREEN}======================================"
echo -e "Test run complete!"
echo -e "======================================${NC}"

# Usage hints
if [ "$TEST_TYPE" = "all" ]; then
  echo ""
  echo "Tips for using this test framework:"
  echo -e "${BLUE}1. Test specific functionality:${NC}"
  echo "   ./test-commands.sh includes"
  echo ""
  echo -e "${BLUE}2. Test any command:${NC}"
  echo "   ./test-commands.sh sc-modify"
  echo ""
  echo -e "${BLUE}3. Run custom tests:${NC}"
  echo "   ./test-commands.sh custom \"Your prompt here\" \"expected_result\""
  echo ""
  echo -e "${BLUE}4. Add new test suites:${NC}"
  echo "   Edit this script and add a new test_* function"
fi
