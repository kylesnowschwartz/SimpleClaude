#!/usr/bin/env ruby
# frozen_string_literal: true

##
# SimpleClaude Installer
#
# Convenience wrapper for Claude Code's native plugin system.
# Registers the SimpleClaude marketplace and installs plugins.
#
# Usage:
#   ./scripts/install.rb [--force] [--dry-run]
#
# Options:
#   -f, --force    Skip confirmation prompts
#   --dry-run      Show what would happen without making changes
#   -h, --help     Show help message

require 'optparse'
require 'json'

trap('INT') do
  puts "\nCancelled."
  exit 0
end

module SimpleClaude
  STATUS_LINE_INFO = <<~INFO

    SimpleClaude includes a status line script showing model, branch,
    tokens, and cost. To use it:

    1. Copy the script:
       cp %<root>s/status-lines/simple-status-line.sh ~/.claude/status-lines/

    2. Add to ~/.claude/settings.json:
       "statusLine": {
         "command": "$HOME/.claude/status-lines/simple-status-line.sh"
       }

    See templates/settings.example.json for a complete example with
    recommended permissions and environment variables.

  INFO

  # Registers the SimpleClaude marketplace and installs plugins
  # via Claude Code's native plugin CLI.
  class Installer
    PLUGINS = [
      { name: 'sc-core', desc: 'core framework (5 commands + 7 agents)', required: true },
      { name: 'sc-hooks', desc: 'session management and notifications' },
      { name: 'sc-extras', desc: '7 utility commands' },
      { name: 'sc-output-styles', desc: '8 output style personalities' },
      { name: 'sc-skills', desc: 'frontend design, image gen' }
    ].freeze

    COLORS = { green: "\e[32m", yellow: "\e[33m", red: "\e[31m", blue: "\e[34m", reset: "\e[0m" }.freeze

    def initialize(force: false, dry_run: false)
      @repo_root = File.expand_path('..', __dir__)
      @force = force
      @dry_run = dry_run
    end

    def run
      show_header
      return unless confirm?('Proceed with installation?')

      register_marketplace
      install_plugins
      show_post_install_info
    end

    private

    def color(text, name) = $stdout.tty? ? "#{COLORS[name]}#{text}#{COLORS[:reset]}" : text

    def confirm?(question)
      return true if @force || @dry_run

      print "#{question} (y/n): "
      read_yes_no?
    end

    def read_yes_no?
      answer = $stdin.gets&.strip&.downcase
      answer&.start_with?('y') || false
    end

    def show_header
      mode = @dry_run ? ' [DRY RUN]' : ''
      puts color("\nSimpleClaude Installer#{mode}", :blue)
      puts '=' * 40
      puts "\nThis will:"
      puts '  1. Register SimpleClaude plugin marketplace'
      puts "  2. Install #{PLUGINS.size} plugins"
      puts "\nSource: #{@repo_root}"
      puts '=' * 40
      puts
    end

    def register_marketplace
      if marketplace_registered?
        puts 'Marketplace already registered, updating...'
        run_cmd('claude plugin marketplace update simpleclaude')
      else
        puts 'Registering SimpleClaude marketplace...'
        run_cmd("claude plugin marketplace add #{@repo_root}")
      end
      puts
    end

    def install_plugins
      PLUGINS.each { |plugin| install_or_update_plugin(plugin) }
    end

    def install_or_update_plugin(plugin)
      name, desc = plugin.values_at(:name, :desc)

      if plugin_installed?(name)
        puts "Updating #{name} (#{desc})..."
        run_cmd("claude plugin uninstall #{name}")
      else
        return unless plugin[:required] || @force || confirm?("Install #{name} (#{desc})?")

        puts "Installing #{name} (#{desc})..."
      end
      run_cmd("claude plugin install #{name}")
      puts
    end

    def show_post_install_info
      puts color('Installation complete!', :green)
      puts
      puts '=' * 40
      puts color('Optional: Custom Status Line', :yellow)
      puts '=' * 40
      puts format(SimpleClaude::STATUS_LINE_INFO, root: @repo_root)
    end

    def run_cmd(cmd)
      return system(cmd) unless @dry_run

      puts color("[DRY RUN] #{cmd}", :yellow)
      true
    end

    def marketplace_registered?
      output = `claude plugin marketplace list 2>&1`
      output.include?('simpleclaude')
    end

    def plugin_installed?(name)
      config_path = File.join(Dir.home, '.claude', 'plugins', 'installed_plugins.json')
      return false unless File.exist?(config_path)

      config = JSON.parse(File.read(config_path))
      config['plugins']&.keys&.any? { |key| key.start_with?("#{name}@") }
    rescue StandardError
      false
    end
  end
end

options = {}
OptionParser.new do |opts|
  opts.banner = 'Usage: install.rb [options]'
  opts.on('-f', '--force', 'Skip confirmation prompts') { options[:force] = true }
  opts.on('--dry-run', 'Show what would happen') { options[:dry_run] = true }
  opts.on('-h', '--help', 'Show help') do
    puts opts
    exit
  end
end.parse!

SimpleClaude::Installer.new(**options).run
