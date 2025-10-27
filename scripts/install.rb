#!/usr/bin/env ruby
# frozen_string_literal: true

##
# SimpleClaude Installer
#
# Copies SimpleClaude configuration from this repository into ~/.claude
# (or a specified installation directory). Handles commands, agents, and
# output-styles. Creates backups of existing installations and prompts
# for confirmation before each component.
#
# Usage:
#   ./scripts/install.rb [--target DIR] [--force] [--dry-run]
#
# Options:
#   --target DIR         Installation directory (default: ~/.claude)
#   -f, --force          Skip all confirmation prompts
#   --no-backup          Skip backup creation
#   --dry-run            Show what would be changed without making changes
#   -h, --help           Show help message

require 'fileutils'
require 'optparse'
require 'pathname'
require 'digest'

# Handle ctrl+c gracefully
trap('INT') do
  puts "\n\nInstallation cancelled by user."
  exit(0)
end

module SimpleClaude
  class Installer
    # SimpleClaude v2.0.0 Installer
    #
    # This installer handles:
    #   1. Plugin marketplace registration and installation
    #   2. Auxiliary components (output styles, status lines, settings template)
    #
    # BREAKING CHANGE: v2.0.0 restructured from 1 monolithic plugin to 3 isolated plugins:
    #   - simpleclaude: Core framework (5 commands + 6 agents)
    #   - sc-hooks: Session management and tool monitoring
    #   - sc-extras: 7 optional utility commands

    COMPONENTS = [
      { path: 'output-styles', name: 'Output Styles', skip: [] },
      { path: 'status-lines', name: 'Status Lines', skip: [] }
    ].freeze

    # ANSI color codes
    COLORS = {
      green: "\e[32m",
      yellow: "\e[33m",
      red: "\e[31m",
      blue: "\e[34m",
      reset: "\e[0m"
    }.freeze

    def initialize(target_dir: nil, force: false, no_backup: false, dry_run: false)
      @repo_root = File.expand_path('..', __dir__)
      @source_dir = File.join(@repo_root, 'simple-claude')
      @target_dir = File.expand_path(target_dir || File.join(Dir.home, '.claude'))
      @script_dir = File.join(@repo_root, 'scripts')
      @force = force
      @no_backup = no_backup
      @dry_run = dry_run
      @backup_created = false
      @changes = { added: [], updated: [], unchanged: [] }
    end

    def run
      validate_source_dir
      detect_old_installation
      show_installation_info
      confirm_proceed

      # Backup BEFORE making any changes
      backup_existing_installation

      # Install via plugin marketplace
      install_marketplace_plugins

      # Install auxiliary components
      COMPONENTS.each do |component|
        install_component(component[:path], component[:name], component[:skip])
      end

      show_settings_instructions
      show_summary
    end

    private

    def colorize(text, color)
      return text unless $stdout.tty?

      "#{COLORS[color]}#{text}#{COLORS[:reset]}"
    end

    def validate_source_dir
      return if Dir.exist?(@source_dir)

      puts colorize("Warning: Source directory not found: #{@source_dir}", :yellow)
      puts 'This directory will be created, but may be empty.'
      puts ''

      if @force || ask('Create source directory?')
        FileUtils.mkdir_p(@source_dir)
        puts colorize("✓ Created directory: #{@source_dir}", :green)
        puts ''
      else
        puts 'Installation cancelled.'
        exit(0)
      end
    end

    def detect_old_installation
      # SimpleClaude-specific agents to detect (all versions)
      simpleclaude_agents = %w[
        buildkite-build-fetcher.md
        code-architect.md
        code-expert.md
        code-explorer.md
        code-reviewer.md
        context-analyzer.md
        repo-documentation-expert.md
        repo-documentation-finder.md
        test-runner.md
        web-search-researcher.md
      ].map { |f| File.join(@target_dir, 'agents', f) }
                            .select { |path| File.exist?(path) }

      # SimpleClaude-specific hooks to detect (all versions)
      simpleclaude_hooks = %w[
        notification.rb
        post_tool_use.rb
        pre_compact.rb
        pre_tool_use.rb
        session_end.rb
        session_start.rb
        stop.rb
        subagent_stop.rb
        user_prompt_submit.rb
      ].map { |f| File.join(@target_dir, 'hooks', 'entrypoints', f) }
                           .select { |path| File.exist?(path) }

      simpleclaude_hooks += %w[
        auto_format_handler.rb
        copy_message_handler.rb
        notification_handler.rb
        post_tool_use_handler.rb
        pre_compact_handler.rb
        pre_tool_use_handler.rb
        session_end_handler.rb
        session_start_handler.rb
        stop_handler.rb
        subagent_stop_handler.rb
        stop_you_are_not_right.rb
        transcript_parser.rb
        user_prompt_submit_handler.rb
      ].map { |f| File.join(@target_dir, 'hooks', 'handlers', f) }
                            .select { |path| File.exist?(path) }

      # Command directories (safe to remove entirely)
      old_command_dirs = [
        File.join(@target_dir, 'commands', 'simpleclaude'),
        File.join(@target_dir, 'commands', 'extras')
      ].select { |path| Dir.exist?(path) }

      all_old_files = old_command_dirs + simpleclaude_agents + simpleclaude_hooks

      return if all_old_files.empty?

      puts colorize("\n⚠ Old SimpleClaude installation detected!", :red)
      puts "\nRemove these files/directories before proceeding:"
      old_command_dirs.each { |path| puts "  rm -rf #{path}" }
      simpleclaude_agents.each { |path| puts "  rm #{path}" }
      simpleclaude_hooks.each { |path| puts "  rm #{path}" }
      puts "\nThen run this script again.\n"
      exit 1
    end

    def show_installation_info
      mode = @dry_run ? ' [DRY RUN - No changes will be made]' : ''
      puts colorize("\nSimpleClaude Installer v2.0.0#{mode}", :blue)
      puts '=' * 50
      puts "\nThis installer will:"
      puts '  1. Register SimpleClaude plugin marketplace'
      puts '  2. Install plugins (simpleclaude, sc-hooks, sc-extras)'
      puts "  3. Copy auxiliary components (output-styles, status-lines)\n\n"
      puts "Source:      #{@repo_root}"
      puts "Destination: #{@target_dir}"
      puts '=' * 50
      puts ''
    end

    def confirm_proceed
      return if @force

      unless ask('Proceed with installation?')
        puts 'Installation cancelled.'
        exit(0)
      end
      puts ''
    end

    def install_marketplace_plugins
      puts colorize("\nInstalling SimpleClaude via Plugin Marketplace", :blue)
      puts '=' * 50
      puts ''

      if @dry_run
        puts colorize('[DRY RUN] Would check and update/add SimpleClaude marketplace', :yellow)
        puts colorize('[DRY RUN] Would install/update simpleclaude plugin', :yellow)
        puts colorize('[DRY RUN] Would install/update sc-hooks plugin', :yellow)
        puts colorize('[DRY RUN] Would install/update sc-extras plugin', :yellow)
        puts ''
        return
      end

      # Check if marketplace already exists
      marketplace_exists = marketplace_installed?('simpleclaude')

      if marketplace_exists
        puts 'SimpleClaude marketplace already configured, updating...'
        if system('claude plugin marketplace update simpleclaude')
          puts colorize('✓ Marketplace updated successfully', :green)
        else
          puts colorize('✗ Failed to update marketplace', :red)
          exit 1 unless @force
        end
      else
        puts 'Adding SimpleClaude marketplace...'
        if system("claude plugin marketplace add #{@repo_root}")
          puts colorize('✓ Marketplace added successfully', :green)
        else
          puts colorize('✗ Failed to add marketplace', :red)
          exit 1 unless @force
        end
      end
      puts ''

      # Install core (required)
      install_or_update_plugin('simpleclaude', 'core framework', required: true)

      # Install hooks (optional)
      if @force || plugin_installed?('sc-hooks') || ask('Install sc-hooks (session management, tool monitoring)?')
        install_or_update_plugin('sc-hooks', 'session management')
      end

      # Install extras (optional)
      if @force || plugin_installed?('sc-extras') || ask('Install sc-extras (7 utility commands)?')
        install_or_update_plugin('sc-extras', '7 utility commands')
      end

      puts colorize('✓ Plugin marketplace installation complete', :green)
      puts ''
    end

    def marketplace_installed?(name)
      output = `claude plugin marketplace list 2>&1`
      output.include?("❯ #{name}")
    end

    def plugin_installed?(name)
      config_path = File.join(Dir.home, '.claude', 'plugins', 'installed_plugins.json')
      return false unless File.exist?(config_path)

      require 'json'
      config = JSON.parse(File.read(config_path))
      config['plugins']&.keys&.any? { |key| key.start_with?("#{name}@") }
    rescue StandardError
      false
    end

    def install_or_update_plugin(name, description, required: false)
      if plugin_installed?(name)
        puts "Updating #{name} (#{description})..."
        # Uninstall then reinstall to update
        system("claude plugin uninstall #{name}")
      else
        puts "Installing #{name} (#{description})..."
      end
      success = system("claude plugin install #{name}")

      if success
        puts colorize("✓ #{name} #{plugin_installed?(name) ? 'updated' : 'installed'}", :green)
      else
        puts colorize("✗ Failed to install #{name}", :red)
        exit 1 if required && !@force
      end
      puts ''
    end

    def backup_existing_installation
      return unless Dir.exist?(@target_dir)
      return if @no_backup || @dry_run

      timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
      @backup_dir = "#{@target_dir}.backup_#{timestamp}"

      puts "Existing installation found at #{@target_dir}"
      puts "Creating backup at #{@backup_dir}"

      begin
        FileUtils.cp_r(@target_dir, @backup_dir)
        @backup_created = true
        puts colorize('✓ Backup created successfully', :green)
        puts ''
      rescue StandardError => e
        puts colorize("✗ Failed to create backup: #{e.message}", :red)
        return if @force

        unless ask('Continue anyway?')
          puts 'Installation cancelled.'
          exit(1)
        end
        puts ''
      end
    end

    def install_component(component_path, component_name, skip_files)
      source_path = File.join(@source_dir, component_path)
      target_path = File.join(@target_dir, component_path)

      unless Dir.exist?(source_path)
        puts colorize("[#{component_name}] Source directory not found, skipping", :yellow)
        puts ''
        return
      end

      changes = detect_changes(source_path, target_path, skip_files)

      total_changes = changes[:added].size + changes[:updated].size
      if total_changes.zero?
        puts "[#{component_name}] No changes needed (#{changes[:unchanged].size} file(s) already correct)"
        puts ''
        return
      end

      # Show changes
      puts colorize("[#{component_name}] Changes to apply:", :yellow)
      changes[:added].each { |info| puts "  #{colorize('+', :green)} Add:    #{info[:relative]}" }
      changes[:updated].each { |info| puts "  #{colorize('~', :yellow)} Update: #{info[:relative]}" }
      puts "  #{colorize('=', :blue)} Unchanged: #{changes[:unchanged].size} file(s)" if changes[:unchanged].any?
      puts ''

      # Prompt for confirmation unless --force
      if !@force && !ask('Apply these changes?')
        puts "Skipping #{component_name}...\n\n"
        return
      end

      # Apply changes (or simulate in dry-run mode)
      if @dry_run
        puts colorize("[DRY RUN] Would apply #{total_changes} change(s) to #{component_name}", :yellow)
        puts ''
      else
        install_files(changes[:added] + changes[:updated], component_name)
      end

      # Track changes for final summary
      @changes[:added].concat(changes[:added].map { |f| "#{component_path}/#{f[:relative]}" })
      @changes[:updated].concat(changes[:updated].map { |f| "#{component_path}/#{f[:relative]}" })
      @changes[:unchanged].concat(changes[:unchanged].map { |f| "#{component_path}/#{f[:relative]}" })
    end

    def detect_changes(source_path, target_path, skip_files)
      to_add = []
      to_update = []
      unchanged = []

      # Find all files in source
      Dir.glob(File.join(source_path, '**', '*')).each do |file|
        next unless File.file?(file)
        next if skip_files.include?(File.basename(file))

        relative_path = Pathname.new(file).relative_path_from(Pathname.new(source_path))
        target_file = File.join(target_path, relative_path)

        if !File.exist?(target_file)
          to_add << { source: file, target: target_file, relative: relative_path }
        elsif file_hash(file) != file_hash(target_file)
          to_update << { source: file, target: target_file, relative: relative_path }
        else
          unchanged << { source: file, target: target_file, relative: relative_path }
        end
      end

      { added: to_add, updated: to_update, unchanged: unchanged }
    end

    def file_hash(path)
      return nil unless File.exist?(path)

      Digest::SHA256.file(path).hexdigest
    rescue StandardError
      # Fallback if SHA256 fails
      File.read(path).hash.to_s
    end

    def install_files(files, component_name)
      success_count = 0
      files.each do |info|
        # Create parent directory if needed
        FileUtils.mkdir_p(File.dirname(info[:target]))

        # Copy file
        FileUtils.cp(info[:source], info[:target])
        success_count += 1
      rescue StandardError => e
        puts colorize("✗ Failed to install #{info[:relative]}: #{e.message}", :red)
      end

      puts colorize("✓ Applied #{success_count}/#{files.size} change(s) to #{component_name}", :green)
      puts ''
    end

    def show_summary
      puts "\n#{'=' * 50}"
      if @dry_run
        puts colorize('DRY RUN SUMMARY - No changes were made', :yellow)
      else
        puts colorize('INSTALLATION SUMMARY', :green)
      end
      puts '=' * 50

      total_changes = @changes[:added].size + @changes[:updated].size

      if total_changes.zero?
        puts colorize('✓ No changes needed - all files already up to date', :green)
      else
        puts colorize("✓ #{total_changes} change(s) #{@dry_run ? 'would be' : 'were'} applied:", :green)
        puts "  #{colorize('+', :green)} #{@changes[:added].size} file(s) added" if @changes[:added].any?
        puts "  #{colorize('~', :yellow)} #{@changes[:updated].size} file(s) updated" if @changes[:updated].any?
      end

      puts "  #{colorize('=', :blue)} #{@changes[:unchanged].size} file(s) unchanged" if @changes[:unchanged].any?
      puts "\nBackup location: #{@backup_dir}" if @backup_created
      puts ''
    end

    def show_settings_instructions
      settings_file = File.join(@target_dir, 'settings.json')

      example_file = File.join(@repo_root, 'templates/settings.example.json')

      puts "\n#{'=' * 50}"
      puts colorize('NEXT STEP: Configure hooks', :yellow)
      puts '=' * 50
      puts <<~INSTRUCTIONS

        To enable auto-formatting and other hooks, merge the hook
        configuration from:

          #{example_file}

        into:

          #{settings_file}

        Copy the "hooks" and "statusLine" sections from the example
        into your settings.json. The example also includes useful
        permissions and environment variables you may want to adopt.

      INSTRUCTIONS
    end

    def ask(question)
      return true if @force || @dry_run

      print "#{question} (yes/no): "
      answer = $stdin.gets&.chomp&.downcase
      answer == 'yes'
    end
  end
end

# Parse command-line options
options = {}
OptionParser.new do |opts|
  opts.banner = 'Usage: install.rb [options]'

  opts.on('--target DIR', 'Installation directory (default: ~/.claude)') do |dir|
    options[:target_dir] = dir
  end

  opts.on('-f', '--force', 'Skip all confirmation prompts') do
    options[:force] = true
  end

  opts.on('--no-backup', 'Skip creating backup of existing installation') do
    options[:no_backup] = true
  end

  opts.on('--dry-run', 'Show what would be changed without making changes') do
    options[:dry_run] = true
  end

  opts.on('-h', '--help', 'Show this help message') do
    puts opts
    exit
  end
end.parse!

installer = SimpleClaude::Installer.new(**options)
installer.run
