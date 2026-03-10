#!/usr/bin/env zsh
# Smoke test for adversarial-review CLI invocations.
# Verifies codex/gemini produce real reviews, not plan prompts or empty output.
#
# Usage:
#   ./test/test_adversarial_cli_smoke.sh          # all
#   ./test/test_adversarial_cli_smoke.sh codex     # codex only
#   ./test/test_adversarial_cli_smoke.sh gemini    # gemini only

set -uo pipefail

OUT_DIR="/tmp/adversarial-smoke"
TIMEOUT=300
passed=0
failed=0
skipped=0

pass() {
  echo "  PASS: $1"
  passed=$((passed + 1))
}
fail() {
  echo "  FAIL: $1"
  failed=$((failed + 1))
}
skip() {
  echo "  SKIP: $1"
  skipped=$((skipped + 1))
}

setup() {
  rm -rf "$OUT_DIR"
  mkdir -p "$OUT_DIR"

  # Small diff with intentional bugs for the reviewer to find
  cat >"$OUT_DIR/diff.txt" <<'DIFF'
diff --git a/app/services/user_lifecycle.rb b/app/services/user_lifecycle.rb
new file mode 100644
--- /dev/null
+++ b/app/services/user_lifecycle.rb
@@ -0,0 +1,30 @@
+class UserLifecycle
+  def initialize(user)
+    @user = user
+  end
+
+  def activate!
+    return if @user.active?
+    @user.update!(status: :active, activated_at: Time.now)
+    notify_change
+    UserMailer.welcome(@user.id).deliver_later
+  end
+
+  def suspend!(reason:)
+    @user.update!(status: :suspended, suspended_reason: reason)
+    @user.sessions.active.delete_all
+    notify_change
+  end
+
+  def delete!
+    @user.items.each { |item| item.archive! }
+    @user.update!(status: :deleted, deleted_at: Time.now)
+    notify_change
+  end
+
+  private
+
+  def notify_change
+    UpdateSequenceIdJob.perform_later(@user)
+    EventBus.publish("user.lifecycle.changed", user_id: @user.id)
+  end
+end
DIFF
}

# Validate output: exists, >500 chars, not a plan-confirmation prompt
validate() {
  local file="$1" name="$2"

  if [[ ! -s "$file" ]]; then
    fail "$name output missing or empty"
    return 1
  fi

  local size=$(wc -c <"$file" | tr -d ' ')
  if ((size < 500)); then
    fail "$name output too short (${size} chars)"
    echo "    Content: $(head -c 200 "$file")"
    return 1
  fi

  # Catch plan-confirmation instead of actual review.
  # Causes: -s read-only in headless mode, or piping stdin (codex ignores it).
  if grep -qi "if you're happy with that approach\|shall I proceed\|ready to start" "$file"; then
    fail "$name produced a plan-confirmation, not a review"
    echo "    First line: $(head -1 "$file")"
    return 1
  fi
  # Also catch bare "Plan:" at start of output (codex proposing but not executing)
  if head -1 "$file" | grep -q "^Plan:"; then
    fail "$name output starts with 'Plan:' — codex proposed instead of executing"
    return 1
  fi

  pass "$name review OK (${size} chars)"
}

test_codex() {
  echo ""
  echo "--- Codex ---"

  if ! command -v codex &>/dev/null; then
    skip "codex not installed"
    return
  fi

  local prompt="The file $OUT_DIR/diff.txt contains a diff for a UserLifecycle service. Read it and find concrete bugs: race conditions, missing error handling, partial failures, and edge cases. For each: WHAT breaks, SCENARIO, IMPACT."

  echo "  codex exec --full-auto ..."
  local exit_code=0
  timeout "$TIMEOUT" codex exec -C "$PWD" --full-auto "$prompt" \
    -o "$OUT_DIR/codex.txt" >/dev/null 2>"$OUT_DIR/codex-err.txt" || exit_code=$?

  if ((exit_code == 124)); then
    fail "codex timed out (${TIMEOUT}s)"
    return
  fi

  validate "$OUT_DIR/codex.txt" "codex"
}

test_gemini() {
  echo ""
  echo "--- Gemini ---"

  if ! command -v gemini &>/dev/null; then
    skip "gemini not installed"
    return
  fi
  if [[ -z "${GEMINI_API_KEY:-}" ]]; then
    skip "GEMINI_API_KEY not set"
    return
  fi

  local prompt="Find concrete bugs in this Rails diff: race conditions, missing error handling, partial failures, edge cases. For each: WHAT breaks, SCENARIO, IMPACT."

  for model in gemini-3.1-pro-preview gemini-2.5-pro gemini-2.5-flash; do
    echo "  gemini -m $model ..."
    local exit_code=0
    timeout "$TIMEOUT" gemini -m "$model" -p "$prompt" \
      <"$OUT_DIR/diff.txt" >"$OUT_DIR/gemini.txt" 2>"$OUT_DIR/gemini-err.txt" || exit_code=$?

    if ((exit_code == 0)) && [[ -s "$OUT_DIR/gemini.txt" ]]; then
      validate "$OUT_DIR/gemini.txt" "gemini ($model)"
      return
    fi
    echo "    $model failed (exit $exit_code)"
  done

  fail "gemini: all models failed"
}

# --- Main ---
echo "Adversarial Review CLI Smoke Test"
echo "================================="
setup

case "${1:-all}" in
codex) test_codex ;;
gemini) test_gemini ;;
all)
  test_codex
  test_gemini
  ;;
*)
  echo "Usage: $0 [codex|gemini|all]"
  exit 1
  ;;
esac

echo ""
echo "================================="
echo "Results: $passed passed, $failed failed, $skipped skipped"
rm -rf "$OUT_DIR"
((failed > 0)) && exit 1 || exit 0
