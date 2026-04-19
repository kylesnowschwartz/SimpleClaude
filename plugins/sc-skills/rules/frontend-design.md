---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.astro"
  - "**/*.vue"
  - "**/*.svelte"
  - "**/*.html"
  - "**/*.css"
  - "**/*.scss"
  - "**/*.sass"
---

# Frontend Design

Create distinctive, production-grade frontend interfaces with real working code. Avoid generic "AI slop" aesthetics. These rules apply whenever you touch frontend files — dashboards, landing pages, components, or styles.

## Scope

- **Interface work** (dashboards, apps, internal tools): prioritize craft, consistency, restraint. Distinctive comes from precision and hierarchy, not maximalism.
- **Marketing work** (landing pages, artifacts, posters): prioritize distinctive voice, memorability, deliberate risk.

Same rules apply to both — the emphasis shifts.

## Pre-Component Checkpoint (MANDATORY)

Before writing any UI code, state the following briefly in your response (or as a leading comment) — with a reason for each:

- **Intent** — what this interface does and for whom
- **Palette** — the 3-5 colors, named (not hex codes)
- **Depth** — pick ONE: `borders-only` / `subtle shadows` / `layered shadows` / `surface-color shifts`. Don't mix systems.
- **Surfaces** — base / elevated / sunken (or equivalent tiered structure)
- **Typography** — display font + body font + reason for the pairing
- **Spacing** — base unit (typically 4px or 8px) and how the scale will be used

Skipping this checkpoint produces derivative work. Design lives in these decisions, not in code patterns.

## Aesthetic Direction

Commit to ONE bold aesthetic direction and execute it vigorously:

brutally minimal, maximalist chaos, luxury/refined, lo-fi/zine, dark/moody, soft/pastel, editorial/magazine, brutalist/raw, retro-futuristic, handcrafted/artisanal, organic/natural, art deco/geometric, playful/whimsical, industrial/utilitarian, and infinite others.

Use these as starting points, not endpoints. Every detail should serve one cohesive direction.

**Bold maximalism and refined minimalism both work** — the key is intentionality, not intensity.

## Numeric Guardrails

Hard limits. Exceeding them requires a stated reason.

- **Colors**: 3-5 total. 1 primary + 2-3 neutrals + 1-2 accents. More = dilution.
- **Fonts**: max 2 families.
- **Body text**: line-height 1.4-1.6, size ≥ 14px.
- **Gradient stops**: max 2-3 if used at all; analogous temperatures only.
- **Border scale**: 3+ levels (none → subtle → pronounced), not binary.
- **Text hierarchy**: 4 levels (primary / secondary / tertiary / muted). Binary fails.

## Anti-Patterns (Blocklist)

Never ship the following unless the user explicitly asks for it:

- Purple or violet as a prominent color
- Gradients on primary elements (subtle accent gradients OK; hero gradients are AI-slop signal)
- More than 2 font families
- Space Grotesk as the default display font (too recognizable as AI-default)
- Direct color classes: `text-white`, `bg-black`, `text-red-500`. Use semantic tokens instead.
- Arbitrary Tailwind values: `p-[16px]`, `w-[473px]`. Use the scale: `p-4`, `w-[30rem]` only when a scale step doesn't exist.
- `space-*` classes for layout gaps. Use `gap-*` with flex/grid.
- Default fonts: Arial, Inter, Roboto, system stacks. Default fonts signal default thinking.
- Card + shadow-lg + rounded-2xl + purple-gradient — the AI-slop cliche stack.
- "Glassmorphism everywhere" — one deliberate glass surface beats five.

## Token Architecture

Names encode worldview. Read your tokens aloud:

- `--ink` / `--parchment` evoke a world.
- `--gray-700` / `--surface-2` evoke a template.

Structure:

- **Text**: 4 tiers (primary, secondary, tertiary, muted). Not binary.
- **Borders**: scale from subtle → strong. Not binary.
- **Surfaces**: base / elevated / sunken separated from **controls** (button-fill, button-border, input-bg).
- **Semantic over literal**: `--color-danger` not `--red-600`. Allow reassignment without cascade rewrite.

## Typography

Typography carries the design's voice.

- **Display type**: expressive, risky, opinionated. The font someone remembers.
- **Body type**: legible, refined, quietly confident. The font no one notices.
- **Pairing**: treat them like actors in a scene — contrasting, complementary, deliberate.
- **Range**: work the full axis — size, weight, case, letter-spacing, line-height.

## Color

Palettes take a position. Name them.

- Bold and saturated, moody and restrained, high-contrast and minimal — pick one stance.
- Lead with a dominant color; punctuate with sharp accents.
- Avoid timid, non-committal distributions (equal-weight rainbow → no identity).
- Test the palette in grayscale — if hierarchy disappears, color is carrying too much.

## Motion

- CSS-first for HTML. Motion library for React when available.
- One orchestrated moment (staggered page load, revealing hero) beats scattered micro-interactions.
- Hover states and scroll-triggers that surprise, not decorate.
- Easing curves matter: `cubic-bezier(0.2, 0.8, 0.2, 1)` beats `ease-in-out` for nearly every UI transition.

## Spatial Composition & Depth

- Commit to the ONE depth system chosen in the pre-component checkpoint.
- Asymmetry, z-depth, diagonal flow, grid-breaking elements, scale jumps, full-bleed moments.
- Generous negative space OR controlled density — both work; tepid density fails.

## Backgrounds & Details

Atmosphere over solid colors. Match effect to aesthetic:

- Gradient meshes (subtle, not rainbow)
- Noise and grain overlays
- Geometric patterns with intent
- Layered transparencies / glassmorphism (sparingly)
- Dramatic or soft shadows and glows
- Parallax depth
- Decorative borders and clip-path shapes
- Print-inspired textures: halftone, duotone, stipple
- Knockout typography
- Custom cursors for focused interactions

## Four Tests Before Finalizing

Run all four. If any fail, revise.

1. **Swap test** — If you replaced the display typeface with Arial, would anyone notice? Places where swapping wouldn't matter are places you defaulted.
2. **Squint test** — Blur your eyes. Can you still perceive hierarchy? Is anything jumping out harshly? Craft whispers.
3. **Signature test** — Can you name three choices that couldn't be easily swapped without losing the design's identity? If not, it's generic.
4. **Token test** — Read your CSS variable names aloud. Do they evoke a world or a template?

## Implementation Matching

Match complexity to vision:

- Maximalist designs earn elaborate code — extensive animations, layered effects, dense visual detail.
- Minimalist designs earn restraint — subtle motion, careful spacing, single-accent moments.
- Every design earns attention to spacing, typography, and subtle details.

Excellence comes from executing the vision well, not from ambition alone.
