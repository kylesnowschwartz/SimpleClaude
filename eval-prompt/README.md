# eval-prompt

A lightweight, developer-friendly tool for evaluating and refining prompts locally.

## Installation

```bash
npm install -g eval-prompt
```

Or from source:

```bash
git clone <repo>
cd eval-prompt
npm install
npm link
```

## Quick Start

### Test a single evaluation

```bash
eval-prompt test \
  --predicted '{"title": "Hello World", "tags": ["greeting", "demo"]}' \
  --expected '{"title": "Hello World", "tags": ["greeting", "example"]}'
```

Output:

```
Evaluation Results:
──────────────────────────────────────────────────
✓ title
◐ tags: P=0.50 R=0.50 F1=0.50
```

### With a schema

```bash
eval-prompt test \
  --predicted '{"category": "tech"}' \
  --expected '{"category": "technology"}' \
  --schema schema.json
```

## Evaluation Strategies

The tool automatically selects evaluation strategies based on data types:

- **Exact match** (`boolean`, `number`): Simple equality check
- **Multi-select** (`array`): Precision, Recall, and F1 scores
- **Includes** (`enum`): Check if value is in allowed set
- **Similarity** (`string`): Text similarity (currently basic, LLM-based coming soon)

## Schema Format

Schemas use JSON Schema format with optional `evaluation` hints:

```json
{
  "properties": {
    "title": {
      "type": "string"
    },
    "keywords": {
      "type": "array",
      "evaluation": "multiSelect"
    },
    "description": {
      "type": "string",
      "evaluation": "similarity"
    }
  }
}
```

## Development Status

This is a work in progress. Currently implemented:

- ✅ Core evaluation logic
- ✅ Basic CLI with `test` command
- ✅ Multiple evaluation strategies
- ✅ Schema support

Coming soon:

- 🚧 Full `run` command for batch evaluation
- 🚧 Model adapters (OpenAI, Anthropic, local models)
- 🚧 Watch mode for iterative development
- 🚧 Prompt comparison tools
- 🚧 Configuration files
- 🚧 HTML/Markdown reports

## Contributing

This is an open-source project. Contributions are welcome!

## License

MIT
