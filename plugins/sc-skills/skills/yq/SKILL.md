---
name: yq
description: This skill should be used when the user asks to "get a field from docker-compose", "extract value from yaml", "what services are in this compose file", "get the image from kubernetes manifest", "pull workflow triggers from github actions", "check the version in pubspec.yaml", or when needing specific fields from YAML/JSON config files without loading the entire file.
---

# yq: YAML/JSON Query Tool

Extract specific fields from YAML and JSON files without reading entire contents into context.

## When to Use

**Use yq when:**
- Need specific field(s) from YAML/JSON config
- File is large (>50 lines) and only need subset
- Querying nested structures
- Working with docker-compose, GitHub Actions, K8s, Helm charts

**Just use Read when:**
- File is small (<50 lines)
- Need to understand overall structure
- Making edits (need full context anyway)

## Common Files

- `docker-compose.yml` - services, ports, volumes, networks
- `.github/workflows/*.yml` - triggers, jobs, steps
- `kubernetes/*.yaml` - deployments, services, configmaps
- `pubspec.yaml` - Flutter/Dart dependencies
- `package.json` - npm dependencies (use jq)
- `tsconfig.json` - TypeScript config (use jq)

## Quick Reference

```bash
# Get specific field
yq '.version' pubspec.yaml
yq '.services.web.image' docker-compose.yml

# Get all keys at level
yq '.services | keys' docker-compose.yml

# Get nested array element
yq '.jobs.build.steps[0].name' .github/workflows/ci.yml

# Filter by condition
yq '.services.[] | select(.ports)' docker-compose.yml

# Multiple fields
yq '.name, .version' pubspec.yaml

# Output as JSON
yq -o=json '.' config.yaml
```

## jq for JSON

Same patterns, different tool:

```bash
# Get dependency version
jq '.dependencies["react"]' package.json

# Get all script names
jq '.scripts | keys' package.json

# Get compiler options
jq '.compilerOptions.target' tsconfig.json
```

## Docker Compose Patterns

```bash
# List all services
yq '.services | keys' docker-compose.yml

# Get ports for a service
yq '.services.web.ports' docker-compose.yml

# Get all images
yq '.services.*.image' docker-compose.yml

# Get environment variables
yq '.services.api.environment' docker-compose.yml
```

## GitHub Actions Patterns

```bash
# Get workflow triggers
yq '.on' .github/workflows/ci.yml

# List all jobs
yq '.jobs | keys' .github/workflows/ci.yml

# Get steps for a job
yq '.jobs.build.steps[].name' .github/workflows/ci.yml

# Get runs-on value
yq '.jobs.build.runs-on' .github/workflows/ci.yml
```

## Kubernetes Patterns

```bash
# Get container image
yq '.spec.template.spec.containers[0].image' deployment.yaml

# Get replicas
yq '.spec.replicas' deployment.yaml

# Get all labels
yq '.metadata.labels' service.yaml

# Get ports
yq '.spec.ports' service.yaml
```

## Core Principle

Extract exactly what's needed in one command. Saves 80-95% context vs reading entire config files.
