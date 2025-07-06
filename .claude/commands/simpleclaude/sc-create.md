# /sc-create

Create anything from code to documentation using natural language. This command
intelligently routes your request to the appropriate SuperClaude creation tools.

## Usage

```
/sc-create [what you want to create]
```

## Examples

### Code Creation

- `/sc-create secure REST API with JWT authentication`
- `/sc-create React component for user profile with TypeScript`
- `/sc-create Python data pipeline with error handling`
- `/sc-create microservice architecture for e-commerce`

### Documentation

- `/sc-create API documentation for user service`
- `/sc-create technical spec for payment system`
- `/sc-create README for this project`

### Development Setup

- `/sc-create development environment for Node.js`
- `/sc-create Docker setup with PostgreSQL`
- `/sc-create CI/CD pipeline with GitHub Actions`

### Design & Architecture

- `/sc-create system architecture for social media app`
- `/sc-create database schema for inventory management`
- `/sc-create API design for mobile app backend`

## How It Works

The command analyzes your request and automatically:

1. Detects what type of creation you need
2. Routes to the appropriate SuperClaude command
3. Delegates to specialized sub-agents for generation
4. Applies best practices and patterns

## Command Routing

Based on your request, `/sc-create` will use:

- **Code/Features**: Routes to `spawn` or `task` commands
- **Documentation**: Routes to `document` command
- **Architecture**: Routes to `design` command
- **Environment**: Routes to `dev-setup` command
- **Full Projects**: Routes to `build` command

## Implementation

```yaml
# Intent Detection and Routing
@include ../../superclaude/patterns/workflows.yml#feature_development

# Creation Patterns
@include ../../superclaude/patterns/creation-patterns.yml#code_generation
@include ../../superclaude/patterns/creation-patterns.yml#documentation_generation

# Mode Selection Based on Intent
@include ../../superclaude/patterns/modes.yml#spawn_selection
@include ../../superclaude/patterns/modes.yml#task_modes
```

### Natural Language Parser

```typescript
interface CreationRequest {
  type: "code" | "doc" | "design" | "setup" | "project";
  subject: string;
  requirements: string[];
  technology?: string[];
  patterns?: string[];
}

function parseCreationRequest(input: string): CreationRequest {
  // Detect creation type from keywords
  const typePatterns = {
    code: /\b(component|api|service|function|class|module)\b/i,
    doc: /\b(documentation|readme|spec|guide|manual)\b/i,
    design: /\b(architecture|design|schema|diagram|system)\b/i,
    setup: /\b(environment|setup|docker|ci\/cd|pipeline)\b/i,
    project: /\b(app|application|project|platform|solution)\b/i,
  };

  // Extract requirements and technology stack
  const techPatterns =
    /\b(react|vue|angular|node|python|java|typescript|docker|kubernetes)\b/gi;
  const requirementPatterns =
    /\b(with|including|using|featuring)\s+(\w+(?:\s+\w+)*)/gi;

  // Route to appropriate command
  return routeToCommand(parsedRequest);
}
```

### Command Router

```typescript
function routeToCommand(request: CreationRequest): string {
  switch (request.type) {
    case "code":
      // Complex features use spawn, simple ones use task
      return request.requirements.length > 3
        ? `spawn ${request.subject}`
        : `task ${request.subject}`;

    case "doc":
      return `document ${request.subject}`;

    case "design":
      return `design ${request.subject}`;

    case "setup":
      return `dev-setup ${request.technology.join(" ")}`;

    case "project":
      return `build ${request.subject}`;
  }
}
```

### Sub-Agent Delegation

The command uses specialized sub-agents for each creation type:

```yaml
# Code Generation Agent
@include ../../superclaude/agents/code-generator.yml

# Documentation Agent
@include ../../superclaude/agents/doc-writer.yml

# Architecture Agent
@include ../../superclaude/agents/architect.yml

# Setup Agent
@include ../../superclaude/agents/environment-builder.yml
```

## Advanced Features

### Pattern Detection

Automatically detects and applies patterns:

- Security patterns (JWT, OAuth, encryption)
- Testing patterns (TDD, integration, e2e)
- Architecture patterns (MVC, microservices, event-driven)

### Technology Stack Recognition

Identifies technologies mentioned and configures accordingly:

- Frontend frameworks (React, Vue, Angular)
- Backend frameworks (Express, Django, Spring)
- Databases (PostgreSQL, MongoDB, Redis)
- Infrastructure (Docker, Kubernetes, AWS)

### Best Practices Application

Automatically includes:

- Error handling and logging
- Input validation and sanitization
- Testing and documentation
- Performance optimization
- Security considerations

## Common Workflows

### Creating a Full-Stack Feature

```bash
/sc-create user authentication with email verification

# This will:
# 1. Design the authentication flow
# 2. Create backend API endpoints
# 3. Build frontend components
# 4. Add database migrations
# 5. Write tests and documentation
```

### Creating a Microservice

```bash
/sc-create payment processing microservice with Stripe

# This will:
# 1. Design service architecture
# 2. Set up project structure
# 3. Implement Stripe integration
# 4. Add error handling and retry logic
# 5. Create Docker configuration
# 6. Write API documentation
```

### Creating Development Environment

```bash
/sc-create development environment for MERN stack

# This will:
# 1. Set up MongoDB with Docker
# 2. Configure Express server
# 3. Initialize React app
# 4. Set up Node.js environment
# 5. Create docker-compose.yml
# 6. Add development scripts
```

## Tips

1. **Be Specific**: The more details you provide, the better the output
2. **Mention Technologies**: Include framework/library names for accurate setup
3. **State Requirements**: Mention security, testing, or performance needs
4. **Use Examples**: Reference existing code for consistent style

## See Also

- `/sc-spawn` - For complex feature development
- `/sc-task` - For focused coding tasks
- `/sc-build` - For complete applications
- `/sc-design` - For architecture and design
- `/sc-document` - For documentation only
