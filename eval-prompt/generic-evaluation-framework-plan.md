# Generic Prompt Evaluation Framework: Implementation Plan

A lightweight, developer-friendly tool for evaluating and refining prompts locally.

## Core Implementation Steps

### Step 1: Extract Core Evaluator (Day 1-2)

#### 1.1 Create Standalone Evaluator

```javascript
// src/evaluator.js
import {
  inferEvaluationType,
  evaluateField,
} from "./existing/AssetMetadataEvaluator.js";

export class Evaluator {
  constructor(schema) {
    this.schema = schema;
  }

  async evaluate(generated, expected) {
    const results = {};
    for (const [field, value] of Object.entries(expected)) {
      results[field] = await evaluateField(
        generated[field],
        value,
        this.schema[field],
      );
    }
    return results;
  }
}
```

#### 1.2 Simplify Evaluation Strategies

```javascript
// src/strategies.js
export const strategies = {
  exact: (a, b) => a === b,
  includes: (a, b) => b.includes(a),
  multiSelect: (a, b) => {
    const intersection = a.filter((x) => b.includes(x));
    return {
      precision: a.length ? intersection.length / a.length : 0,
      recall: b.length ? intersection.length / b.length : 0,
    };
  },
  similarity: async (a, b) => {
    // Keep existing LLM similarity logic
  },
};
```

### Step 2: Simple Data Loading (Day 3)

#### 2.1 Support Multiple Input Formats

```javascript
// src/loaders.js
export function loadTestCases(file) {
  const ext = path.extname(file);
  switch (ext) {
    case ".csv":
      return loadCSV(file);
    case ".json":
      return loadJSON(file);
    case ".yaml":
      return loadYAML(file);
    default:
      throw new Error(`Unsupported format: ${ext}`);
  }
}
```

#### 2.2 Flexible Schema Definition

```javascript
// Allow inline schema in test files
{
  "schema": {
    "title": { "type": "string" },
    "keywords": { "type": "array", "evaluation": "multiSelect" },
    "description": { "type": "string", "evaluation": "similarity" }
  },
  "cases": [
    {
      "input": "video1.mp4",
      "expected": { "title": "Sunset", "keywords": ["nature", "sunset"] }
    }
  ]
}
```

### Step 3: Model Adapters (Day 4-5)

#### 3.1 Simple Adapter Interface

```javascript
// src/models.js
export class ModelAdapter {
  async generate(input, prompt, schema) {
    throw new Error("Implement in subclass");
  }
}

export class OpenAIAdapter extends ModelAdapter {
  async generate(input, prompt, schema) {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: input },
      ],
      response_format: { type: "json_object" },
    });
    return JSON.parse(response.choices[0].message.content);
  }
}
```

#### 3.2 Local Model Support

```javascript
// src/models/local.js
export class LocalAdapter extends ModelAdapter {
  async generate(input, prompt, schema) {
    // Support for llama.cpp, ollama, etc.
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      body: JSON.stringify({
        model: "llama2",
        prompt: `${prompt}\n\n${input}`,
      }),
    });
    return response.json();
  }
}
```

### Step 4: Simple CLI (Day 6)

#### 4.1 Basic Command Structure

```bash
# Run evaluation
eval-prompt run --prompt ./prompt.txt --cases ./test.json --model gpt-4

# Compare two prompts
eval-prompt compare --prompt1 ./v1.txt --prompt2 ./v2.txt --cases ./test.json

# Quick test single case
eval-prompt test --prompt ./prompt.txt --input "test input" --expected '{"title": "Test"}'
```

#### 4.2 Minimal CLI Implementation

```javascript
#!/usr/bin/env node
// bin/eval-prompt
import { Command } from "commander";
import { Evaluator } from "../src/evaluator.js";

const program = new Command();

program
  .command("run")
  .option("-p, --prompt <file>", "prompt file")
  .option("-c, --cases <file>", "test cases file")
  .option("-m, --model <name>", "model to use", "gpt-4")
  .action(async (options) => {
    const prompt = fs.readFileSync(options.prompt, "utf8");
    const cases = loadTestCases(options.cases);
    const model = getModel(options.model);

    for (const testCase of cases) {
      const generated = await model.generate(testCase.input, prompt);
      const results = await evaluator.evaluate(generated, testCase.expected);
      console.log(`Case: ${testCase.name || testCase.input}`);
      console.log(results);
    }
  });
```

### Step 5: Simple Reporting (Day 7)

#### 5.1 Console Reporter

```javascript
// src/reporters/console.js
export function reportToConsole(results) {
  for (const [field, result] of Object.entries(results)) {
    if (result === true) {
      console.log(`✓ ${field}`);
    } else if (result === false) {
      console.log(`✗ ${field}`);
    } else if (result.precision !== undefined) {
      console.log(
        `◐ ${field}: P=${result.precision.toFixed(2)} R=${result.recall.toFixed(2)}`,
      );
    } else if (result.similarity !== undefined) {
      console.log(`~ ${field}: ${result.similarity.toFixed(2)}`);
    }
  }
}
```

#### 5.2 Markdown Reporter

```javascript
// src/reporters/markdown.js
export function reportToMarkdown(allResults, outputFile) {
  let md = "# Evaluation Results\n\n";

  // Summary table
  md += "| Field | Type | Success Rate |\n";
  md += "|-------|------|-------------|\n";

  for (const field of Object.keys(allResults[0])) {
    const successes = allResults.filter((r) => r[field] === true).length;
    const rate = ((successes / allResults.length) * 100).toFixed(1);
    md += `| ${field} | exact | ${rate}% |\n`;
  }

  fs.writeFileSync(outputFile, md);
}
```

### Step 6: Configuration File (Day 8)

#### 6.1 Simple Config Format

```yaml
# .eval-prompt.yaml
model: gpt-4
prompts:
  - ./prompts/v1.txt
  - ./prompts/v2.txt

test_cases: ./test/cases.json

evaluation:
  keywords:
    strategy: multiSelect
    threshold: 0.8
  description:
    strategy: similarity
    model: gpt-3.5-turbo # Use cheaper model for similarity
```

#### 6.2 Auto-load Config

```javascript
// Auto-detect config file
const config = findConfig(".eval-prompt.yaml", ".eval-prompt.json");
```

### Step 7: Watch Mode (Day 9)

#### 7.1 Auto-rerun on Changes

```javascript
// bin/eval-prompt watch
import chokidar from "chokidar";

program.command("watch").action(async (options) => {
  const watcher = chokidar.watch(["./prompts/*.txt", "./test/*.json"]);

  watcher.on("change", async (path) => {
    console.clear();
    console.log(`File changed: ${path}`);
    await runEvaluation(options);
  });
});
```

### Step 8: Quick Utilities (Day 10)

#### 8.1 Prompt Diff

```javascript
// Show what changed between prompt versions
program
  .command("diff")
  .arguments("<prompt1> <prompt2>")
  .action((prompt1, prompt2) => {
    const diff = createDiff(
      fs.readFileSync(prompt1, "utf8"),
      fs.readFileSync(prompt2, "utf8"),
    );
    console.log(diff);
  });
```

#### 8.2 Generate Test Cases

```javascript
// Generate test case template from schema
program
  .command("init-cases")
  .option("-s, --schema <file>", "schema file")
  .option("-n, --number <n>", "number of cases", 5)
  .action((options) => {
    const schema = JSON.parse(fs.readFileSync(options.schema));
    const template = generateTestTemplate(schema, options.number);
    console.log(JSON.stringify(template, null, 2));
  });
```

## Usage Examples

### Basic Evaluation

```bash
# Test a prompt against cases
eval-prompt run -p prompt.txt -c tests.json

# Watch mode for iterative development
eval-prompt watch -p prompt.txt -c tests.json

# Quick test
eval-prompt test -p prompt.txt -i "sunset over mountains" -e '{"theme": "nature"}'
```

### Comparing Prompts

```bash
# Compare two prompt versions
eval-prompt compare -p1 v1.txt -p2 v2.txt -c tests.json

# See what changed
eval-prompt diff v1.txt v2.txt
```

### Different Models

```bash
# Test with local model
eval-prompt run -p prompt.txt -c tests.json -m ollama:llama2

# Test with multiple models
eval-prompt run -p prompt.txt -c tests.json -m gpt-4,claude-2,gemini
```

## Installation

```bash
# From source
git clone <repo>
cd eval-prompt
npm install
npm link

# Or via npm (if published)
npm install -g eval-prompt
```

## File Structure

```
eval-prompt/
├── bin/
│   └── eval-prompt          # CLI entry point
├── src/
│   ├── evaluator.js         # Core evaluation logic
│   ├── strategies.js        # Evaluation strategies
│   ├── models/              # Model adapters
│   ├── loaders/             # Data loaders
│   └── reporters/           # Output formatters
├── examples/
│   ├── simple/              # Basic example
│   ├── multi-model/         # Comparing models
│   └── custom-strategy/     # Custom evaluation
└── README.md
```

## Next Steps

1. **Extract existing evaluation logic** from AssetMetadataEvaluator
2. **Create minimal CLI** with just `run` command
3. **Add model adapters** as needed (start with one)
4. **Implement watch mode** for rapid iteration
5. **Package and share** on GitHub/npm

This lightweight approach focuses on developer experience for personal prompt refinement rather than enterprise scale.
