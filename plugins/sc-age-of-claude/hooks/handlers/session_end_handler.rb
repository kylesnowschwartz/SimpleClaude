# frozen_string_literal: true

require_relative '../lib/sound_player'

# Age of Claude SessionEnd Handler
#
# Plays farewell sounds based on how the session ends:
# - "exit": Random farewell (pleading/dismissive)
# - "clear": Soldier selection sound

class AgeOfClaudeSessionEndHandler < ClaudeHooks::SessionEnd
  END_REASON_SOUNDS = {
    'exit' => [
      'dialogue_im_weak_please_dont_kill_me.wav',
      'dialogue_get_out.wav'
    ],
    'clear' => ['soldier_select_papadakis5.wav']
  }.freeze

  DEFAULT_FAREWELL_SOUND = 'dialogue_get_out.wav'

  def call
    end_reason = reason || 'unknown'
    log "Age of Claude: Session ending (#{end_reason})"

    sounds = find_sounds_for_end_reason(end_reason)

    if sounds&.any?
      success = SoundPlayer.play_random(sounds, self)
      log success ? "Age of Claude: Played farewell for #{end_reason}" : 'Age of Claude: Failed to play farewell',
          level: success ? :info : :warn
    else
      log "Age of Claude: No sound mapping for #{end_reason}, using default"
      SoundPlayer.play(DEFAULT_FAREWELL_SOUND, self)
    end

    allow_continue!
    suppress_output!
    output_data
  end

  private

  def find_sounds_for_end_reason(end_reason)
    return END_REASON_SOUNDS[end_reason] if END_REASON_SOUNDS.key?(end_reason)

    # Case-insensitive match
    END_REASON_SOUNDS.each do |pattern, sounds|
      return sounds if end_reason.to_s.match?(/^#{Regexp.escape(pattern)}$/i)
    end

    nil
  end
end
