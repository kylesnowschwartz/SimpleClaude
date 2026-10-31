/** The view's place among the prompts, as the band shows it: `2/5`, or '' with none known. */
export type PromptPosition = string

/** How large a `show_image` row draws its pictures. */
export type ImageSize = 'small' | 'medium' | 'large'

/** How one picture of a `show_image` row is drawn: hidden, and the size picked with its size button, or '' for the call's size. */
export type PictureView = { isHidden: boolean; size: ImageSize | '' }

/** Each picture's view in one `show_image` row, keyed by its tool_use_id, by the picture's index; a picture not in it is shown at the call's size. */
export type PictureViews = Record<string, PictureView>

declare module 'claude-code' {
  interface PluginState {
    'sc-mods': { promptPosition: PromptPosition; pictureViews: StateFamily<PictureViews> }
  }
}
