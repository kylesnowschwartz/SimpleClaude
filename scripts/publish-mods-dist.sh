#!/usr/bin/env bash
# Publishes the sc-mods plugin as the `sc-mods-dist` branch: the plugin tree at
# the branch root, with the launcher, one merman-cli per platform and merman's
# licenses in bin/. Claude Code clones the root of the ref a marketplace entry
# names, so the branch carries the plugin tree rather than the repository
# layout, and the binaries have to be committed for an install to bring them.
#
# The branch is rewritten as a single commit each time, so its history holds
# no binary blobs beyond the current release.
set -euo pipefail

if [[ $# -gt 1 ]]; then
    echo "usage: publish-mods-dist.sh [remote]" >&2
    exit 2
fi

remote=${1:-origin}
repository_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
plugin_dir="$repository_dir/plugins/sc-mods"
branch=sc-mods-dist
platforms=(darwin_arm64 darwin_amd64 linux_arm64 linux_amd64)

fail() {
    echo "publish-mods-dist: $1" >&2
    exit 1
}

for platform in "${platforms[@]}"; do
    [[ -x "$plugin_dir/bin/merman-cli_$platform" ]] ||
        fail "no bin/merman-cli_$platform; run scripts/fetch-merman.sh first"
done
[[ -f "$plugin_dir/bin/merman-licenses/LICENSE-MIT" ]] ||
    fail "no bin/merman-licenses; run scripts/fetch-merman.sh first"

version=$(tr -d '[:space:]' <"$repository_dir/VERSION")
[[ -n $version ]] || fail "VERSION is empty"

if [[ -d $remote || $remote == *:* || $remote == *://* ]]; then
    remote_url=$remote
else
    remote_url=$(git -C "$repository_dir" remote get-url "$remote" 2>/dev/null) ||
        fail "no remote named $remote in this checkout"
fi

commit_name=$(git -C "$repository_dir" config user.name || true)
commit_email=$(git -C "$repository_dir" config user.email || true)
[[ -n $commit_name && -n $commit_email ]] || fail "no git identity to commit with"

work_dir=$(mktemp -d)
trap 'rm -rf -- "$work_dir"' EXIT

# The plugin tree as committed at HEAD, so a stray edit or an untracked file
# never ships, plus the binaries and licenses fetch-merman.sh put in bin/.
# The .gitignore files only keep those binaries out of the main branch.
[[ -z $(git -C "$repository_dir" status --porcelain -- plugins/sc-mods) ]] ||
    fail "plugins/sc-mods has uncommitted changes; commit or stash them first"
git -C "$repository_dir" archive --format=tar HEAD plugins/sc-mods |
    tar -xf - -C "$work_dir" --strip-components=2
find "$work_dir" -name .gitignore -delete
for platform in "${platforms[@]}"; do
    install -m 0755 "$plugin_dir/bin/merman-cli_$platform" "$work_dir/bin/merman-cli_$platform"
done
cp -R "$plugin_dir/bin/merman-licenses" "$work_dir/bin/"

# Claude Code keeps one cache directory per version, so the manifest carries
# the release version for an update to reach installed copies.
manifest="$work_dir/.claude-plugin/plugin.json"
jq --arg v "$version" '.version = $v' "$manifest" >"$manifest.rewritten"
mv -- "$manifest.rewritten" "$manifest"
[[ $(jq -r .version "$manifest") == "$version" ]] ||
    fail "could not write the version $version into the plugin manifest"

cd "$work_dir"
git init -q .
git checkout -q -b "$branch"
git config user.name "$commit_name"
git config user.email "$commit_email"
git add .
git commit -q -m "sc-mods v$version"

expected=$(git ls-remote "$remote_url" "refs/heads/$branch" | cut -f1)
if [[ -n $expected ]]; then
    git push --force-with-lease="refs/heads/$branch:$expected" "$remote_url" "HEAD:refs/heads/$branch"
else
    git push "$remote_url" "HEAD:refs/heads/$branch"
fi
echo "published sc-mods v$version to the $branch branch"
