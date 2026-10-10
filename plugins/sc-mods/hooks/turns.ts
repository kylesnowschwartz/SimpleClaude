// Enough for every reply of a long session.
const MAX_REMEMBERED_MESSAGES = 1000

/** The main-loop turn running now, as its turn.start reported it. */
let turnInProgress: string | undefined

/**
 * The turn each message was first drawn in, by its render id; undefined
 * when none was running. A reply drawn again during a later turn, on a resize or
 * a scroll, keeps the turn that wrote it.
 */
const turnOfMessage = new Map<string, string | undefined>()

export function noteTurnStarted(turnId: string) {
  turnInProgress = turnId
}

export function noteTurnEnded(turnId: string) {
  if (turnInProgress === turnId) turnInProgress = undefined
}

/** Remembers the turn a message is first drawn in. */
export function noteMessageDrawn(messageId: string) {
  if (turnOfMessage.has(messageId)) return

  turnOfMessage.set(messageId, turnInProgress)
  if (turnOfMessage.size <= MAX_REMEMBERED_MESSAGES) return

  // A Map iterates in insertion order, so its first key is the oldest.
  const [oldestId] = turnOfMessage.keys()
  if (oldestId !== undefined) turnOfMessage.delete(oldestId)
}

/** The turn that was running when this message was first drawn, if any. */
export function turnThatWrote(messageId: string): string | undefined {
  return turnOfMessage.get(messageId)
}
