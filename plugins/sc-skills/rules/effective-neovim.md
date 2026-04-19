---
paths:
  - "**/*.lua"
  - "**/lua/**/*"
  - "**/plugin/**/*.lua"
---

# Effective Neovim

Apply Neovim community best practices when writing, reviewing, or refactoring Neovim plugins in Lua.

## Tooling

| Tool | Purpose |
|------|---------|
| [StyLua](https://github.com/JohnnyMorganz/StyLua) | Formatter (opinionated, like prettier) |
| [selene](https://kampfkarren.github.io/selene/) | Linter (30+ checks) |
| lua-language-server | Type checking via LuaCATS annotations |

**Standard `.stylua.toml`:**

```toml
column_width = 100
indent_type = "Spaces"
indent_width = 2
quote_style = "AutoPreferSingle"
```

## Key Principles

From [nvim-best-practices](https://github.com/nvim-neorocks/nvim-best-practices) (parts upstreamed to `:h lua-plugin`):

- **No forced `setup()`** — plugins should work out of the box; separate configuration from initialization
- **`<Plug>` mappings** — let users define their own keymaps instead of hardcoding bindings
- **Subcommands over pollution** — `:Rocks install`, not `:RocksInstall` + `:RocksPrune` + etc.
- **Defer `require()`** — don't load everything at startup; require inside command bodies
- **LuaCATS annotations** — use type hints; catch bugs in CI with lua-language-server
- **Busted over plenary.nvim** — for testing. More powerful, standard in broader Lua community
- **SemVer** — version plugins properly; publish to luarocks.org
- **Health checks** — provide `lua/{plugin}/health.lua` for `:checkhealth`

## Style Conventions

- **Indent**: 2 spaces (not tabs)
- **Quotes**: single quotes preferred
- **Line width**: 100 columns
- **Naming**: `snake_case` for functions and variables, `PascalCase` for classes/modules
- **No semicolons**: unnecessary in Lua
- **Trailing commas**: in multi-line tables for cleaner diffs
- **Comments**: explain *why*, not *what*

## Plugin Structure

```
plugin-name/
├── lua/
│   └── plugin-name/
│       ├── init.lua      # Entry point, setup function
│       ├── health.lua    # :checkhealth integration
│       └── *.lua         # Module files
├── plugin/
│   └── plugin-name.lua   # Auto-loaded, defines commands/autocommands
├── doc/
│   └── plugin-name.txt   # Vimdoc for :h plugin-name
└── tests/
    └── *_spec.lua        # Busted test files
```

## References

- nvim-best-practices: https://github.com/nvim-neorocks/nvim-best-practices
- Neovim Lua Guide: `:h lua-guide`
- Plugin Development: `:h lua-plugin`
- Roblox Style Guide: https://roblox.github.io/lua-style-guide/ (StyLua's basis)
