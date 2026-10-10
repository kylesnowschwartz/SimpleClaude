import type { EngineInterface, On, RenderSurface } from 'claude-code'

async function copyReply($: EngineInterface, markdown: string, surface: RenderSurface) {
  const result = await $.ui.copy({ text: markdown, surface })
  $.ui.toast(result.isCopied ? `Copied ${markdown.length} characters` : `Copy failed: ${result.reason}`)
}

/**
 * A dim `⧉ copy` button under each block of Claude's reply text, which puts
 * that block's markdown on the clipboard.
 *
 * Register it before any hook that rewrites the reply's text: a plugin's
 * hooks nest in the order registered, so this one reads the text as Claude
 * wrote it and wraps what the later hooks drew.
 */
export function registerReplyCopy(on: On) {
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    // A summary stands for text the model wrote; it is not that text.
    if (e.props.isSummary) return next(e)

    const markdown = e.props.text
    const drawn = await next(e)
    const { Box, Button } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {drawn}
        <Button
          key={`reply-copy:${e.requestId}`}
          dimColor
          label="⧉ copy"
          onPress={press => copyReply($, markdown, press.surface)}
        />
      </Box>
    )
  })
}
