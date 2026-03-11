# yq: YAML/JSON Query Reference

**Goal: Extract specific fields from YAML without reading entire file.**

## The Essential Pattern

```bash
yq 'expression' file.yaml
yq -o=json 'expression' file.yaml    # Output as JSON
```

---

# Docker Compose Patterns

```bash
# List all services
yq '.services | keys' docker-compose.yml

# Get ports for a service
yq '.services.web.ports' docker-compose.yml

# Get all images
yq '.services.*.image' docker-compose.yml

# Get environment variables
yq '.services.api.environment' docker-compose.yml

# Get volumes
yq '.services.db.volumes' docker-compose.yml

# Get networks
yq '.networks | keys' docker-compose.yml

# Get specific service config
yq '.services.redis' docker-compose.yml

# Check depends_on
yq '.services.api.depends_on' docker-compose.yml
```

---

# GitHub Actions Patterns

```bash
# Get workflow triggers
yq '.on' .github/workflows/ci.yml

# List all jobs
yq '.jobs | keys' .github/workflows/ci.yml

# Get steps for a job
yq '.jobs.build.steps[].name' .github/workflows/ci.yml

# Get runs-on value
yq '.jobs.build.runs-on' .github/workflows/ci.yml

# Get specific step
yq '.jobs.build.steps[0]' .github/workflows/ci.yml

# Get env vars
yq '.env' .github/workflows/ci.yml

# Get matrix strategy
yq '.jobs.test.strategy.matrix' .github/workflows/ci.yml

# Get all uses (actions)
yq '.jobs.*.steps[].uses' .github/workflows/ci.yml
```

---

# Kubernetes Patterns

```bash
# Get container image
yq '.spec.template.spec.containers[0].image' deployment.yaml

# Get replicas
yq '.spec.replicas' deployment.yaml

# Get all labels
yq '.metadata.labels' service.yaml

# Get ports
yq '.spec.ports' service.yaml

# Get resource limits
yq '.spec.template.spec.containers[0].resources' deployment.yaml

# Get environment variables
yq '.spec.template.spec.containers[0].env' deployment.yaml

# Get configmap data
yq '.data' configmap.yaml

# Get secret keys
yq '.data | keys' secret.yaml
```

---

# Helm Chart Patterns

```bash
# Chart.yaml
yq '.version' Chart.yaml
yq '.appVersion' Chart.yaml
yq '.dependencies' Chart.yaml

# values.yaml
yq '.replicaCount' values.yaml
yq '.image.repository' values.yaml
yq '.service.port' values.yaml
yq '.ingress.enabled' values.yaml
```

---

# Filtering and Selection

```bash
# Filter by condition
yq '.services.[] | select(.ports)' docker-compose.yml

# Filter by key name
yq '.services | to_entries | .[] | select(.key == "web")' docker-compose.yml

# Select by value
yq '.[] | select(.kind == "Deployment")' manifests.yaml

# Multi-document YAML (---)
yq 'select(.kind == "Service")' all-manifests.yaml
```

---

# Output Control

```bash
# Output as JSON
yq -o=json '.' config.yaml

# Output as props
yq -o=props '.' config.yaml

# Compact JSON
yq -o=json -I=0 '.' config.yaml

# Just the value (no key)
yq '.version' Chart.yaml
```

---

# Common Flags

| Flag | Purpose |
|------|---------|
| `-o=json` | Output as JSON |
| `-o=props` | Output as properties |
| `-I N` | Indent width (0 for compact) |
| `-e` | Exit with error on null |
| `-i` | Edit file in-place |

---

# Integration

```bash
# YAML to JSON to jq
yq -o=json '.' config.yaml | jq '.services | keys[]'

# From mq frontmatter
mq '.yaml.value' file.md | yq '.description'

# Multiple files
for f in *.yaml; do echo "=== $f ==="; yq '.kind' "$f"; done
```
