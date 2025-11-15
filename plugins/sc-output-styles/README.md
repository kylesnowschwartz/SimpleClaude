# SimpleClaude Output Styles

Curated output styles for Claude Code that modify how Claude communicates and formats responses.

## Available Styles

### Personality-Driven Styles

- **linus-torvalds** - Direct, technically rigorous responses with no fluff. Strong opinions backed by technical reasoning. Focus on correctness, performance, and maintainability.

- **jane-austen** - Elegant, witty prose in 19th-century style. Technical precision wrapped in literary sophistication with subtle irony and social observation.

- **starfleet-officer** - Professional Starfleet protocols with structured reports (SITREP format). Clear command language with tactical awareness and crew safety focus.

### Structured Output Styles

- **html-structured** - Responses formatted as semantic HTML with proper tags, indentation, and structure.

- **json-structured** - Responses formatted as valid JSON with hierarchical key-value pairs and RFC 7159 compliance.

- **markdown-style** - Rich markdown formatting with headers, lists, code blocks, and emphasis for maximum readability.

- **semantic-markdown** - Enhanced markdown with semantic structure, clear hierarchies, and logical organization.

- **yaml-structured** - Responses formatted as valid YAML for easy parsing and integration with automation tools.

## Usage

1. Install this plugin via Claude Code's plugin system
2. Use `/output-style` to see available styles
3. Switch styles with `/output-style [name]` (e.g., `/output-style linus-torvalds`)
4. Or set in `.claude/settings.local.json`: `"outputStyle": "linus-torvalds"`

## Important Notes

- Output styles replace Claude's default software engineering instructions
- Unlike CLAUDE.md (which supplements), these completely redefine the communication style
- Use personality styles for different work contexts (direct debugging, learning, formal documentation)
- Use structured styles when integrating Claude's output with other tools

## Creating Your Own

All styles are standard markdown files with frontmatter. Check the `output-styles/` directory for examples.

Frontmatter fields:
- `description`: Brief explanation of the style's purpose

## License

MIT - See repository LICENSE file
