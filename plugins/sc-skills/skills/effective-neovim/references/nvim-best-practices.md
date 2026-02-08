# nvim-best-practices

Source: https://github.com/nvim-neorocks/nvim-best-practices

## Type Safety

**DON'T:** Create plugins vulnerable to unexpected runtime bugs.

**DO:** Use LuaCATS annotations with lua-language-server to catch issues before users encounter them.

**Tools:** lua-typecheck-action, lux-cli, emmylua-analyzer-rust, lua-language-server, luacheck, lazydev.nvim

---

## User Commands

**DON'T:** Pollute the command namespace with a command for each action.

```lua
-- BAD: :RocksInstall, :RocksPrune, :RocksUpdate, :RocksSync
```

**DO:** Gather subcommands under scoped commands with completions.

```lua
-- GOOD: :Rocks install, :Rocks prune, :Rocks update, :Rocks sync
```

### Implementation Pattern

```lua
---@class MyCmdSubcommand
---@field impl fun(args:string[], opts: table)
---@field complete? fun(subcmd_arg_lead: string): string[]

---@type table<string, MyCmdSubcommand>
local subcommands = {
  install = {
    impl = function(args, opts)
      -- implementation
    end,
    complete = function(subcmd_arg_lead)
      return { 'package1', 'package2' }
    end,
  },
}

vim.api.nvim_create_user_command('Rocks', function(opts)
  local subcmd = subcommands[opts.fargs[1]]
  if subcmd then
    subcmd.impl(vim.list_slice(opts.fargs, 2), opts)
  end
end, {
  nargs = '+',
  complete = function(arg_lead, cmdline, _)
    -- completion logic
  end,
})
```

---

## Keymaps

**DON'T:** Create excessive keymaps automatically - conflicts with user mappings.

**DON'T:** Define custom DSLs for enabling keymaps via setup functions.

**DO:** Provide `<Plug>` mappings allowing users to define their own keymaps.

### Example

**Plugin code:**
```lua
vim.keymap.set('n', '<Plug>(MyPluginAction)', function()
  print('Hello')
end)
```

**User config:**
```lua
vim.keymap.set('n', '<leader>h', '<Plug>(MyPluginAction)')
```

### Benefits

- Enforce options like `expr = true`
- Handle different map-modes differently
- Detect user-defined mappings via `hasmapto()` before creating defaults

---

## Initialization

**DON'T:** Force users to call `setup()` to use your plugin.

**DO:** Strictly separate configuration from initialization.

### Configuration Approaches

1. A Lua function (`setup(opts)` or `configure(opts)`) that only overrides defaults without initialization
2. A `vim.g` or `vim.b` namespace table the plugin reads and validates at initialization

```lua
-- Support both by providing a function that sets vim.g
function M.setup(opts)
  vim.g.my_plugin = opts
end
```

---

## Lazy Loading

**DON'T:** Rely on plugin managers for lazy loading.

**DO:** Think carefully about which plugin parts need loading and when.

### Filetype-specific

Place initialization in `ftplugin/{filetype}.lua`:

```lua
-- ftplugin/rust.lua
if vim.g.loaded_my_rust_plugin then
  return
end
vim.g.loaded_my_rust_plugin = true

local bufnr = vim.api.nvim_get_current_buf()
vim.keymap.set('n', '<Plug>(MyPluginBufferAction)', function()
  print('Hello')
end, { buffer = bufnr })
```

### Non-filetype-specific

Don't eagerly `require`. Move requires into command implementations:

```lua
vim.api.nvim_create_user_command('MyCommand', function()
  local foo = require('foo')  -- Deferred require
  foo.do_something()
end, {})
```

---

## Configuration

**DO:** Use LuaCATS annotations for type safety.

### Merge defaults with user overrides

```lua
---@class myplugin.Config
---@field do_something_cool boolean
---@field strategy "random" | "periodic"

---@type myplugin.Config
local default_config = {
  do_something_cool = true,
  strategy = 'random',
}

local user_config = vim.g.my_plugin or {}
local config = vim.tbl_deep_extend('force', default_config, user_config)
```

### Avoiding LSP Warnings

Split configuration *options* (fields optional with `?`) from internal *values*:

**config/meta.lua:**
```lua
---@class myplugin.Config
---@field do_something_cool? boolean
---@field strategy? "random" | "periodic"

---@type myplugin.Config | fun():myplugin.Config | nil
vim.g.my_plugin = vim.g.my_plugin
```

### Validation

Use `vim.validate` wrapped with `pcall`:

```lua
local function validate(cfg)
  local ok, err = pcall(vim.validate, {
    do_something_cool = { cfg.do_something_cool, 'boolean' },
    strategy = { cfg.strategy, 'string' },
  })
  return ok, err
end
```

---

## Health Checks

**DO:** Provide health checks in `lua/{plugin}/health.lua`.

Validate:
- User configuration
- Proper initialization
- Lua dependency presence
- External dependency presence

```lua
local M = {}

function M.check()
  vim.health.start('my-plugin')

  if vim.g.my_plugin then
    vim.health.ok('Configuration found')
  else
    vim.health.warn('No configuration set')
  end
end

return M
```

---

## Versioning

**DON'T:** Use 0ver or omit versioning.

**DO:** Use Semantic Versioning. Publish to luarocks.org.

Use `vim.deprecate()` or `---@deprecated` annotations for future breaking changes.

**Tools:** luarocks-tag-release, release-please-action, semantic-release

---

## Documentation

**DO:** Provide vimdoc so users can read via `:h {plugin}`.

**DON'T:** Simply dump generated API references.

**Tools:** vimCATS, panvimdoc

---

## Testing

**DON'T:** Use plenary.nvim for testing.

**DO:** Use busted - more powerful, standard in Lua community.

### Why Busted

- **Familiarity:** De facto standard, rspec-like API
- **Consistency:** Same API across all plugins
- **Reproducibility:** Luarocks manages dependencies
- **Ecosystem:** Access entire Lua module ecosystem

**Tools:** nvim-busted-action, nlua, neorocksTest (Nix)

---

## Lua Compatibility

**DON'T:** Use LuaJIT extensions without stating requirements.

**DO:** Use Lua 5.1 API for compatibility with all Neovim builds.

### Configuration

Add to `.luarc.json`:
```json
{
  "runtime.version": "Lua 5.1"
}
```

Gate LuaJIT extensions:
```lua
if jit then
  -- LuaJIT-specific code
end
```

---

## Plugin Integration

**DO:** Consider integrating with telescope.nvim, lualine.nvim, etc.

**TIP:** If unwilling to maintain compatibility long-term, expose your own API for others to hook into.
