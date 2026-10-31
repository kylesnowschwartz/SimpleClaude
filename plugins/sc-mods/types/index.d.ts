/** The view's place among the prompts, as the band shows it: `2/5`, or '' with none known. */
export type PromptPosition = string

/** How large a `show_image` row draws its pictures. */
export type ImageSize = 'small' | 'medium' | 'large'

/**
 * How one `show_image` row is drawn, keyed by its tool_use_id: whether its
 * pictures are hidden, and the size picked with its size button, or '' for
 * the size Claude asked for.
 */
export type ImageView = { isHidden: boolean; size: ImageSize | '' }

declare module 'claude-code' {
  interface PluginState {
    'sc-mods': { promptPosition: PromptPosition; imageView: StateFamily<ImageView> }
  }
}
