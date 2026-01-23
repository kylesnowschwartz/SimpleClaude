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

    # Update CLAUDE.md
    sed -i '' "s/Current version: [0-9]*\.[0-9]*\.[0-9]*/Current version: $new/" CLAUDE.md

    # Update marketplace.json top-level version
    jq --arg v "$new" '.version = $v' .claude-plugin/marketplace.json | sponge .claude-plugin/marketplace.json

    # Update all plugin versions (marketplace.json and individual plugin.json files)
    for plugin in simpleclaude-core sc-hooks sc-extras sc-output-styles sc-skills sc-refactor; do
        # Update marketplace.json entry
        jq --arg name "$plugin" --arg v "$new" \
            '(.plugins[] | select(.name == $name)).version = $v' \
            .claude-plugin/marketplace.json | sponge .claude-plugin/marketplace.json

        # Update plugin's own plugin.json
        f="plugins/$plugin/.claude-plugin/plugin.json"
        if [[ -f "$f" ]]; then
            jq --arg v "$new" '.version = $v' "$f" | sponge "$f"
        fi
    done

    echo "'Just bump' done. Changes are now ready to release. Run 'just release' after confirmation with the user."

# Commit, tag, and push the release
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
        echo "Error: nothing staged. Run 'just bump' first, then 'git add -u'"
        exit 1
    fi

    # Commit, tag, push
    git commit -m "chore: Bump version to v$v"
    git tag "v$v"
    git push && git push --tags

    echo "Released v$v"
