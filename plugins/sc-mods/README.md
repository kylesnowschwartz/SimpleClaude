# sc-mods

Claude Code mods from SimpleClaude. A mod is a plugin that changes Claude Code's own interface; see the [mods documentation](https://code.claude.com/docs/en/plugins/mods/overview).

sc-mods does three things:

- It draws the mermaid diagrams in Claude's replies as Unicode text, so you can read a diagram in the terminal without copying it into a renderer.
- It puts `◀` and `▶` buttons in the band above the prompt, which scroll the conversation to your previous or next prompt.
- It puts a `⧉ copy` button under Claude's replies, which copies the reply's markdown.

## Mermaid diagrams

When a reply contains a closed mermaid code block, the mod runs [merman](https://github.com/Latias94/merman) on the diagram and shows the drawing in place of the source. Nothing else in the reply changes, and the conversation the model sees still holds the mermaid source.

Before:

````markdown
```mermaid
flowchart LR
  Plan --> Build --> Review --> Ship
```
````

After:

```text
┌──────┐   ┌───────┐   ┌────────┐   ┌──────┐
│      │   │       │   │        │   │      │
│ Plan ├──►│ Build ├──►│ Review ├──►│ Ship │
│      │   │       │   │        │   │      │
└──────┘   └───────┘   └────────┘   └──────┘
```

A mermaid code block is one whose fence is three or more backticks or tildes and whose language, the first word after the fence, is `mermaid` in any case. It closes on the same fence character repeated at least as many times. A block indented inside a list item or a `>` blockquote is drawn there, with the drawing kept inside the item or quote. A mermaid block inside another code block, such as a ` ````markdown ` example, or inside an HTML comment, is left as it is.

The drawing has to fit the terminal's width. For a flowchart that is too wide, the mod tries a compact layout, then wraps long node labels, then turns a left-to-right chart top-to-bottom. A sequence diagram gets a second, automatic layout. If no layout fits, or merman cannot read the diagram, the source stays as it was.

## Jump between prompts

The band above the prompt shows two buttons, `◀` and `▶`, with a dim count between them: `[ ◀ ] 2/5 [ ▶ ]` while the view is on the second of five prompts. The count follows the view as you scroll or jump. Click a button, or type `1` or `2` into an empty prompt box, to scroll the conversation so your previous or next prompt sits at the top of the view. A digit typed into a prompt box that already holds text is typed as usual.

The view is on the prompt that owns the topmost row on screen: the prompt itself, or a row of Claude's reply to it (its text or its tool calls). When the screen shows none of those rows, it is on the prompt last jumped to, else the newest. The count and the step both start from that prompt. If that prompt's first line is scrolled out of view, as when you are partway through its reply, `◀` first goes back to its top. A toast says so when there is no earlier or later prompt, and gives Claude Code's reason when it does not scroll.

Jumping needs fullscreen mode, where Claude Code draws the conversation itself. The classic layout leaves the conversation to the terminal's scrollback and refuses the scroll.

## Copy a reply

A dim `⧉ copy` button sits under each block of Claude's reply text. Click it to put that block's markdown on the clipboard, as Claude wrote it: a mermaid diagram is copied as its source, not as the drawing. A toast says how many characters were copied, or why nothing was. A reply split by tool calls has a button under each block of text.

The button takes a mouse click only. The conversation's rows can't take keyboard focus, so no key presses it.

## Install

```bash
claude plugin install sc-mods --marketplace kylesnowschwartz/SimpleClaude
```

This installs from the `sc-mods-dist` branch, which carries merman-cli for macOS and Linux on arm64 and x86_64. Nothing is downloaded when the mod runs.

**A mod runs with your permissions.** It runs inside Claude Code and can start programs as you. This one starts only merman-cli, it makes no network calls, and it writes no files. The copy button writes to the clipboard through Claude Code, the way `/copy` does. Read [`hooks/register.ts`](hooks/register.ts) before you install it.

## Settings

| Setting | What it does |
|---|---|
| `MERMAN_PATH` | Absolute path to a merman-cli to run instead of the bundled one. Leave it unset to use the bundled one. Set it at install with `--config MERMAN_PATH=/path/to/merman-cli`, or later with `/plugin configure`. |

If merman-cli cannot run, every diagram stays as source and Claude Code shows one notice saying how to fix it.

## Development

The binaries are not in the main branch. Fetch them into `bin/` first:

```bash
just fetch-merman
```

This runs `scripts/fetch-merman.sh`, which downloads the pinned merman release, checks each archive against its published checksum, and puts one binary per platform beside the `bin/merman-cli` launcher, with merman's licenses in `bin/merman-licenses/`. Running it again does nothing. `just check-merman` reports whether a newer merman release is out.

Then load the plugin from the checkout, either for one session:

```bash
claude --plugin-dir plugins/sc-mods
```

or as an installed plugin that reads straight from your checkout:

```bash
claude plugin marketplace add /path/to/SimpleClaude
claude plugin install sc-mods-dev@simpleclaude
```

With `sc-mods-dev`, edit the files and run `/reload-plugins`. Don't install `sc-mods` and `sc-mods-dev` together, or every diagram is handled twice.

Check and test the mod:

```bash
just test-mods
```

These tests stand in for merman-cli, so they run without the binaries. To draw a flowchart, a sequence diagram and an invalid diagram with the real merman-cli, fetch the binaries and install [bun](https://bun.sh), then run:

```bash
just test-mods-real
```

It stops with an error if merman-cli cannot run on your machine.

Every `just release` republishes the `sc-mods-dist` branch. To publish it on its own, run `just publish-mods`, which stops unless all four binaries are present.

## Limitations

- A mermaid block without a closing fence shows its source.
- Some merman drawings have layout quirks: a flowchart edge that loops back runs against the boxes ([#183](https://github.com/Latias94/merman/issues/183)), a state diagram can print two transition labels run together ([#184](https://github.com/Latias94/merman/issues/184)), a long sequence message label can run past the next lifeline ([#185](https://github.com/Latias94/merman/issues/185)), and in a narrow terminal two side-by-side subgraphs can share a border ([#186](https://github.com/Latias94/merman/issues/186)).
- The jump buttons know a prompt once its row has been drawn in this session. After a restart or `/resume`, prompts further back than the screen has shown are left out of the count, and reaching them takes one extra press: the first press scrolls the oldest drawn row into view so Claude Code draws the rows above it.
- When the mod loads into a session that already has prompts (a restart, `/resume`, a plugin reload), it runs `find` and `grep` once over the session's transcript file to learn the order of those prompts. Without those commands on the `PATH`, the older prompts are not counted.
- A prompt waiting in the queue while Claude works is counted once it is sent.
- The jump buttons step through the main conversation, and are hidden while an agent's transcript is on screen.
- The mod is built for the terminal. The desktop app and the VS Code extension are untested.
- merman-cli ships for macOS and Linux. On other systems the diagrams stay as source unless `MERMAN_PATH` points at a merman-cli.
