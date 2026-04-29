---
name: hud-first
description: Use when designing AI features and the real opportunity may be perception support, not delegated conversational work.
---

```
● main ↑3 │ build ✓ 2.1s ▁▂▂▃▄▅▆ │ tests 412/413 ✗ │ lint ✓ │ types ⚠2
```

That row is the skill. One line, six fields, no prompt, no dialog. You see system state *through* it, not at it. Lineage: Weiser (calm tech), Engelbart (IA), Tufte (data-ink, sparklines, small multiples).

## Copilot vs. HUD

| Copilot (anti-pattern) | HUD (target)              |
|------------------------|---------------------------|
| You talk to it         | You see through it        |
| Demands attention      | Lives in periphery        |
| Delegates judgment     | Extends perception        |
| Context-switch tax     | Flow-state preserving     |
| "Do this for me"       | "Now I notice more"       |

## Reframing protocol

1. **Name the copilot reflex.** What chat would you open? What prompt would you type?
2. **Extract the information need.** What does the assistant need to *know* to answer? That is what you need to *perceive*.
3. **Compose from the primitive palette:**
   - **sparkline row** — `▁▂▃▄▅▆▇█` in ≤8 cells, encoding a series *(≤4 Hz)*
   - **gutter cell** — column-1 marker per line: `! * ● ◐ ·` *(event:save)*
   - **status-line field** — `key value` pair, separated by `│` on a single row *(≤1 Hz)*
   - **dim/bold/inverse run** — weight = salience; inverse = current/selected *(event:focus)*
   - **badge glyph** — single-cell state: `✓ ✗ · ⚠ ● ○ ◐ ↑ ↓` *(event:state)*
   - **color-band column** — fixed-width column, hue encodes category *(event:classify)*
   - **box-drawing frame** — `─ │ ┌ ┐ └ ┘ ├ ┤`, only when a frame earns its cells *(static)*
   - **prompt-line indicator** — one trailing field appended to the shell prompt *(≤30 Hz)*
   - **small-multiples / row-repeat** — *meta-primitive: layout, not glyph; does not consume the ≤3 budget.* Same instrument repeats across N rows with shared column alignment and shared scales, so cross-row scan is structurally licensed.

   **Budget:** ≤3 primitives per row, ≤8 sparkline cells per primitive, one line per instrument. Beyond 3, the row is a dashboard, not a HUD.

   **When you catch yourself wanting a GUI affordance, reach for the terminal substitute:**
   - **hover** → inverse cursor row (`j`/`k` moves the highlight)
   - **popover / tooltip** → expand-on-key, or one appended status-line field
   - **gradient** → dim/normal/bold triplet, or a 3-step 256-color ramp via **color-band**
   - **modal dialog** → full-line takeover, single-key dismiss
   - **animation** → ≤4 Hz refresh on a single sparkline cell
   - **drag** → `j`/`k` to move, `enter` to commit

4. **Pass both terminal tests:**
   - **Spellcheck test** — the marker appears *in the line of work itself*, not in a popup, dialog, side pane, or separate command. Pass: `!43 │ if user.role == "admin":`. Fail: a `cx-review` subcommand that prints a report.
   - **Sparkline test** (Tufte) — the signal renders with `▁▂▃▄▅▆▇█` (or a similar fixed-glyph row) in ≤8 cells *inside* an existing line; when sparklines stack, they share a labeled baseline. Pass: `tests 412/413 ✗ ▁▂▃▇`. Fail: a separate ASCII bar-chart screen, or four stacked sparklines each rescaling to their own min/max.

## Worked example: test-runner HUD

```
PKG             STRIP                 N/N    LATENCY (▁=0 █=600ms)  TREND
auth/login      ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓·  19/20  ▁▁▁▁▁▂▂▂   142ms
auth/oauth      ✓✓✓✓✓✓✗✓✓✓✓✓✓✓✓✓✓✓✓✓  19/20  ▁▂▂▂▂▃▃▃   211ms
billing/charge  ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓  20/20  ▁▁▁▁▂▂▂▂    88ms
billing/refund  ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓  20/20  ▃▄▅▅▆▆▇▇   503ms   ⚠
```

↑ **small-multiples in action:** each row applies the same gutter-strip + shared-baseline sparkline + badge instrument to one `PKG`, so the eye scans vertically. The strip is strict 3-state (`✓ ✗ ·` = pass / fail / skip); trend warnings ride in their own badge column, so 20/20 still means 20/20. The flaky test (✗ in the strip) and the slow-creep (sparkline standing visibly taller than its neighbors, ⚠ in TREND) are legible without prose annotations — the data already speaks.

Copilot reflex: *"summarize the test run."* HUD instruments: gutter-strip + sparkline + badge, row-repeated across packages.

## Same protocol, four domains

| domain      | copilot reflex            | HUD instrument (terminal-native)                       |
|-------------|---------------------------|--------------------------------------------------------|
| code review | "review this PR for bugs" | `!42 ●  if x == True:                          ▆cx`    |
| inbox       | "summarize my email"      | `▌ ●●● 02:14 CEO    Re: Q3 review            ▇▆▃▁`     |
| debugging   | "find the bug"            | `i=37  arr[0..n)  hits ▁▁▂▃▇▂▁  ✗ at i=23`             |
| writing     | "rewrite this paragraph"  | `~/essay $ █  passive ▃ │ readab ▇▆ │ "just"×4 │ 318w` |

Inbox row leads with a `▌` **color-band column** (hue = folder); the writing row appends indicators to the shell **prompt line**. Each row picks ≤3 primitives and stays inside the existing line — the test-runner block above is the small-multiples form (one instrument, many parameters); this table is the protocol's transfer (one protocol, four instruments).

## When copilot is fine

Routine, one-shot, you genuinely don't want to learn it (autopilot for straight-and-level). For expert work — judgment, debugging, prose — instrument, don't delegate.
