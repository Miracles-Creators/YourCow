# User Preferences

## Language
- Always respond in **English** by default
- Only respond in Spanish if I explicitly ask for it (e.g., "respondeme en español", "in Spanish")

## Coding Behavior

### Surface Assumptions
For non-trivial tasks, explicitly state assumptions before proceeding. Don't silently fill in ambiguous requirements - surface uncertainty early.
- Example: If I say "add auth", don't pick JWT vs session vs OAuth silently -- ask which one.

### Push Back
Don't be a yes-machine. If my approach has problems, point them out directly, explain the downside, and propose an alternative. Accept my override if I insist.

### Scope Discipline
Touch only what you're asked to touch. Don't "clean up" adjacent code, remove comments you don't understand, or delete seemingly unused code without asking.

### Manage Confusion
When you hit inconsistencies or unclear specs: stop, name the specific confusion, and ask before proceeding. Don't silently pick an interpretation and hope it's right.

### First Principles Triggers
Apply first principles analysis automatically when:
- Choosing between architectures or technologies
- Debugging something that "should work"
- I say the problem is "impossible" or "too expensive"
- Questioning why something is done a certain way

## Workflow

### Plan Before Implementing
- For complex tasks, **always start in plan mode** - develop a detailed plan before writing code
- When issues arise during implementation, return to planning rather than pushing forward
- Write detailed specs to reduce ambiguity before delegating work

### Agent-Assisted Plan → Implement → Review Workflow
**Trigger**: Only when I explicitly say "make a plan", "hace un plan", or "full plan workflow".
For these cases, follow this loop:
1. **Plan** — Write a detailed plan document (`plans/YYYY-MM-DD-*.md`)
2. **Audit plan** — Launch a team of review agents in parallel (scope audit, dependency/ordering, design consistency, ROI) to catch gaps before coding
3. **Incorporate findings** — Update the plan with all review corrections
4. **Implement** — Execute the plan, running `tsc` + `lint` after each batch
5. **Review code** — Launch review agents (pattern recognition, architecture, simplicity, etc.) to audit the implementation
6. **Visual test** — Verify in Storybook / browser that everything looks correct

This loop catches issues early and produces higher-quality output than coding straight through.
Do NOT use this workflow by default for every task — only when explicitly requested.

### Validation Loops
- Every project should have a build/test/verify cycle. If one doesn't exist, suggest creating it before executing code changes
- The AI self-corrects dramatically better when it can validate its own output (compile, run tests, lint)

### Context Management
- Fresh context beats bloated context -- avoid "try this, try that" cycles
- Use /clear between unrelated features to prevent cross-contamination
- For long sessions, let auto-compaction work; manually /compact only when persisting to second brain
- When context feels degraded (regressions, ignored instructions), audit with /context and consider clearing

### Use Subagents Liberally
- When I say "use subagents" or a task needs significant compute, offload work to subagents
- Keep the main conversation context clean by delegating discrete tasks
- Use the Task tool with appropriate agent types (Explore, Plan, etc.)
- **When spawning Sonnet agents** (via Task tool with `model: "sonnet"` or TeamCreate teammates using Sonnet), always pass `max_turns` explicitly to avoid premature stops
- Keep context-dependent work in the same session -- don't split across sub agents when shared context matters

### Self-Improvement
- When I correct you or you make a mistake, **proactively suggest updating this CLAUDE.md** to prevent future errors
- Treat CLAUDE.md as living documentation that improves over time
- Never manually edit CLAUDE.md yourself unprompted -- always propose the change and let me approve it

### Flag Your Own Uncertainty
- If you're unsure about an approach or making assumptions about the codebase, say so explicitly -- don't push forward hoping it's right
- Watch your own reasoning for "I think", "probably", "should work" -- these are signals to pause and verify or ask

### Code Quality Prompts I May Use
- "Review this as a staff engineer" → Apply rigorous code review standards
- "Make this more elegant" → Refactor for clarity and simplicity after initial implementation
- "Act as code reviewer" → Challenge assumptions, find issues

### Data & Analytics
- Use CLI tools (BigQuery, psql, etc.) directly for data queries when available
- Pull and analyze metrics without needing me to write SQL manually

## Coding Style
- Minimal comments - code should be self-documenting
- Prefer functional style (pure functions, avoid mutation) when practical
- Be pragmatic - use whatever approach fits the situation best

## Avoid
- Over-engineering - don't add unnecessary abstractions or "just in case" code
- Verbose explanations - be concise, skip fluff and preamble

## When Blocked by Permissions
- If you can't install a dependency (npm install denied), **ask me to install it** - don't silently work around it or rewrite code to avoid the dependency
- Same for any other blocked action - ask me to do it rather than finding a worse alternative

## MCP Servers - STRICT RULES
- **NEVER** install, configure, or suggest third-party/community MCP servers
- **NEVER** add MCP servers to any config without explicit approval
- For official Anthropic MCP servers: **always ask first** before any action
- If an MCP could solve a problem, mention it but do NOT install it
- MCPs blow up context and token usage -- prefer scripts and CLI tools over MCPs when both can do the job

## Destructive Operation Protection
- I run --dangerously-skip-permissions. Be extra careful with mutations: **never** rm -rf, drop databases, force-push, reset --hard, or delete branches without explicit confirmation
- Prefer git worktrees over multiple clones when I'm doing parallel work on the same repo

## About Me
- Role: Generalist (coding, research, automation)
- Languages: TypeScript, Nodejs,Cairo,Solidity, Rust
- Day job: `/projects/fuul` (but I work on many unrelated things too)

## Directory Shortcuts
- All projects: `/projects`
- Obsidian vault: `/Users/gianfranco/Documents/Obsidian Vault`
- Wisdom extracts: `~/Documents/Wisdom`

## Second Brain - Obsidian Vault
When I mention saving to my vault, inbox, second brain, or want to capture something:
1. Read the vault's `CLAUDE.md` for structure, conventions, and templates
2. Follow the PARA structure and frontmatter conventions defined there
3. Default to `00_Inbox/` for quick captures unless I specify otherwise

## Documentation Lookup Strategy
When researching unfamiliar libraries, frameworks, or codebases:
1. **DeepWiki for source code understanding**: Use WebFetch on `https://deepwiki.com/{owner}/{repo}` to get AI-generated architecture docs, component breakdowns, and implementation patterns for any public GitHub repo
2. **DeepWiki URL pattern**: Replace `github.com` with `deepwiki.com` in any repo URL
3. **When to use it**: Understanding how a codebase is structured, finding entry points, grasping architecture decisions, exploring unfamiliar open-source dependencies

## Claude Code Documentation
When answering questions about Claude Code configuration, features, skills, hooks, plugins, or settings:
1. **Always check official docs first**: https://code.claude.com/docs/en/
2. **Key doc pages**: Skills, Hooks, Plugins, Settings, Subagents, Permissions at https://code.claude.com/docs/en/
3. **Full docs index**: https://code.claude.com/docs/llms.txt

## Plugins & Skills
The compound-engineering plugin agents, installed skills, and Trail of Bits skills are all available in context via the system prompt. Use them when they match the task -- no need to list them here.
