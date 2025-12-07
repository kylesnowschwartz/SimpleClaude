# frozen_string_literal: true

require_relative '../lib/sound_player'

# Age of Claude Notification Handler
#
# Plays deterministic notification sounds based on notification type:
# - permission_prompt: wololo (priest converting you to approve)
# - idle_prompt: "I need food" (Claude is starving for input)
# - elicitation_dialog: villager select (awaiting your command)

class AgeOfClaudeNotificationHandler < ClaudeHooks::Notification
  # Deterministic mapping: each notification type gets one consistent sound
  NOTIFICATION_SOUNDS = {
    'permission_prompt' => 'priest_convert_wololo5.WAV',
    'idle_prompt' => 'dialogue_i_need_food.wav',
    'elicitation_dialog' => 'villager_select4.WAV'
  }.freeze

  DEFAULT_SOUND = 'dialogue_hey_im_in_your_town.wav'

  def call
    type = notification_type || 'unknown'
    log "Age of Claude: Notification (#{type}) - #{message}"

    sound = NOTIFICATION_SOUNDS[type] || DEFAULT_SOUND
    success = SoundPlayer.play(sound, self)

    if success
      log "Age of Claude: Played #{sound} for #{type}"
    else
      log "Age of Claude: Failed to play #{sound}", level: :warn
    end

    output_data
  end
end
