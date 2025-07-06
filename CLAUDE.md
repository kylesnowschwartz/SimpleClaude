# SimpleClaude Development Instructions

## For AI Assistants

When developing or maintaining SimpleClaude, follow these critical guidelines:

### ⚠️ CRITICAL: Protected Directory

**The `.claude/` directory is a special template directory that should ONLY be modified when explicitly requested by the user.** This directory contains the actual command implementations and patterns that get installed to users' Claude configurations. Any unauthorized modifications could break SimpleClaude for all users.

**DO NOT**:

- Modify any files in `.claude/` without explicit user permission
- Add new files to `.claude/` without explicit user request
- Reorganize or refactor `.claude/` structure
- Update commands directly unless specifically instructed

**Only modify `.claude/` when the user explicitly says**: "update the command", "modify the template", "change SimpleClaude commands", or similar direct instructions.

### Command Updates Must Follow Template-First Approach

**IMPORTANT**: Any changes to command behavior, structure, or patterns MUST follow this workflow:

1. **Update TEMPLATE.md First**

   - Make all structural or behavioral changes to `.claude/commands/simpleclaude/TEMPLATE.md`
   - Ensure the template represents the ideal command structure
   - Test that the template changes work correctly

2. **Apply Template Changes to All Commands**

   - Update ALL 5 commands to match the new template structure:
     - `sc-create.md`
     - `sc-modify.md`
     - `sc-understand.md`
     - `sc-fix.md`
     - `sc-review.md`
   - Ensure consistency across all commands
   - No command should deviate from the template pattern

3. **Verify Consistency**
   - Check that all commands follow the same structure
   - Ensure pattern includes (`@include` directives) are consistent
   - Verify all commands have the same sections in the same order

### Core Development Principles

1. **Simplicity First**

   - Resist adding complexity
   - Every feature must solve a real user problem
   - If in doubt, wait for user feedback

2. **Token Efficiency**

   - Minimize context usage
   - Use shared patterns via `@include` directives
   - Avoid duplication across commands

3. **User-Driven Development**
   - Only add features users actually request
   - Document user feedback that drives changes
   - Prioritize real-world usage over theoretical improvements

### File Organization

```
.claude/
├── commands/simpleclaude/
│   ├── TEMPLATE.md          # UPDATE THIS FIRST for any command changes
│   ├── sc-create.md         # Must match template
│   ├── sc-modify.md         # Must match template
│   ├── sc-understand.md     # Must match template
│   ├── sc-fix.md           # Must match template
│   └── sc-review.md        # Must match template
├── shared/simpleclaude/
│   ├── core-patterns.yml    # Shared patterns used by all commands
│   ├── modes.yml           # Planner/Implementer/Tester definitions
│   └── workflows.yml       # Common workflows
└── SIMPLE.md               # Main configuration
```

### Testing Changes

After any command updates:

1. Test the updated command with real examples
2. Verify all other commands still work correctly
3. Check that pattern includes load properly
4. Ensure token usage remains efficient

### Documentation Updates

When making significant changes:

1. Update `docs/PHASES.md` to reflect completed work
2. Update `docs/VISION.md` if core philosophy changes
3. Keep the main `README.md` simple and user-focused

### Commit Practices

- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Reference the template-first approach in commit messages when updating commands
- Example: `refactor: update TEMPLATE.md and align all commands with new structure`

## Remember

SimpleClaude achieved MVP with just 5 commands and minimal complexity. Any additions should maintain this simplicity while solving real user problems. When in doubt, wait for user feedback rather than adding speculative features.
