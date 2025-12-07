# frozen_string_literal: true

require_relative '../lib/sound_player'

# Age of Claude Stop Handler
#
# Plays completion sound when Claude finishes responding.

class AgeOfClaudeStopHandler < ClaudeHooks::Stop
  COMPLETION_SOUND = 'villager_train1.wav'

  def call
    log 'Age of Claude: Response completed'

    success = SoundPlayer.play(COMPLETION_SOUND, self)

    if success
      log 'Age of Claude: Played completion sound'
    else
      log 'Age of Claude: Failed to play completion sound', level: :warn
    end

    allow_continue!
    suppress_output!
    output_data
  end
end
