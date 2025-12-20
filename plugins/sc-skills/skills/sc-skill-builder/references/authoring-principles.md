<overview>
Core principles for effective skill authoring. These principles ensure skills are efficient, clear, and work well across different Claude models.
</overview>

<golden_rule>
Show your skill to someone with minimal context. If they're confused, Claude will likely be too.
</golden_rule>

<xml_structure_principle>
<description>
Skills use pure XML structure for consistent parsing and improved Claude performance.
</description>

<why_xml>
- **Consistency**: All skills use the same tags for the same purposes (`<objective>`, `<quick_start>`, `<success_criteria>`)
- **Parseability**: XML provides unambiguous boundaries. Claude reliably identifies sections and their purposes.
- **Token efficiency**: XML tags are ~25% more efficient than markdown headings
- **Performance**: Semantic tags convey intent directly without inference
</why_xml>

<critical_rule>
**Remove ALL markdown headings (#, ##, ###) from skill body content.** Replace with semantic XML tags. Keep markdown formatting WITHIN content (bold, lists, code blocks).
</critical_rule>

<required_tags>
Every skill MUST have:
- `<objective>` - What the skill does and why it matters
- `<quick_start>` - Immediate, actionable guidance
- `<success_criteria>` - How to know it worked

See [use-xml-tags.md](use-xml-tags.md) for conditional tags and detailed guidance.
</required_tags>
</xml_structure_principle>

<conciseness_principle>
<description>
The context window is shared. Your skill shares it with system prompts, conversation history, and the actual request.
</description>

<guidance>
Only add context Claude doesn't already have. Challenge each piece of information:
- "Does Claude really need this explanation?"
- "Can I assume Claude knows this?"
- "Does this paragraph justify its token cost?"

Assume Claude is smart. Don't explain obvious concepts.
</guidance>

<concise_example>
**Concise** (~50 tokens):
```xml
<quick_start>
Extract PDF text with pdfplumber:

```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
</quick_start>
```

**Verbose** (~150 tokens):
```xml
<quick_start>
PDF files are a common file format used for documents. To extract text from them, we'll use a Python library called pdfplumber. First, you'll need to import the library...
</quick_start>
```

The concise version assumes Claude knows what PDFs are and can read code. Correct assumptions.
</concise_example>

<when_to_elaborate>
Add explanation when:
- Concept is domain-specific (not general programming knowledge)
- Pattern is non-obvious or counterintuitive
- Context affects behavior in subtle ways

Don't add explanation for:
- Common programming concepts
- Standard library usage
- Well-known tools (git, npm, pip)
</when_to_elaborate>
</conciseness_principle>

<clarity_principle>
<description>
Clear instructions reduce errors and minimize iteration cycles. Be specific about what you want.
</description>

<specificity>
**Vague**: "Help with the report"
**Specific**: "Generate a markdown report with: Executive Summary, Key Findings, Recommendations"

**Vague**: "Process the data"
**Specific**: "Extract customer names and emails from CSV, remove duplicates, save to JSON"
</specificity>

<sequential_steps>
Provide instructions as numbered steps:

```xml
<workflow>
1. Extract data from source file
2. Transform to target format
3. Validate transformation
4. Save to output file
</workflow>
```
</sequential_steps>

<avoid_ambiguity>
Eliminate ambiguous phrases:

- "Try to..." → "Always..." or "Never..."
- "Should probably..." → "Must..." or "May optionally..."
- "Generally..." → "Always... except when..."
- "Consider..." → "If X, then Y"
</avoid_ambiguity>

<define_edge_cases>
Don't leave Claude guessing:

```xml
<edge_cases>
- **No emails found**: Save empty array `[]`
- **Duplicate emails**: Keep only unique
- **Malformed emails**: Skip, log to stderr
</edge_cases>
```
</define_edge_cases>

<show_dont_tell>
When format matters, show an example rather than describing it:

```xml
<commit_message_format>
<example>
<input>Added user authentication with JWT tokens</input>
<output>feat(auth): implement JWT-based authentication</output>
</example>
</commit_message_format>
```

Claude learns patterns from examples more reliably than from descriptions.
</show_dont_tell>
</clarity_principle>

<degrees_of_freedom_principle>
<description>
Match the level of specificity to the task's fragility. Give Claude more freedom for creative tasks, less for fragile operations.
</description>

<high_freedom>
Creative tasks (code review, analysis): Principles and heuristics, multiple approaches valid.
</high_freedom>

<medium_freedom>
Standard operations (API calls, data transforms): Preferred pattern with flexibility.
</medium_freedom>

<low_freedom>
Fragile operations (database migrations, payments, security): Exact instructions, no deviation.

```xml
<workflow>
Run exactly this script:
```bash
python scripts/migrate.py --verify --backup
```
**Do not modify the command.**
</workflow>
```
</low_freedom>

<matching_specificity>
- **Fragile** → Low freedom, exact instructions
- **Standard** → Medium freedom, preferred pattern
- **Creative** → High freedom, principles over procedures
</matching_specificity>
</degrees_of_freedom_principle>

<model_testing_principle>
<description>
What works for Opus might need more detail for Haiku. Test with all target models.
</description>

<haiku>
Needs: More explicit instructions, complete examples, clear success criteria
</haiku>

<sonnet>
Needs: Balanced detail, XML structure for clarity, progressive disclosure
</sonnet>

<opus>
Needs: Concise instructions, principles over procedures, high degrees of freedom
</opus>

<good_balance>
```xml
<quick_start>
Use pdfplumber for text extraction:

```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

For scanned PDFs requiring OCR, use pdf2image with pytesseract instead.
</quick_start>
```

Works for all models: Haiku gets complete example, Sonnet gets clear default with escape hatch, Opus gets enough context without over-explanation.
</good_balance>
</model_testing_principle>

<progressive_disclosure_principle>
<description>
SKILL.md serves as overview. Reference files contain details. Claude loads references only when needed.
</description>

<token_efficiency>
- Simple task: Load SKILL.md only (~500 tokens)
- Medium task: Load SKILL.md + one reference (~1000 tokens)
- Complex task: Load SKILL.md + multiple references (~2000 tokens)
</token_efficiency>

<implementation>
- Keep SKILL.md under 500 lines
- Split detailed content into reference files
- Keep references one level deep from SKILL.md
- Use descriptive reference file names

See [skill-structure.md](skill-structure.md) for progressive disclosure patterns.
</implementation>
</progressive_disclosure_principle>

<validation_principle>
<description>
Validation scripts catch errors that Claude might miss.
</description>

<characteristics>
Good validation scripts:
- Provide verbose, specific error messages
- Show available valid options when something is invalid
- Pinpoint exact location of problems
- Suggest actionable fixes
- Are deterministic and reliable

See [workflows-and-validation.md](workflows-and-validation.md) for patterns.
</characteristics>
</validation_principle>

<summary>
<xml_structure>Use pure XML. Required: objective, quick_start, success_criteria.</xml_structure>
<conciseness>Only add context Claude doesn't have. Assume Claude is smart.</conciseness>
<clarity>Be specific. Define edge cases. Show examples.</clarity>
<degrees_of_freedom>Match specificity to fragility.</degrees_of_freedom>
<model_testing>Test across Haiku, Sonnet, and Opus.</model_testing>
<progressive_disclosure>Keep SKILL.md concise. Split details into references.</progressive_disclosure>
<validation>Make validation scripts verbose and specific.</validation>
</summary>
