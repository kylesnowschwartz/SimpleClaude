#!/usr/bin/env bash
# Pins the merman release sc-mods runs. With a version it writes
# plugins/sc-mods/bin/merman.pin: that version and the sha256 merman
# publishes for each platform's archive, which bin/merman-cli checks its
# download against. The pin is written only once every checksum is in hand.
#
# With --check it changes nothing: it compares the pinned version with
# merman's latest release, exits 0 when they match and 1 when a newer
# release exists.
set -euo pipefail

repository_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
pin_file="$repository_dir/plugins/sc-mods/bin/merman.pin"
releases_url=https://github.com/Latias94/merman/releases/download

# The Rust target triples merman publishes, one archive each.
targets=(
    aarch64-apple-darwin
    x86_64-apple-darwin
    aarch64-unknown-linux-gnu
    x86_64-unknown-linux-gnu
)

fail() {
    echo "update-merman: $1" >&2
    exit 1
}

usage() {
    echo "usage: update-merman.sh <version> | --check" >&2
    exit 2
}

pinned_version() {
    awk '$1 == "version" { print $2 }' "$pin_file"
}

latest_release_tag() {
    if command -v gh >/dev/null; then
        gh release view --repo Latias94/merman --json tagName --jq .tagName
    else
        curl -fsSL https://api.github.com/repos/Latias94/merman/releases/latest |
            sed -n 's/^ *"tag_name": *"\([^"]*\)".*/\1/p'
    fi
}

check_for_update() {
    local pinned latest
    pinned=$(pinned_version)
    latest=$(latest_release_tag) || fail "could not read merman's latest release"
    latest=${latest#v}
    [[ -n $latest ]] || fail "could not read merman's latest release"
    echo "pinned: $pinned"
    echo "latest: $latest"
    if [[ $latest == "$pinned" ]]; then
        echo "merman-cli is current"
        exit 0
    fi
    cat <<STEPS
merman $latest is out. To upgrade:
  1. just update-merman $latest
  2. just test-mods and just test-mods-real
  3. claude --plugin-dir plugins/sc-mods, and check a few diagrams live
  4. Commit, then release with just bump and just release
STEPS
    exit 1
}

# The checksum line merman publishes reads "<sha256> *<archive>".
published_checksum() {
    local version=$1 archive="merman-cli-$2.tar.xz"
    local line checksum
    line=$(curl -fsSL "$releases_url/v$version/$archive.sha256") ||
        fail "could not download the checksum of $archive for merman $version"
    checksum=${line%% *}
    [[ $checksum =~ ^[0-9a-f]{64}$ ]] || fail "the checksum file of $archive holds no sha256: '$line'"
    echo "$checksum"
}

pin() {
    local version=${1#v}
    local pin_text target checksum
    command -v curl >/dev/null || fail "curl is required"

    pin_text="# The merman release bin/merman-cli downloads, and the sha256 of each
# platform's archive. \`just update-merman <version>\` writes this file.
version $version
"
    for target in "${targets[@]}"; do
        checksum=$(published_checksum "$version" "$target")
        pin_text+="$target $checksum"$'\n'
    done
    printf '%s' "$pin_text" >"$pin_file"
    echo "pinned merman $version in $pin_file"
}

[[ $# -eq 1 ]] || usage
case $1 in
    --check) check_for_update ;;
    -*) usage ;;
    *) pin "$1" ;;
esac
