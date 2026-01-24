# frozen_string_literal: true

require 'json'

module ClaudeHooks
  class Configuration
    ENV_PREFIX = 'RUBY_CLAUDE_HOOKS_'

    class << self
      # Load the entire config as a hash (from ENV and optional config file)
      def config
        @config ||= load_config
      end

      # Unmemoize config
      def reload!
        @config = nil
        @base_dir = nil
        @home_claude_dir = nil
        @project_claude_dir = nil
        @config_file_path = nil
        @home_config_file_path = nil
        @project_config_file_path = nil
      end

      # Get the home Claude directory (always ~/.claude)
      def home_claude_dir
        @home_claude_dir ||= File.expand_path('~/.claude')
      end

      # Get the project Claude directory (from CLAUDE_PROJECT_DIR/.claude)
      # Returns nil if CLAUDE_PROJECT_DIR environment variable is not set
      def project_claude_dir
        @project_claude_dir ||= begin
          project_dir = ENV.fetch('CLAUDE_PROJECT_DIR', nil)
          File.expand_path(File.join(project_dir, '.claude')) if project_dir
        end
      end

      # Get the base directory from ENV or default (backward compatibility)
      # This method will determine which base directory to use based on context
      def base_dir
        @base_dir ||= begin
          # Check for legacy environment variable first
          env_base_dir = ENV.fetch("#{ENV_PREFIX}BASE_DIR", nil)
          if env_base_dir
            File.expand_path(env_base_dir)
          else
            # Default to home directory for backward compatibility
            home_claude_dir
          end
        end
      end

      # Get the full path for a file/directory relative to base_dir
      # Can optionally specify which base directory to use
      def path_for(relative_path, base_directory = nil)
        base_directory ||= base_dir
        File.join(base_directory, relative_path)
      end

      # Get the full path for a file/directory relative to home_claude_dir
      def home_path_for(relative_path)
        File.join(home_claude_dir, relative_path)
      end

      # Get the full path for a file/directory relative to project_claude_dir
      # Returns nil if CLAUDE_PROJECT_DIR environment variable is not set
      def project_path_for(relative_path)
        return unless project_claude_dir

        File.join(project_claude_dir, relative_path)
      end

      # Get the log directory path (always relative to home_claude_dir)
      def logs_directory
        log_dir = get_config_value('LOG_DIR', 'logDirectory') || 'logs'
        if log_dir.start_with?('/')
          log_dir # Absolute path
        else
          File.join(home_claude_dir, log_dir) # Always relative to home_claude_dir
        end
      end

      # Get any configuration value by key
      # First checks ENV with prefix, then config file, then returns default
      def get_config_value(env_key, config_key = nil, default = nil)
        # Check environment variable first
        env_value = ENV.fetch("#{ENV_PREFIX}#{env_key}", nil)
        return env_value if env_value

        # Check config file using provided key or converted env_key
        file_key = config_key || env_key_to_config_key(env_key)
        config_value = config[file_key]
        return config_value if config_value

        # Return default
        default
      end

      # Allow access to any config value using method_missing
      def method_missing(method_name, *args, &)
        # Convert method name to ENV key format (e.g., my_custom_setting -> MY_CUSTOM_SETTING)
        env_key = method_name.to_s.upcase
        # Convert snake_case method name to camelCase for config file lookup
        config_key = snake_case_to_camel_case(method_name.to_s)

        value = get_config_value(env_key, config_key)
        return value unless value.nil?

        super
      end

      def respond_to_missing?(method_name, include_private = false)
        # Check if we have a config value for this method
        env_key = method_name.to_s.upcase
        config_key = snake_case_to_camel_case(method_name.to_s)

        !get_config_value(env_key, config_key).nil? || super
      end

      private

      def snake_case_to_camel_case(snake_str)
        # Convert snake_case to camelCase (e.g., user_name -> userName)
        parts = snake_str.split('_')
        parts.first + parts[1..].map(&:capitalize).join
      end

      def config_file_path
        @config_file_path ||= path_for('config/config.json')
      end

      def home_config_file_path
        @home_config_file_path ||= File.join(home_claude_dir, 'config/config.json')
      end

      def project_config_file_path
        @project_config_file_path ||= (File.join(project_claude_dir, 'config/config.json') if project_claude_dir)
      end

      def load_config
        # Load and merge config files from both locations
        merged_file_config = load_and_merge_config_files

        # Merge with ENV variables
        env_config = load_env_config

        # ENV variables take precedence over file configs
        merged_file_config.merge(env_config)
      end

      def load_and_merge_config_files
        home_config = load_config_file_from_path(home_config_file_path)
        project_config = load_config_file_from_path(project_config_file_path) if project_config_file_path

        # Determine merge strategy
        merge_strategy = ENV['RUBY_CLAUDE_HOOKS_CONFIG_MERGE_STRATEGY'] || 'project'

        if project_config && merge_strategy == 'project'
          # Project config takes precedence
          home_config.merge(project_config)
        elsif project_config && merge_strategy == 'home'
          # Home config takes precedence
          project_config.merge(home_config)
        else
          # Only home config exists or no project config
          home_config
        end
      end

      def load_config_file
        config_file = config_file_path
        load_config_file_from_path(config_file)
      end

      def load_config_file_from_path(config_file_path)
        return {} unless config_file_path

        if File.exist?(config_file_path)
          begin
            JSON.parse(File.read(config_file_path))
          rescue JSON::ParserError => e
            warn "Warning: Error parsing config file #{config_file_path}: #{e.message}"
            {}
          end
        else
          # No config file is fine - we'll use ENV vars and defaults
          {}
        end
      end

      def load_env_config
        env_config = {}

        ENV.each do |key, value|
          next unless key.start_with?(ENV_PREFIX)

          # Remove prefix and convert to config key format
          config_key = env_key_to_config_key(key.sub(ENV_PREFIX, ''))
          env_config[config_key] = value
        end

        env_config
      end

      def env_key_to_config_key(env_key)
        # Convert SCREAMING_SNAKE_CASE to camelCase
        # BASE_DIR -> baseDir, LOG_DIR -> logDirectory (with special handling)
        case env_key
        when 'LOG_DIR'
          'logDirectory'
        when 'BASE_DIR'
          'baseDir'
        else
          # Convert SCREAMING_SNAKE_CASE to camelCase
          parts = env_key.downcase.split('_')
          parts.first + parts[1..].map(&:capitalize).join
        end
      end
    end
  end
end
