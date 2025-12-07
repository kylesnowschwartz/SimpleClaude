# frozen_string_literal: true

require_relative '../lib/sound_player'

# Age of Claude SessionStart Handler
#
# Plays startup sound when Claude Code session begins.

class AgeOfClaudeSessionStartHandler < ClaudeHooks::SessionStart
  STARTUP_SOUND = 'working_sound.wav'

  def call
    source_type = source || 'unknown'
    log "Age of Claude: Session starting (#{source_type})"

    success = SoundPlayer.play(STARTUP_SOUND, self)

    if success
      log 'Age of Claude: Played startup sound'
    else
      log 'Age of Claude: Failed to play startup sound', level: :warn
    end

    allow_continue!
    suppress_output!
    output_data
  end
end
