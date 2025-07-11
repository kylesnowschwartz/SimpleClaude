# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

eval-prompt is a lightweight Node.js tool for evaluating and refining AI prompts. It's written in ES modules and provides strategies for evaluating different data types against expected outputs.

## Development Commands

- Install dependencies: `npm install`
- Link for local testing: `npm link`
- Run CLI: `eval-prompt test --predicted '<json>' --expected '<json>'`
- Test command: `npm test` (not yet implemented)

## Architecture

The project follows a modular architecture:

- `src/strategies/` - Evaluation strategies (exact, multiSelect, includes, similarity)
- `src/loaders/` - Data loaders for different formats
- `src/models/` - Model adapters (planned)
- `src/reporters/` - Output formatters
- `src/cli/` - Command-line interface

Key patterns:

- Strategy pattern for different evaluation types
- Schema-driven evaluation using JSON Schema
- Automatic strategy selection based on data types

## Code Style

- ES modules (import/export syntax)
- Node.js >=18.0.0 required
- No build step - pure JavaScript
- Use async/await for asynchronous operations
- Follow existing file naming conventions (kebab-case)

## Current Implementation Status

Implemented:

- Basic CLI with `test` command
- Evaluation strategies (exact, multiSelect, includes, similarity)
- JSON data loading
- Console reporter

Not yet implemented:

- Full `run` command for batch evaluation
- Model adapters (OpenAI, Anthropic)
- Watch mode
- Configuration files
- HTML/Markdown reports
- Unit tests

## Development Workflow

1. Test CLI changes locally with `npm link`
2. Use real examples when testing evaluation strategies
3. Follow the existing modular structure when adding features
4. Keep strategies focused and testable
