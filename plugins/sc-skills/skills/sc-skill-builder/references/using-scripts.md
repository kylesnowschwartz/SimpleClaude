<purpose>
Scripts are executable code that Claude runs as-is rather than regenerating each time. They ensure reliable, error-free execution of repeated operations.
</purpose>

<when_to_use>
Use scripts when:
- The same code runs across multiple skill invocations
- Operations are error-prone when rewritten from scratch
- Complex shell commands or API interactions are involved
- Consistency matters more than flexibility

Common script types:
- **Deployment** - Deploy to Vercel, publish packages, push releases
- **Setup** - Initialize projects, install dependencies, configure environments
- **API calls** - Authenticated requests, webhook handlers, data fetches
- **Data processing** - Transform files, batch operations, migrations
- **Validation** - Check outputs, verify structure, lint files
</when_to_use>

<advantages>
Even if Claude could write a script, pre-made scripts offer:
- More reliable than generated code
- Save tokens (no need to include code in context)
- Save time (no code generation required)
- Ensure consistency across uses

<how_scripts_work>
When Claude executes a script via bash:
1. Script code never enters context window
2. Only script output consumes tokens
3. Far more efficient than having Claude generate equivalent code
</how_scripts_work>
</advantages>

<execution_vs_reference>
Make clear whether Claude should:
- **Execute the script** (most common): "Run `scripts/analyze.py` to extract fields"
- **Read it as reference** (for complex logic): "See `scripts/analyze.py` for the extraction algorithm"

For most utility scripts, execution is preferred.
</execution_vs_reference>

<script_structure>
Scripts live in `scripts/` within the skill directory:

```
skill-name/
├── SKILL.md
├── workflows/
├── references/
└── scripts/
    ├── deploy.sh
    ├── setup.py
    └── validate.py
```

A well-structured script includes:
1. Clear purpose comment at top
2. Input validation
3. Error handling
4. Idempotent operations where possible
5. Clear output/feedback
</script_structure>

<bash_example>
```bash
#!/bin/bash
# deploy.sh - Deploy project to Vercel
# Usage: ./deploy.sh [environment]
# Environments: preview (default), production

set -euo pipefail

ENVIRONMENT="${1:-preview}"

# Validate environment
if [[ "$ENVIRONMENT" != "preview" && "$ENVIRONMENT" != "production" ]]; then
    echo "Error: Environment must be 'preview' or 'production'"
    exit 1
fi

echo "Deploying to $ENVIRONMENT..."

if [[ "$ENVIRONMENT" == "production" ]]; then
    vercel --prod
else
    vercel
fi

echo "Deployment complete."
```
</bash_example>

<python_example>
```python
#!/usr/bin/env python3
"""Extract form fields from PDF.

Usage: python scripts/analyze_form.py input.pdf > fields.json
"""

import sys
import json

def process_file(path):
    """Process a file, creating it if needed."""
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        print(f"File {path} not found, creating default", file=sys.stderr)
        with open(path, 'w') as f:
            f.write('')
        return ''
    except PermissionError:
        print(f"Cannot access {path}, using default", file=sys.stderr)
        return ''

# Document configuration values
REQUEST_TIMEOUT = 30  # HTTP requests typically complete within 30 seconds
MAX_RETRIES = 3       # Three retries balances reliability vs speed
```
</python_example>

<workflow_integration>
Workflows reference scripts like this:

```xml
<process>
## Step 5: Deploy

1. Ensure all tests pass
2. Run `scripts/deploy.sh production`
3. Verify deployment succeeded
4. Update user with deployment URL
</process>
```

The workflow tells Claude WHEN to run the script. The script handles HOW.
</workflow_integration>

<best_practices>
**Do:**
- Make scripts idempotent (safe to run multiple times)
- Include clear usage comments
- Validate inputs before executing
- Provide meaningful error messages
- Use `set -euo pipefail` in bash scripts
- Handle error conditions rather than punting to Claude

**Don't:**
- Hardcode secrets or credentials (use environment variables)
- Create scripts for one-off operations
- Skip error handling
- Make scripts do too many unrelated things
- Forget to make scripts executable (`chmod +x`)
- Use "voodoo constants" without documentation
</best_practices>

<security_considerations>
- Never embed API keys, tokens, or secrets in scripts
- Use environment variables for sensitive configuration
- Validate and sanitize any user-provided inputs
- Be cautious with scripts that delete or modify data
- Consider adding `--dry-run` options for destructive operations
</security_considerations>

<package_dependencies>
<runtime_constraints>
Skills run in environments with platform-specific limitations:
- **claude.ai**: Can install packages from npm and PyPI
- **Anthropic API**: No network access, no runtime package installation
</runtime_constraints>

<guidance>
List required packages in SKILL.md and verify availability:

```xml
<dependencies>
Install required package: `pip install pypdf`

```python
from pypdf import PdfReader
reader = PdfReader("file.pdf")
```
</dependencies>
```
</guidance>
</package_dependencies>

<mcp_tool_references>
If scripts interact with MCP tools, use fully qualified names:

**Format**: `ServerName:tool_name`

**Examples**:
- Use the `BigQuery:bigquery_schema` tool to retrieve table schemas
- Use the `GitHub:create_issue` tool to create issues

Without the server prefix, Claude may fail to locate the tool.
</mcp_tool_references>

<utility_scripts_pattern>
Document scripts with usage and output format:

**analyze_form.py**: Extract all form fields from PDF
```bash
python scripts/analyze_form.py input.pdf > fields.json
```

Output format:
```json
{
  "field_name": { "type": "text", "x": 100, "y": 200 },
  "signature": { "type": "sig", "x": 150, "y": 500 }
}
```

**validate_boxes.py**: Check for overlapping bounding boxes
```bash
python scripts/validate_boxes.py fields.json
# Returns: "OK" or lists conflicts
```
</utility_scripts_pattern>
