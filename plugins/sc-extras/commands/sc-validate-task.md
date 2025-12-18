---
description: Validate a completed task against its original requirements
argument-hint: "[task-description] - Description of the task to validate"
---

# sc-validate-task: Single Task Validation Protocol

_Focused validation of specific completed tasks or todo items._

## Usage:

`/sc-validate-task [task-description]`

## Process:

### 1. Task Definition Capture

**Identify exactly what was supposed to be accomplished:**

- Task description from ${ARGUMENTS} or conversation context
- Original requirement or todo item
- Expected deliverable or outcome
- Success criteria (implicit or explicit)

**Gather implementation evidence:**

- Code changes made for this specific task
- Files modified or created
- Tests added or updated
- Documentation changes

### 2. Implementation Verification

**Confirm code changes address the specific task:**

```
Task: [Original requirement]
├── Changes Made → [List actual modifications]
│   ├── Files: [Which files were touched]
│   ├── Logic: [What core functionality was added/changed]
│   └── Tests: [What validation was added]
└── Matches Requirement? → [Yes/No with evidence]
```

**Focus validation based on task type:**

- **Bug fixes**: Does it resolve the reported issue without side effects?
- **Features**: Does it implement the requested functionality completely?
- **Refactoring**: Does it improve code without changing behavior?
- **Tests**: Do they cover the intended scenarios adequately?

### 3. Functional Validation

**Verify the implementation works as intended:**

- Can you demonstrate the functionality works?
- Does it handle expected inputs correctly?
- Are edge cases covered appropriately?
- Does it integrate properly with existing code?

### 4. Quality Gate Check

**Ensure basic quality standards:**

- Code follows project conventions
- No obvious security vulnerabilities introduced
- Performance impact is acceptable
- Breaking changes are intentional and documented

## Validation Decision Matrix:

**✅ VALIDATED** - Task is complete and working correctly
**❌ NEEDS FIXES** - Task has issues that must be resolved
**⚠️ PARTIAL** - Task is mostly complete but has minor issues

## Output Template:

```markdown
# Task Validation: [Specific Task Description]

## Task Definition
**Original Request**: [What was asked for]
**Expected Outcome**: [What should have been delivered]
**Success Criteria**: [How we know it's working]

## Implementation Evidence
**Files Changed**: [List of modified files]
**Core Changes**: [Brief summary of what was implemented]
**Tests Added**: [New validation coverage]

## Functional Verification
**Manual Testing**: [Steps taken to verify functionality]
**Results**: [What happened when testing]
**Edge Cases**: [Boundary conditions checked]

## Validation Results
**Status**: ✅ VALIDATED | ❌ NEEDS FIXES | ⚠️ PARTIAL
**Evidence**: [Specific proof the task works/doesn't work]
**Confidence**: [High/Medium/Low based on testing]

## Issues Found (if any)
- **[Priority]**: [Specific problem with location and fix needed]

## Decision
- **If ✅**: Task complete, ready for next todo
- **If ❌**: [Specific fixes needed before marking complete]
- **If ⚠️**: [What works, what needs attention, acceptable to proceed?]
```

## Smart Patterns:

**When to validate quickly (2-3 checks):**
- Simple bug fixes with clear before/after behavior
- Minor UI adjustments with visual confirmation
- Configuration changes with immediate effects

**When to validate thoroughly (full protocol):**
- New features with multiple integration points
- Security-related changes
- Performance optimizations
- API modifications

**Red flags that require deeper investigation:**
- "It works on my machine" without broader testing
- Changes that touch multiple unrelated areas
- Missing or inadequate test coverage
- Functionality that partially works

---

_Remember: This is task-specific validation, not comprehensive code review. Stay focused on whether this one thing was completed correctly._

${ARGUMENTS}
