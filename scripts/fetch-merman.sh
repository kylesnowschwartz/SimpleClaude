#!/usr/bin/env bash
# Downloads the merman-cli release binaries the sc-mods plugin runs, one per
# platform, into plugins/sc-mods/bin/ beside the launcher, with merman's
# licenses in plugins/sc-mods/bin/merman-licenses/.
#
# Each archive is checked against the checksum published with the release
# before anything is extracted, and nothing from an archive is run. A second
# run with the same pinned version does nothing.
#
# With --check it changes nothing: it compares the pinned version with
# merman's latest release, exits 0 when they match and 1 when a newer
# release exists.
set -euo pipefail

MERMAN_VERSION=0.8.0

repository_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
bin_dir="$repository_dir/plugins/sc-mods/bin"
licenses_dir="$bin_dir/merman-licenses"
version_stamp="$licenses_dir/VERSION"
release_url="https://github.com/Latias94/merman/releases/download/v$MERMAN_VERSION"

# Rust target triple, then the os_arch suffix the launcher looks for.
targets=(
    "aarch64-apple-darwin darwin_arm64"
    "x86_64-apple-darwin darwin_amd64"
    "aarch64-unknown-linux-gnu linux_arm64"
    "x86_64-unknown-linux-gnu linux_amd64"
)

fail() {
    echo "fetch-merman: $1" >&2
    exit 1
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
    local latest
    latest=$(latest_release_tag) || fail "could not read merman's latest release"
    latest=${latest#v}
    [[ -n $latest ]] || fail "could not read merman's latest release"
    echo "pinned: $MERMAN_VERSION"
    echo "latest: $latest"
    if [[ $latest == "$MERMAN_VERSION" ]]; then
        echo "merman-cli is current"
        exit 0
    fi
    cat <<STEPS
merman $latest is out. To upgrade:
  1. Set MERMAN_VERSION=$latest in scripts/fetch-merman.sh
  2. just fetch-merman
  3. just test-mods
  4. claude --plugin-dir plugins/sc-mods, and check a few diagrams live
  5. Commit, then release; the release republishes sc-mods-dist
STEPS
    exit 1
}

case ${1:-} in
    "") ;;
    --check) check_for_update ;;
    *)
        echo "usage: fetch-merman.sh [--check]" >&2
        exit 2
        ;;
esac

is_current() {
    [[ -f $version_stamp && $(cat "$version_stamp") == "$MERMAN_VERSION" ]] || return 1
    local target
    for target in "${targets[@]}"; do
        [[ -x "$bin_dir/merman-cli_${target#* }" ]] || return 1
    done
}

if is_current; then
    echo "merman-cli $MERMAN_VERSION is already in $bin_dir"
    exit 0
fi

command -v curl >/dev/null || fail "curl is required"
command -v shasum >/dev/null || command -v sha256sum >/dev/null || fail "shasum or sha256sum is required"

sha256_of() {
    if command -v shasum >/dev/null; then
        shasum -a 256 "$1" | cut -d' ' -f1
    else
        sha256sum "$1" | cut -d' ' -f1
    fi
}

work_dir=$(mktemp -d)
trap 'rm -rf -- "$work_dir"' EXIT

for target in "${targets[@]}"; do
    triple=${target% *}
    platform=${target#* }
    archive="merman-cli-$triple.tar.xz"

    echo "fetching $archive"
    curl -fsSL -o "$work_dir/$archive" "$release_url/$archive"
    curl -fsSL -o "$work_dir/$archive.sha256" "$release_url/$archive.sha256"

    expected=$(cut -d' ' -f1 <"$work_dir/$archive.sha256")
    actual=$(sha256_of "$work_dir/$archive")
    [[ -n $expected && $expected == "$actual" ]] ||
        fail "checksum mismatch for $archive: expected '$expected', got '$actual'"

    mkdir -p "$work_dir/$triple"
    tar -xJf "$work_dir/$archive" -C "$work_dir/$triple"
    extracted="$work_dir/$triple/merman-cli-$triple"
    [[ -f "$extracted/merman-cli" ]] || fail "$archive holds no merman-cli-$triple/merman-cli"

    install -m 0755 "$extracted/merman-cli" "$bin_dir/merman-cli_$platform"
done

# The licenses are the same in every archive; take them from the last one.
rm -rf -- "$licenses_dir"
mkdir -p "$licenses_dir"
for license in LICENSE-MIT LICENSE-APACHE THIRD_PARTY_NOTICES.md THIRD_PARTY_LICENSES; do
    [[ -e "$extracted/$license" ]] || fail "the archive holds no $license"
    cp -R "$extracted/$license" "$licenses_dir/"
done
echo "$MERMAN_VERSION" >"$version_stamp"

echo "merman-cli $MERMAN_VERSION is in $bin_dir"
