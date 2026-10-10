/** The view's place among the prompts, as the band shows it: `2/5`, or '' with none known. */
export type PromptPosition = string

declare module 'claude-code' {
  interface PluginState {
    'sc-mods': { promptPosition: PromptPosition }
  }
}
