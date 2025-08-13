# sc-five-whys: Autonomous Root Cause Analysis Protocol

```xml
<protocol name="sc-five-whys">
<title>Autonomous Root Cause Analysis Protocol</title>
<description>A systematic approach to finding root causes in software problems.</description>

<process>
  <step number="1">
    <name>Capture the Problem</name>

    <section name="define-specifically">
      <title>Define specifically what's broken:</title>
      <requirements>
        <requirement>Problem statement exists in ${ARGUMENTS} or conversation context</requirement>
        <requirement>You have access to relevant data/logs/documentation</requirement>
      </requirements>
      <questions>
        <question>What's the observed issue? (error, wrong behavior, visual bug)</question>
        <question>When does it occur? (specific triggers, conditions, frequency)</question>
        <question>Where does it manifest? (backend/frontend/specific component)</question>
        <question>Who/what is affected? (users, systems, features)</question>
      </questions>
    </section>

    <section name="gather-evidence">
      <title>Gather evidence:</title>
      <evidence_types>
        <type>Error messages, stack traces, console logs</type>
        <type>Screenshots for visual issues</type>
        <type>Steps to reproduce</type>
        <type>Recent changes that might relate</type>
      </evidence_types>
    </section>
  </step>

  <step number="2">
    <name>Ask "Why?" (Usually 5 Times, Sometimes Less)</name>

    <causal_chain_template>
      Problem: [Specific issue]
      ├── Why? → [Technical cause A]
      │   └── Why? → [Deeper cause A2]
      │       └── Why? → [Continue until root]
      └── Why? → [Technical cause B] (if multiple factors)
          └── Why? → [Continue separately]
    </causal_chain_template>

    <problem_type_guidance>
      <type name="backend">
        <focus>logic errors, data state, resources, timing</focus>
      </type>
      <type name="frontend">
        <focus>events, state management, CSS, browser differences</focus>
      </type>
      <type name="visual_bugs">
        <focus>often only need 2-3 whys (styling → specificity → root)</focus>
      </type>
      <type name="performance">
        <focus>may need 6-7 whys to reach architectural roots</focus>
      </type>
    </problem_type_guidance>

    <false_roots>
      <warning>Keep digging if you hit these:</warning>
      <false_root>Human error / Someone made a mistake</false_root>
      <false_root>Lack of time/resources</false_root>
      <false_root>That's how it's always been</false_root>
      <false_root>Random occurrence</false_root>
      <false_root>Just make the test pass</false_root>
      <false_root>I'll commit this with --no-verify</false_root>
    </false_roots>
  </step>

  <step number="3">
    <name>Validate Your Root Cause</name>

    <validation_questions>
      <question>Can I point to specific code/config that embodies this cause?</question>
      <question>If I fix this exact thing, will the problem definitely stop?</question>
      <question>Does this cause explain all observed symptoms?</question>
    </validation_questions>

    <ui_ux_additional_checks>
      <check>Can I demonstrate the fix in DevTools?</check>
      <check>Does this explain why it works in some contexts but not others?</check>
    </ui_ux_additional_checks>
  </step>

  <step number="4">
    <name>Develop the Fix</name>

    <fix_levels>
      <level name="immediate">
        <description>Stop the bleeding (workaround, feature flag, revert)</description>
      </level>
      <level name="root_fix">
        <description>Address the actual cause you found</description>
      </level>
      <level name="prevention">
        <description>Ensure this class of issue can't recur (tests, types, linting)</description>
      </level>
    </fix_levels>
  </step>
</process>

<examples>
  <example type="backend">
    <problem>API returns 500 error for specific users</problem>
    <analysis>
      <why number="1">
        <cause>Database query times out</cause>
      </why>
      <why number="2">
        <cause>Query joins 5 tables for these users</cause>
      </why>
      <why number="3">
        <cause>These users have 1000x normal data volume</cause>
      </why>
      <why number="4">
        <cause>No pagination on user data retrieval</cause>
      </why>
      <why number="5">
        <cause>Original design assumed &lt;100 items per user</cause>
      </why>
    </analysis>
    <root_cause>Missing pagination in data access layer</root_cause>
    <fix>Add pagination, set query limits, add volume tests</fix>
  </example>

  <example type="frontend">
    <problem>Button doesn't respond on mobile</problem>
    <analysis>
      <why number="1">
        <cause>Click handler not firing</cause>
      </why>
      <why number="2">
        <cause>Parent div has touch handler that prevents bubbling</cause>
      </why>
      <why number="3">
        <cause>Swipe gesture detection consumes all touch events</cause>
      </why>
    </analysis>
    <root_cause>Overly aggressive event.preventDefault() in swipe handler</root_cause>
    <fix>Add conditional logic to allow tap-through on buttons</fix>
  </example>
</examples>

<smart_patterns>
  <pattern name="when_to_stop_early">
    <condition>Found the exact line of broken code</condition>
    <condition>Identified the specific config value</condition>
    <condition>Located the CSS rule causing misalignment</condition>
    <condition>Going deeper would just explain "why coding exists"</condition>
  </pattern>

  <pattern name="when_to_go_beyond_five">
    <condition>Intermittent failures (race conditions need deep tracing)</condition>
    <condition>Performance degradation (often architectural)</condition>
    <condition>Complex state corruption (may have long cause chains)</condition>
  </pattern>

  <pattern name="when_to_branch">
    <branch>
      <trigger>Works on dev but not prod</trigger>
      <action>investigate environment differences</action>
    </branch>
    <branch>
      <trigger>Sometimes fails</trigger>
      <action>investigate timing/concurrency separately</action>
    </branch>
    <branch>
      <trigger>Only certain users</trigger>
      <action>investigate data patterns separately</action>
    </branch>
  </pattern>
</smart_patterns>

<output_template>
  <section name="problem">
    <content>[One sentence description]</content>
  </section>

  <section name="five_whys_analysis">
    <why_template>
      1. Why? [Answer] - Evidence: [what proves this]
      2. Why? [Answer] - Evidence: [what proves this]
      [...continue to root]
    </why_template>
  </section>

  <section name="root_cause">
    <field name="location">[file:line or component]</field>
    <field name="issue">[Specific technical problem]</field>
    <field name="confidence">[High/Medium/Low based on evidence]</field>
  </section>

  <section name="solution">
    <field name="immediate_mitigation">[If urgent]</field>
    <field name="root_fix">[Code/config change needed]</field>
    <field name="prevention">[Test/process to prevent recurrence]</field>
  </section>

  <section name="notes">
    <content>[Any branches explored, assumptions made, or additional context]</content>
  </section>
</output_template>

<reminder>
Five Whys is a thinking tool, not a rigid formula. Sometimes three whys finds the root. Sometimes you need seven. The goal is understanding, not completing a checklist.
</reminder>

<arguments>${ARGUMENTS}</arguments>
</protocol>
```
