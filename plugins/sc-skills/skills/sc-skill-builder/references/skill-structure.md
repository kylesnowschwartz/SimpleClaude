<overview>
Skills have three structural components: YAML frontmatter (metadata), pure XML body structure (content), and progressive disclosure (file organization).
</overview>

<key_insight>
**SKILL.md is always loaded. Use this guarantee.**

Put unavoidable content in SKILL.md:
- Essential principles
- Intake question
- Routing logic

Put workflow-specific content in workflows/:
- Step-by-step procedures
- Required references for that workflow
- Success criteria

Put reusable knowledge in references/:
- Patterns and examples
- Technical details
- Domain expertise
</key_insight>

<yaml_requirements>
<required_fields>
```yaml
---
name: skill-name-here
description: What it does and when to use it (third person, specific triggers)
---
```
</required_fields>

<name_field>
**Validation rules**:
- Maximum 64 characters
- Lowercase letters, numbers, hyphens only
- Must match directory name exactly
- No reserved words: "anthropic", "claude"

**Examples**:
- `process-pdfs`
- `manage-facebook-ads`
- `setup-stripe-payments`
- `pdf-processor` (not `PDF_Processor`)
</name_field>

<description_field>
**Validation rules**:
- Non-empty, maximum 1024 characters
- Third person (never first or second person)
- Include WHAT it does AND WHEN to use it

**Good**:
```yaml
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

**Bad**:
```yaml
description: Helps with documents
```
```yaml
description: I can help you process Excel files
```
</description_field>
</yaml_requirements>

<naming_conventions>
Use **verb-noun convention**:

- `create-*` - Building/authoring (create-landing-pages, create-hooks)
- `manage-*` - External services (manage-stripe, manage-zoom)
- `setup-*` - Configuration (setup-stripe-payments, setup-meta-tracking)
- `generate-*` - Generation tasks (generate-ai-images)
- `build-*` - Construction tasks (build-reports)

**Avoid**:
- Vague: `helper`, `utils`, `tools`
- Generic: `documents`, `data`, `files`
</naming_conventions>

<xml_structure>
<critical_rule>
**Remove ALL markdown headings (#, ##, ###) from skill body.** Replace with semantic XML tags.
</critical_rule>

<required_tags>
Every skill MUST have:
- `<objective>` - What it does (1-3 paragraphs)
- `<quick_start>` - Immediate guidance (minimal working example)
- `<success_criteria>` - How to know it worked
</required_tags>

<conditional_tags>
Add based on complexity:
- `<context>` - Background information
- `<workflow>` - Step-by-step procedures
- `<advanced_features>` - Deep-dive topics
- `<validation>` - How to verify outputs
- `<examples>` - Multi-shot learning
- `<anti_patterns>` - Common mistakes
- `<security_checklist>` - Security requirements

See [use-xml-tags.md](use-xml-tags.md) for detailed guidance.
</conditional_tags>

<tag_selection>
**Simple skills**: Required tags only
**Medium skills**: Required + workflow/examples
**Complex skills**: Required + conditional tags as needed
</tag_selection>
</xml_structure>

<progressive_disclosure>
<principle>
SKILL.md serves as overview pointing to detailed materials. Keeps context efficient.
</principle>

<practical_guidance>
- Keep SKILL.md under 500 lines
- Split content into reference files when approaching limit
- Keep references one level deep from SKILL.md
- Add table of contents to files over 100 lines
</practical_guidance>

<patterns>
**High-level guide**: Quick start in SKILL.md, details in references:
```xml
<advanced_features>
**Form filling**: See [forms.md](forms.md)
**API reference**: See [reference.md](reference.md)
</advanced_features>
```

**Domain organization**: For multi-domain skills:
```
bigquery-skill/
├── SKILL.md
└── references/
    ├── finance.md
    ├── sales.md
    └── product.md
```

When user asks about revenue, Claude reads only finance.md.
</patterns>
</progressive_disclosure>

<router_pattern>
<when_to_use>
Use router + workflows + references when:
- Multiple distinct workflows (build vs debug vs ship)
- Different workflows need different references
- Essential principles must not be skipped
- Skill has grown beyond 200 lines

Use simple single-file skill when:
- One workflow
- Small reference set
- Under 200 lines total
</when_to_use>

<structure>
```
skill-name/
├── SKILL.md              # Router + essential principles
├── workflows/            # Step-by-step procedures
│   ├── workflow-a.md
│   └── workflow-b.md
└── references/           # Domain knowledge
    ├── reference-a.md
    └── reference-b.md
```
</structure>

<skill_md_template>
```markdown
---
name: skill-name
description: What it does and when to use it.
---

<essential_principles>
[Inline principles that apply to ALL workflows. Cannot be skipped.]
</essential_principles>

<intake>
What would you like to do?
1. [Option A]
2. [Option B]
3. [Option C]

**Wait for response before proceeding.**
</intake>

<routing>
| Response | Workflow |
|----------|----------|
| 1, "keyword" | `workflows/option-a.md` |
| 2, "keyword" | `workflows/option-b.md` |

**After reading the workflow, follow it exactly.**
</routing>

<reference_index>
All in `references/`: file-a.md, file-b.md
</reference_index>
```
</skill_md_template>

<workflow_template>
```markdown
# Workflow: [Name]

<required_reading>
**Read these reference files NOW:**
1. references/relevant-file.md
</required_reading>

<process>
## Step 1: [Name]
[What to do]

## Step 2: [Name]
[What to do]
</process>

<success_criteria>
- [ ] Criterion 1
- [ ] Criterion 2
</success_criteria>
```
</workflow_template>
</router_pattern>

<file_organization>
<filesystem_navigation>
- Use forward slashes: `reference/guide.md`
- Name files descriptively: `form_validation_rules.md` (not `doc2.md`)
- Organize by domain: `references/finance.md`, `references/sales.md`
</filesystem_navigation>

<typical_structure>
```
skill-name/
├── SKILL.md
├── references/
│   ├── guide-1.md
│   └── guide-2.md
├── scripts/
│   └── validate.py
└── templates/
    └── output-template.md
```
</typical_structure>
</file_organization>

<anti_patterns>
- **Markdown headings in body**: Use XML tags instead
- **Vague descriptions**: "Helps with documents" → include specific triggers
- **Inconsistent POV**: "I can help you..." → "Processes files and generates..."
- **Name mismatch**: Directory `facebook-ads` but name `facebook-ads-manager`
- **Deeply nested references**: Keep one level deep from SKILL.md
- **Missing required tags**: Always include objective, quick_start, success_criteria
</anti_patterns>

<validation_checklist>
Before finalizing:
- YAML frontmatter valid (name matches directory, third person description)
- No markdown headings in body (pure XML)
- Required tags present: objective, quick_start, success_criteria
- All XML tags properly closed
- Progressive disclosure applied (SKILL.md < 500 lines)
- Reference files use pure XML
- File paths use forward slashes
</validation_checklist>
