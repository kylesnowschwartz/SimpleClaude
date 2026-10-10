#!/usr/bin/env ruby
# frozen_string_literal: true

# Tests for plugins/sc-mods/bin/merman-cli, the launcher that downloads the
# pinned merman release for this machine into a cache and runs it.
#
# Each case copies the launcher into a scratch folder beside its own
# merman.pin, points the cache at a scratch folder, and serves release
# archives from a file:// URL, so nothing touches the network or ~/.cache.
#
# Run directly: ruby test/test_merman_launcher.rb

require 'digest'
require 'fileutils'
require 'open3'
require 'tmpdir'

LAUNCHER = File.expand_path('../plugins/sc-mods/bin/merman-cli', __dir__)
VERSION = '9.9.9'
CANNOT_PROVIDE = 127
# merman's archives also carry man pages, which the launcher leaves out.
ARCHIVE_TEXT_FILES = %w[
  LICENSE-APACHE LICENSE-MIT THIRD_PARTY_NOTICES.md THIRD_PARTY_LICENSES/dagre/LICENSE man/merman-cli.1
].freeze
TOOLS = %w[awk chmod curl cut dirname mkdir mktemp mv rm shasum sha256sum tar uname xz].freeze

FAILURES = [] # rubocop:disable Style/MutableConstant -- intentional test accumulator

def check(description)
  passed = yield
  puts passed ? "  ok - #{description}" : "  FAIL - #{description}"
  FAILURES << description unless passed
rescue StandardError => e
  puts "  FAIL - #{description} (#{e.class}: #{e.message})"
  FAILURES << description
end

def host_target
  case [`uname -s`.chomp, `uname -m`.chomp]
  in ['Darwin', 'arm64' | 'aarch64'] then 'aarch64-apple-darwin'
  in ['Darwin', 'x86_64'] then 'x86_64-apple-darwin'
  in ['Linux', 'aarch64' | 'arm64'] then 'aarch64-unknown-linux-gnu'
  in ['Linux', 'x86_64' | 'amd64'] then 'x86_64-unknown-linux-gnu'
  end
end

# One scratch world: a plugin bin/ folder, a cache, a release server folder
# and a PATH of chosen tools.
class LauncherWorld
  attr_reader :root, :cache_root

  def initialize(root)
    @root = root
    @cache_root = File.join(root, 'cache', 'sc-mods')
    @bin_dir = File.join(root, 'plugin', 'bin')
    @releases_dir = File.join(root, 'releases')
    FileUtils.mkdir_p(@bin_dir)
    FileUtils.cp(LAUNCHER, @bin_dir)
  end

  def install_dir(version = VERSION) = File.join(cache_root, "merman-#{version}")

  def pin(checksum)
    File.write(File.join(@bin_dir, 'merman.pin'), "version #{VERSION}\n#{host_target} #{checksum}\n")
  end

  # Builds a release archive laid out like merman's, whose merman-cli prints
  # `banner` and its arguments. Returns the archive's sha256.
  def publish_archive(banner)
    source_dir = File.join(root, 'archive-source')
    unpacked = File.join(source_dir, "merman-cli-#{host_target}")
    FileUtils.mkdir_p(File.join(unpacked, 'THIRD_PARTY_LICENSES', 'dagre'))
    FileUtils.mkdir_p(File.join(unpacked, 'man'))
    write_executable(File.join(unpacked, 'merman-cli'), banner)
    ARCHIVE_TEXT_FILES.each { |name| File.write(File.join(unpacked, name), "#{name}\n") }

    release_dir = File.join(@releases_dir, "v#{VERSION}")
    FileUtils.mkdir_p(release_dir)
    archive = File.join(release_dir, "merman-cli-#{host_target}.tar.xz")
    _, status = Open3.capture2e('tar', '-cJf', archive, File.basename(unpacked), chdir: source_dir)
    raise "could not build #{archive}" unless status.success?

    Digest::SHA256.file(archive).hexdigest
  end

  def cache_binary(banner, version: VERSION)
    FileUtils.mkdir_p(install_dir(version))
    write_executable(File.join(install_dir(version), 'merman-cli'), banner)
  end

  # Runs the launcher with only `tools` on PATH. Returns stdout, stderr and
  # the exit status.
  def run(*, tools: TOOLS)
    env = {
      'PATH' => tool_dir(tools),
      'XDG_CACHE_HOME' => File.dirname(cache_root),
      'SC_MODS_MERMAN_RELEASES' => "file://#{@releases_dir}"
    }
    stdout, stderr, status = Open3.capture3(env, File.join(@bin_dir, 'merman-cli'), *, unsetenv_others: true)
    [stdout, stderr, status.exitstatus]
  end

  def leftover_downloads = Dir.glob(File.join(cache_root, '.download.*'))

  private

  def write_executable(path, banner)
    File.write(path, "#!/bin/sh\necho \"#{banner} $*\"\n")
    File.chmod(0o755, path)
  end

  def tool_dir(tools)
    dir = Dir.mktmpdir('tools', root)
    tools.each do |tool|
      found, status = Open3.capture2('sh', '-c', 'command -v "$1"', '_', tool)
      FileUtils.ln_sf(found.chomp, File.join(dir, tool)) if status.success?
    end
    dir
  end
end

def in_world
  Dir.mktmpdir('merman-launcher') { |root| yield LauncherWorld.new(root) }
end

puts 'merman-cli launcher'

check 'a cached binary runs with its arguments, with no download tools on PATH' do
  in_world do |world|
    world.pin('0' * 64)
    world.cache_binary('cached merman')
    stdout, _, status = world.run('--version', tools: %w[awk dirname uname])
    status.zero? && stdout == "cached merman --version\n"
  end
end

check 'a cache miss downloads, checks and unpacks the binary with its licenses, then runs it' do
  in_world do |world|
    world.pin(world.publish_archive('downloaded merman'))
    stdout, _, status = world.run('--version')
    installed = Dir.children(world.install_dir).sort
    status.zero? && stdout == "downloaded merman --version\n" &&
      installed == %w[LICENSE-APACHE LICENSE-MIT THIRD_PARTY_LICENSES THIRD_PARTY_NOTICES.md merman-cli] &&
      world.leftover_downloads.empty?
  end
end

check 'a download removes the cached copies of other merman versions' do
  in_world do |world|
    world.pin(world.publish_archive('downloaded merman'))
    world.cache_binary('old merman', version: '0.1.0')
    _, _, status = world.run('--version')
    status.zero? && Dir.children(world.cache_root) == ["merman-#{VERSION}"]
  end
end

check 'an archive whose sha256 differs from the pin is refused and nothing is cached' do
  in_world do |world|
    world.publish_archive('tampered merman')
    world.pin('0' * 64)
    stdout, stderr, status = world.run('--version')
    status == CANNOT_PROVIDE && stdout.empty? && stderr.include?('merman.pin expects') &&
      !File.exist?(world.install_dir) && world.leftover_downloads.empty?
  end
end

check 'a release with no archive for this machine exits 127 naming the URL' do
  in_world do |world|
    world.pin('0' * 64)
    _, stderr, status = world.run('--version')
    status == CANNOT_PROVIDE && stderr.include?('could not download file://') && world.leftover_downloads.empty?
  end
end

check 'a missing download tool exits 127 naming the tool' do
  in_world do |world|
    world.pin(world.publish_archive('downloaded merman'))
    _, stderr, status = world.run('--version', tools: TOOLS - ['curl'])
    status == CANNOT_PROVIDE && stderr.include?('needs curl') && !File.exist?(world.install_dir)
  end
end

check 'a pin with no checksum for this machine exits 127' do
  in_world do |world|
    world.pin('')
    _, stderr, status = world.run('--version')
    status == CANNOT_PROVIDE && stderr.include?("no checksum for #{host_target}")
  end
end

puts
if FAILURES.empty?
  puts 'PASS'
  exit 0
else
  puts "FAIL (#{FAILURES.length}): #{FAILURES.join('; ')}"
  exit 1
end
