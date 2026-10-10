/** The ids of the main-loop turns that have started and not yet completed. */
export type RunningTurns = string[]

declare module 'claude-code' {
  interface PluginState {
    'sc-mods': { runningTurns: RunningTurns }
  }
}
