# SimpleClaude release automation
# All plugins share one version. Simple.

set shell := ["zsh", "-cu"]

default:
    @just --list

# Show current version and commits since last release
status:
    @echo "Version: $(cat VERSION)"
    @echo ""
    @echo "Commits since last release:"
    @git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~10)..HEAD

# Bump version (patch|minor|major) and update all files
bump type:
    #!/usr/bin/env zsh
    set -e

    # Parse current version
    v=$(cat VERSION)
    IFS='.' read -r M m p <<< "$v"

    # Calculate new version
    case {{type}} in
        patch) new="$M.$m.$((p+1))" ;;
        minor) new="$M.$((m+1)).0" ;;
        major) new="$((M+1)).0.0" ;;
        *) echo "Usage: just bump patch|minor|major" && exit 1 ;;
    esac

    echo "Bumping $v → $new"

    # Update VERSION file
    echo "$new" > VERSION

    # Update README badge
    sed -i '' "s/version-[0-9]*\.[0-9]*\.[0-9]*-blue/version-$new-blue/" README.md

    # Update marketplace.json top-level version
    jq --arg v "$new" '.metadata.version = $v' .claude-plugin/marketplace.json | sponge .claude-plugin/marketplace.json

    # Update all plugin versions (discovered from filesystem)
    for f in plugins/*/.claude-plugin/plugin.json; do
        plugin=$(echo "$f" | cut -d/ -f2)

        # Update marketplace.json entry, and its local-path "-dev" twin where one exists
        jq --arg name "$plugin" --arg v "$new" \
            '(.plugins[] | select(.name == $name or .name == ($name + "-dev"))).version = $v' \
            .claude-plugin/marketplace.json | sponge .claude-plugin/marketplace.json

        # Update plugin's own plugin.json
        jq --arg v "$new" '.version = $v' "$f" | sponge "$f"
    done

    # Stage all version files
    git add VERSION README.md .claude-plugin/marketplace.json
    git add plugins/*/.claude-plugin/plugin.json 2>/dev/null || true

    echo "'Just bump' done. Changes staged and ready. Run 'just release' to commit, tag, and push."

# Commit, tag, and push the release, then republish sc-mods-dist
release:
    #!/usr/bin/env zsh
    set -e

    v=$(cat VERSION)

    # Safety: ensure we're on main and up to date
    branch=$(git branch --show-current)
    if [[ "$branch" != "main" ]]; then
        echo "Error: must be on main branch (currently on $branch)"
        exit 1
    fi

    git fetch origin main
    behind=$(git rev-list HEAD..origin/main --count)
    if [[ "$behind" -gt 0 ]]; then
        echo "Error: $behind commit(s) behind origin/main"
        echo "Run 'git pull --rebase' first"
        exit 1
    fi

    # Check for uncommitted changes (should have version bump staged)
    if git diff --cached --quiet; then
        echo "Error: nothing staged. Run 'just bump' first."
        exit 1
    fi

    # Commit, tag, push
    git commit -m "chore: Bump version to v$v"
    git tag "v$v"
    git push && git push --tags

    echo "Released v$v"

    # sc-mods installs come from the sc-mods-dist branch, which only a
    # publish moves to the new version. The tag stays either way.
    if ! ./scripts/fetch-merman.sh; then
        echo "Error: v$v is released, but the merman binaries could not be fetched, so sc-mods-dist was not republished."
        echo "Retry with: just fetch-merman && just publish-mods"
        exit 1
    fi
    if ! "{{just_executable()}}" publish-mods; then
        echo "Error: v$v is released, but sc-mods-dist was not republished."
        echo "Retry with: just publish-mods"
        exit 1
    fi

# Download the pinned merman-cli binaries sc-mods runs (does nothing when present)
fetch-merman:
    ./scripts/fetch-merman.sh

# Compare the pinned merman version with merman's latest release (changes nothing)
check-merman:
    ./scripts/fetch-merman.sh --check

# Publish sc-mods with its merman binaries to the sc-mods-dist branch
publish-mods:
    #!/usr/bin/env zsh
    set -e
    for platform in darwin_arm64 darwin_amd64 linux_arm64 linux_amd64; do
        if [[ ! -x plugins/sc-mods/bin/merman-cli_$platform ]]; then
            echo "Error: plugins/sc-mods/bin/merman-cli_$platform is missing. Run scripts/fetch-merman.sh first."
            exit 1
        fi
    done
    ./scripts/publish-mods-dist.sh

# Syntax-check all hook Ruby files, then run hook unit/integration tests
test:
    @find plugins/sc-hooks/hooks -name '*.rb' -print0 | xargs -0 -n1 ruby -c
    @ruby test/test_auto_format_batch.rb
    @ruby test/test_error_handling.rb
    @ruby test/test_tool_command.rb

# Validate and test the sc-mods mods (needs the claude CLI)
test-mods:
    claude plugin validate plugins/sc-mods
    claude plugin test plugins/sc-mods

# Smoke test external CLI invocations (codex/gemini)
test-cli target="all":
    ./test/test_adversarial_cli_smoke.sh {{target}}

update:
  @claude plugin marketplace update simpleclaude
