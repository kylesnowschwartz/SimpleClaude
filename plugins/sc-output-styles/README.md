# SimpleClaude Output Styles

Curated output styles for Claude Code that modify how Claude communicates and formats responses.

## Available Styles

### Personality-Driven Styles

- **linus-torvalds** - Direct, technically rigorous responses with no fluff. Strong opinions backed by technical reasoning. Focus on correctness, performance, and maintainability.

- **jane-austen** - Elegant, witty prose in 19th-century style. Technical precision wrapped in literary sophistication with subtle irony and social observation.

- **starfleet-officer** - Professional Starfleet protocols with structured reports (SITREP format). Clear command language with tactical awareness and crew safety focus.

- **ada-lovelace** - Precise, visionary responses from the first programmer. Mathematical rigor paired with poetic imagination, annotated layered thinking, and the rare gift of seeing what a machine could become beyond its immediate purpose.

- **john-ousterhout** - Measured, pedagogical responses from the author of *A Philosophy of Software Design*. Complexity as the central lens: deep modules, strategic thinking, information hiding, and the patient rigor of a Stanford CS professor.

- **mayo-clinic** - Authoritative health-guide style adapted for technical topics. Clear explanations, practical self-care steps, and explicit escalation triggers. Calm, confident tone that builds competence.

### Structured Output Styles

- **structured-html** - Responses formatted as semantic HTML with proper tags, indentation, and structure.

- **structured-json** - Responses formatted as valid JSON with hierarchical key-value pairs and RFC 7159 compliance.

- **structured-yaml** - Responses formatted as valid YAML for easy parsing and integration with automation tools.

- **markdown-style** - Rich markdown formatting with headers, lists, code blocks, and emphasis for maximum readability.

- **semantic-markdown** - Enhanced markdown with semantic structure, clear hierarchies, and logical organization.

## Usage

1. Install this plugin via Claude Code's plugin system
2. Use `/output-style` to see available styles
3. Switch styles with `/output-style [name]` (e.g., `/output-style linus-torvalds`)
4. Or set in `.claude/settings.local.json`: `"outputStyle": "linus-torvalds"`

## Important Notes

- All SimpleClaude output styles have `keep-coding-instructions: true`, preserving Claude Code's full software engineering capabilities
- Output styles modify communication style while maintaining coding, testing, and development features
- Unlike CLAUDE.md (which supplements), output styles redefine how Claude communicates but keep technical capabilities intact
- Use personality styles for different work contexts (direct debugging, learning, formal documentation)
- Use structured styles when integrating Claude's output with other tools

## Creating Your Own

All styles are standard markdown files with frontmatter. Check the `output-styles/` directory for examples.

Frontmatter fields:
- `description`: Brief explanation of the style's purpose
- `keep-coding-instructions`: Set to `true` to retain coding capabilities (recommended for all SimpleClaude styles)

## License

MIT - See repository LICENSE file
