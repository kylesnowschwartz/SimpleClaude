# SimpleClaude release automation

default:
    @just --list

# Commits since last release
changes:
    #!/usr/bin/env zsh
    git log --oneline $(git describe --tags --abbrev=0)..HEAD

# Plugins changed since last release
affected:
    #!/usr/bin/env zsh
    git diff --name-only $(git describe --tags --abbrev=0)..HEAD | grep -E '^plugins/' | cut -d'/' -f2 | sort -u

# Current versions
versions:
    #!/usr/bin/env zsh
    echo "marketplace: $(cat VERSION)"
    for p in simpleclaude-core sc-hooks sc-extras sc-output-styles sc-skills sc-refactor; do
        [[ -f "plugins/$p/.claude-plugin/plugin.json" ]] && printf "%-18s %s\n" "$p:" "$(jq -r .version plugins/$p/.claude-plugin/plugin.json)"
    done

# Set marketplace version
set-version version:
    #!/usr/bin/env zsh
    echo "{{version}}" > VERSION
    sed -i '' 's/version-[0-9]*\.[0-9]*\.[0-9]*-blue/version-{{version}}-blue/' README.md
    sed -i '' 's/Current version: [0-9]*\.[0-9]*\.[0-9]*/Current version: {{version}}/' CLAUDE.md
    jq '.version = "{{version}}"' .claude-plugin/marketplace.json | sponge .claude-plugin/marketplace.json

# Bump plugin (patch|minor|major)
bump plugin type:
    #!/usr/bin/env zsh
    f="plugins/{{plugin}}/.claude-plugin/plugin.json"
    v=$(jq -r .version "$f"); IFS='.' read -r M m p <<< "$v"
    case {{type}} in patch) n="$M.$m.$((p+1))";; minor) n="$M.$((m+1)).0";; major) n="$((M+1)).0.0";; esac
    echo "{{plugin}}: $v → $n"
    jq --arg v "$n" '.version=$v' "$f" | sponge "$f"
    jq --arg name "{{plugin}}" --arg v "$n" '(.plugins[]|select(.name==$name)).version=$v' .claude-plugin/marketplace.json | sponge .claude-plugin/marketplace.json

# Bump all affected plugins
bump-affected type:
    #!/usr/bin/env zsh
    for p in $(just affected); do just bump "$p" {{type}}; done

# Commit, tag, push
release version:
    git add -u && git commit -m "chore: Bump version to v{{version}}"
    git tag v{{version}}
    git push && git push --tags
