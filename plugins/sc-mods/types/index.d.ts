/** The view's place among the prompts, as the band shows it: `Turn 2/5`, or '' with none known. */
export type PromptPosition = string

/** How large a `show_image` row draws its pictures. */
export type ImageSize = 'small' | 'medium' | 'large'

/** How one picture of a `show_image` row is drawn: hidden, and the size picked with its size button, or '' for the call's size. */
export type PictureView = { isHidden: boolean; size: ImageSize | '' }

/** Each picture's view in one `show_image` row, keyed by its tool_use_id, by the picture's index; a picture not in it is shown at the call's size. */
export type PictureViews = Record<string, PictureView>

/**
 * Where a call the tool drawer holds stands: still running, finished, ended
 * in an error, declined at the permission dialog (or refused by a hook), or
 * interrupted by Esc or an abort.
 */
export type HeldCallStatus = 'running' | 'done' | 'error' | 'declined' | 'interrupted'

/**
 * One shell command the tool drawer holds in place of its transcript rows.
 * `promptId` is the person's prompt the call ran under, or '' when none was
 * known. `output` is the last lines of stdout then stderr (or the error
 * text), each cut to a length; `outputLineCount` counts every line the call
 * printed. `durationMs` is 0 while it runs, and -1 for a call read back from
 * the conversation, whose timing is not stored.
 */
export type HeldCall = {
  id: string
  promptId: string
  command: string
  status: HeldCallStatus
  startedAt: number
  durationMs: number
  output: string[]
  outputLineCount: number
}

/** Which calls the drawer lists: those of the prompt the arrows are on, or every one. */
export type DrawerScope = 'turn' | 'all'

/**
 * How the tool drawer shows. `isOn` false gives every row back to the
 * transcript and hides the drawer; `isSetByHand` is true once the person has
 * opened or closed it, so a new prompt's first call leaves it as it is.
 * `expanded` lists the ids of the calls whose card shows its output;
 * `collapsed` those whose card the person closed, which a failure does not
 * open again.
 */
export type DrawerView = { isOn: boolean; isOpen: boolean; isSetByHand: boolean; scope: DrawerScope; expanded: string[]; collapsed: string[] }

declare module 'claude-code' {
  interface PluginState {
    'sc-mods': {
      promptPosition: PromptPosition
      pictureViews: StateFamily<PictureViews>
      heldCalls: Shaped<HeldCall[]>
      drawerView: Shaped<DrawerView>
      drawerClock: number
      otherBandRows: number
    }
  }
}
