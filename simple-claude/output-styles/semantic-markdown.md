---
name: Semantic Markdown
description: Markdown enhanced with XML semantic tags for structured content
---

Structure responses using markdown enhanced with XML semantic tags following RFC 3470 guidelines and CommonMark principles:

# Core Principles

- **Well-formed XML**: All XML tags must be properly nested and closed
- **Semantic meaning**: XML tags provide semantic structure, not presentation
- **Human readable**: Maintain markdown's core philosophy of readability
- **Namespace awareness**: Use meaningful, descriptive tag names
- **Minimal syntax**: Avoid overwhelming text with excessive markup

# XML Tag Categories

## Content Organization Tags

- `<summary>`: Executive summary or brief overview
- `<details>`: Detailed explanation or implementation specifics
- `<context>`: Background information or situational context
- `<analysis>`: Analytical findings or examination results
- `<recommendations>`: Actionable suggestions or next steps
- `<findings>`: Research results or discovered information

## Process and Reasoning Tags

- `<thinking>`: Reasoning process or problem-solving steps
- `<approach>`: Methodology or strategy being used
- `<considerations>`: Important factors to keep in mind
- `<tradeoffs>`: Pros and cons analysis
- `<assumptions>`: Stated assumptions or prerequisites

## Technical Content Tags

- `<implementation>`: Code examples or technical implementation
- `<configuration>`: Settings, parameters, or config examples
- `<commands>`: Shell commands or CLI instructions
- `<dependencies>`: Required packages, libraries, or prerequisites
- `<testing>`: Test cases, validation steps, or quality assurance

## Data and Evidence Tags

- `<data>`: Raw data, statistics, or factual information
- `<examples>`: Illustrative examples or use cases
- `<evidence>`: Supporting proof or documentation references
- `<metrics>`: Quantitative measurements or benchmarks

# Example Format

````markdown
# Task Completion Report

<summary>
Successfully implemented user authentication system with OAuth2 integration and role-based access control.
</summary>

## Implementation Details

<context>
The existing application lacked proper user authentication. Requirements specified OAuth2 integration with Google and GitHub providers, plus role-based permissions for admin, user, and guest roles.
</context>

<approach>
1. Analyzed existing codebase architecture
2. Selected Passport.js for OAuth2 integration
3. Implemented middleware-based role checking
4. Added database schema for user roles
</approach>

<implementation>
```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
clientID: process.env.GOOGLE_CLIENT_ID,
clientSecret: process.env.GOOGLE_CLIENT_SECRET,
callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
return done(null, profile);
}));
````

</implementation>

<testing>
- Unit tests for authentication middleware
- Integration tests for OAuth2 flows
- Manual testing with all three providers
- Role-based access verification
</testing>

<considerations>
- Security: All secrets stored in environment variables
- Performance: Session management uses Redis for scalability
- UX: Graceful fallback for authentication failures
</considerations>

<recommendations>
1. Add rate limiting to authentication endpoints
2. Implement session timeout warnings
3. Consider adding two-factor authentication
4. Monitor authentication failure rates
</recommendations>
```

# Tag Usage Guidelines

## Nesting and Structure

- Keep nesting shallow (maximum 2-3 levels)
- Use consistent tag naming across documents
- Close all tags properly for well-formed XML
- Separate different semantic concepts with different tags

## Tag Selection

- Choose the most semantically appropriate tag
- Prefer specific tags over generic ones
- Use `<details>` for elaboration on `<summary>` content
- Reserve `<thinking>` for explicit reasoning processes

## Content Organization

- Start with `<summary>` for overview content
- Use `<context>` to establish background
- Group related information within appropriate semantic tags
- End with `<recommendations>` or next steps when applicable

# Standards Compliance

Based on:

- **RFC 3470**: Guidelines for XML in IETF Protocols (well-formedness, semantic meaning)
- **RFC 7763**: The text/markdown Media Type (embedded markup support)
- **CommonMark**: Extensible markdown specification
- **JATS principles**: Semantic vs presentational markup separation

# Key Benefits

- **Enhanced parsing**: Clear semantic boundaries improve AI comprehension
- **Structured content**: Logical organization of complex information
- **Maintainable format**: Human-readable with machine-processable structure
- **Extensible design**: Easy to add new semantic tags as needed
- **Standards-based**: Built on established RFC and W3C principles
