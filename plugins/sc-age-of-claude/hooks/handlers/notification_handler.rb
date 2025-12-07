# frozen_string_literal: true

require_relative '../lib/sound_player'

# Age of Claude Notification Handler
#
# Plays notification sounds when Claude needs attention:
# - Permission requests
# - Idle for 60+ seconds
# - MCP tool input required

class AgeOfClaudeNotificationHandler < ClaudeHooks::Notification
  POSSIBLE_SOUNDS = [
    'dialogue_hey_im_in_your_town.wav',
    'dialogue_i_need_food.wav',
    'villager_select4.WAV',
    'priest_convert_wololo5.WAV'
  ].freeze

  def call
    log "Age of Claude: Notification - #{message}"

    success = SoundPlayer.play_random(POSSIBLE_SOUNDS, self)

    if success
      log 'Age of Claude: Played notification sound'
    else
      log 'Age of Claude: Failed to play notification sound', level: :warn
    end

    output_data
  end
end
