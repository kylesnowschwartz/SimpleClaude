You're right - the guide exists only in the task result from the documentation specialist, not as a separate
file. Here's the complete implementation guide:

Structured Output Templates Implementation Guide for SimpleClaude Agents

Executive Summary

This implementation guide provides a complete roadmap for adding structured output templates to SimpleClaude's 7
specialized agents. The analysis reveals that only the research-analyst currently has a structured output
template, while the other 6 agents lack consistent output formatting. This upgrade will standardize agent
outputs, improve user experience, and enhance the reliability of the agent orchestration system.

Key Findings

Current State Analysis

- 7 specialized agents in .claude/agents/: context-analyzer, debugging-specialist, documentation-specialist,
  implementation-specialist, research-analyst, system-architect, validation-review-specialist
- Only 1 agent (research-analyst) has a structured output template
- 5 core commands use Task() calls to spawn agents in orchestrated workflows
- Agent-based architecture with token-efficient isolated contexts
- Research-analyst template demonstrates effective structured output format

Template Requirements Analysis

Based on the research-analyst template and agent responsibilities:

1. Mandatory completion reporting for task handoffs
2. Structured format for consistent parsing by other agents
3. Evidence-based sections with specific file references
4. Agent handoff instructions for orchestration continuity
5. Actionable recommendations for next steps

Implementation Objectives

Primary Goals

1. Standardize agent outputs across all 7 specialized agents
2. Improve orchestration reliability through consistent structured handoffs
3. Enhance user experience with predictable, scannable results
4. Maintain agent specialization while adding output consistency
5. Enable better Task() coordination between agents

Success Criteria

- All 7 agents have appropriate structured output templates
- Templates match agent roles and responsibilities
- Consistent format structure across all agents
- Clear handoff instructions for orchestration
- Backward compatibility maintained

Step-by-Step Implementation Instructions

Phase 1: Template Design and Standardization

Step 1: Create Base Template Structure

Based on the research-analyst template, create a standardized structure:

**Required [Agent Type] Report Format:**

[Agent Type] Report: [Brief Title]

Executive Summary

[2-3 sentences: What was analyzed/implemented/validated, key findings/results, primary recommendations]

Key [Agent-Specific Section]

[Primary Results]

- [Result 1 with evidence/specifics]
- [Result 2 with evidence/specifics]

[Secondary Results]

- [Finding 1: details, impact, location]
- [Finding 2: details, impact, location]

Implementation Details / Evidence Sources / Analysis Results

[Agent-specific section with concrete details]

Quality Metrics / Limitations / Constraints

[What was verified, what couldn't be completed, constraints encountered]

Recommended Actions

1. Immediate: [High priority action for other agents]
2. Next Steps: [Logical follow-up tasks]
3. Long-term: [Strategic considerations]

Agent Handoff

For [specific agent type]: [Targeted information/context they need]
Ready for: [Next phase/agent type]

Step 2: Agent-Specific Template Customization

Context Analyzer Template:
**Required Context Analysis Report Format:**

Context Analysis Report: [Project/Component Name]

Executive Summary

[2-3 sentences: What was analyzed, key architectural patterns found, integration recommendations]

Project Structure Analysis

Architecture Patterns

- [Pattern 1: description, locations, implications]
- [Pattern 2: description, locations, implications]

Technology Stack

- [Technology 1: version, purpose, integration points]
- [Technology 2: version, purpose, integration points]

File Organization & Conventions

- Directory structure: [key patterns]
- Naming conventions: [established patterns]
- Configuration files: [locations and purposes]

Integration Constraints

[Existing patterns that must be followed, compatibility requirements]

Recommended Actions

1. Immediate: [Context for immediate implementation]
2. Integration: [How new code should integrate]
3. Patterns: [Conventions to follow]

Agent Handoff

For system-architect: [Architectural constraints and opportunities]
For implementation-specialist: [Patterns and conventions to follow]
Ready for: [Design/Implementation phase]

System Architect Template:
**Required Architecture Design Report Format:**

Architecture Design Report: [System/Feature Name]

Executive Summary

[2-3 sentences: What was designed, architectural approach, key design decisions]

System Design

Component Architecture

- [Component 1: responsibility, interfaces, dependencies]
- [Component 2: responsibility, interfaces, dependencies]

Data Flow & Integration

- [Flow 1: source → processing → destination]
- [API interfaces: endpoints, contracts, protocols]

Implementation Roadmap

Phase 1: [Foundation]

- [Task 1: scope, dependencies, deliverables]
- [Task 2: scope, dependencies, deliverables]

Phase 2: [Core Features]

- [Task 3: scope, dependencies, deliverables]

Technical Decisions

[Key architectural choices and rationale]

Risk Assessment

[Potential issues and mitigation strategies]

Recommended Actions

1. Foundation: [Core infrastructure to build first]
2. Implementation: [Development sequence and priorities]
3. Validation: [Testing and quality assurance approach]

Agent Handoff

For implementation-specialist: [Technical specifications and requirements]
For validation-review-specialist: [Quality criteria and success metrics]
Ready for: [Implementation phase]

Implementation Specialist Template:
**Required Implementation Report Format:**

Implementation Report: [Feature/Component Name]

Executive Summary

[2-3 sentences: What was implemented, approach used, integration status]

Implementation Summary

Components Created/Modified

- [File 1: /absolute/path/file.ext - purpose, key functions]
- [File 2: /absolute/path/file.ext - purpose, key functions]

Code Quality Metrics

- [Pattern adherence: how existing patterns were followed]
- [KISS/YAGNI/DRY: specific examples of principle application]
- [Error handling: approach used, edge cases covered]

Integration Results

[How the implementation integrates with existing codebase]

Technical Decisions

[Key implementation choices and rationale]

Limitations & Trade-offs

[What was simplified, future considerations, known limitations]

Recommended Actions

1. Testing: [Specific test scenarios needed]
2. Integration: [Additional integration points to verify]
3. Documentation: [Documentation needs]

Agent Handoff

For validation-review-specialist: [Testing requirements and success criteria]
For documentation-specialist: [Documentation scope and requirements]
Ready for: [Validation/Testing phase]

Validation Review Specialist Template:
**Required Validation Report Format:**

Validation Report: [Feature/Component Name]

Executive Summary

[2-3 sentences: What was validated, quality assessment, deployment readiness]

Requirements Validation

Requirement Compliance

- [Requirement 1: ✅/❌ status, evidence, gaps if any]
- [Requirement 2: ✅/❌ status, evidence, gaps if any]

Test Coverage Analysis

- [Test area 1: coverage %, scenarios tested, gaps]
- [Test area 2: coverage %, scenarios tested, gaps]

Quality Assessment

Code Quality Issues

- [Critical: issue description, location, impact]
- [High: issue description, location, recommended fix]
- [Medium: issue description, location, priority]

Security & Performance

[Security vulnerabilities, performance concerns, mitigation status]

Deployment Readiness

[Ready/Not Ready with specific blockers or approvals]

Recommended Actions

1. Critical: [Must-fix issues before deployment]
2. Quality: [Recommended improvements]
3. Future: [Technical debt or enhancement opportunities]

Agent Handoff

For implementation-specialist: [Issues requiring code changes]
For documentation-specialist: [Documentation updates needed]
Ready for: [Deployment/Documentation phase]

Debugging Specialist Template:
**Required Debugging Report Format:**

Debugging Report: [Issue Description]

Executive Summary

[2-3 sentences: Issue investigated, root cause found, resolution status]

Root Cause Analysis

Primary Issue

- Location: /absolute/path/file.ext:line_number
- Cause: [Specific technical explanation]
- Impact: [Scope and severity of the issue]

Contributing Factors

- [Factor 1: description, how it contributes]
- [Factor 2: description, how it contributes]

Investigation Evidence

Error Analysis

- [Error message/log: source, meaning, context]
- [Stack trace: key points, failure path]

Code Analysis

- [Relevant code: /path/file.ext:lines - what it does, why it fails]

Resolution Strategy

Immediate Fix

[Specific changes needed to resolve the issue]

Prevention Measures

[How to prevent similar issues in the future]

Recommended Actions

1. Fix: [Specific code changes needed]
2. Testing: [Regression tests to add]
3. Prevention: [Long-term improvements]

Agent Handoff

For implementation-specialist: [Specific fix implementation requirements]
For validation-review-specialist: [Testing scenarios to verify fix]
Ready for: [Fix implementation phase]

Documentation Specialist Template:
**Required Documentation Report Format:**

Documentation Report: [Topic/Component Name]

Executive Summary

[2-3 sentences: What was documented, approach used, completeness status]

Documentation Deliverables

Created Documentation

- [Document 1: /absolute/path/doc.md - purpose, audience, scope]
- [Document 2: /absolute/path/doc.md - purpose, audience, scope]

Documentation Quality

- [Accuracy: verification method, sources checked]
- [Completeness: coverage assessment, gaps identified]
- [Usability: audience appropriateness, navigation structure]

Knowledge Synthesis

Key Concepts Documented

- [Concept 1: explanation approach, examples provided]
- [Concept 2: explanation approach, examples provided]

Integration Documentation

[How documented components relate to broader system]

Documentation Gaps

[Areas needing additional documentation, priority levels]

Maintenance Plan

[How to keep documentation current, update responsibilities]

Recommended Actions

1. Review: [Documentation review and approval process]
2. Publication: [Where to publish, distribution method]
3. Maintenance: [Update schedule and responsibilities]

Agent Handoff

For validation-review-specialist: [Documentation quality review requirements]
For implementation-specialist: [Code documentation integration needs]
Ready for: [Review/Publication phase]

Phase 2: File Modifications

Step 3: Update Agent Files

For each agent file in /Users/kyle/Code/SimpleClaude/.claude/agents/:

1. Add template section after the existing content but before the final line
2. Insert the agent-specific template from Step 2
3. Ensure consistent formatting with the research-analyst.md example
4. Test template integration with existing agent responsibilities

File modification pattern:
[Existing agent content...]

Your value lies in [existing closing statement].

**Required [Agent Type] Report Format:**

[Agent-specific template from Step 2]

Phase 3: Validation and Testing

Step 4: Template Validation

Create validation checklist for each template:

- Executive Summary: Clear 2-3 sentence overview
- Agent-specific sections: Match agent responsibilities
- Evidence/Implementation details: Concrete specifics with file paths
- Limitations/Constraints: Clear boundary identification
- Recommended Actions: Prioritized next steps
- Agent Handoff: Specific orchestration instructions
- Format consistency: Matches established pattern
- Actionable content: Clear guidance for next agents

Implementation Priority

1. context-analyzer (foundation for all workflows)
2. system-architect (critical for implementation planning)
3. implementation-specialist (core development coordination)
4. validation-review-specialist (quality assurance)
5. debugging-specialist (systematic troubleshooting)
6. documentation-specialist (knowledge synthesis)
