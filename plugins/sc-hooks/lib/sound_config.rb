# frozen_string_literal: true

# SoundConfig Module
#
# Configuration for notification sounds in sc-hooks.
#
# Config file: ~/.config/claude/sounds.conf
# Format: SOUND_MODE=off|glass
#
# Valid modes:
#   off   - No sounds (visual notifications only)
#   glass - macOS notification sound (default)
#
# Default: glass (maintains backward compatibility)

module SoundConfig
  CONFIG_PATH = File.expand_path('~/.config/claude/sounds.conf')
  VALID_MODES = %w[off glass].freeze
  DEFAULT_MODE = 'glass'

  class << self
    # Read current sound mode from config file
    # @return [String] one of: off, glass, aoe
    def mode
      return DEFAULT_MODE unless File.exist?(CONFIG_PATH)

      content = File.read(CONFIG_PATH)
      match = content.match(/^SOUND_MODE=(\w+)/i)
      parsed_mode = match ? match[1].downcase : DEFAULT_MODE
      VALID_MODES.include?(parsed_mode) ? parsed_mode : DEFAULT_MODE
    rescue StandardError
      DEFAULT_MODE
    end

    # Check if glass (macOS notification) sounds should play
    def glass?
      mode == 'glass'
    end

    # Check if all sounds are disabled
    def off?
      mode == 'off'
    end
  end
end
