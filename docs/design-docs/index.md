# Design Docs Index

Architecture decisions — why things are the way they are.

| Doc | Decision | Status | Last Reviewed |
|---|---|---|---|
| [core-beliefs.md](core-beliefs.md) | Longevity-first technology choices (vanilla JS, no framework, PicoCSS) | Active | 2026-03 |
| [harness-engineering.md](harness-engineering.md) | How and why this docs system is structured (agent map + progressive disclosure) | Active | 2026-03 |

## How to Use These Docs

Each doc covers one significant decision: the context that forced a choice, the options considered, the decision made, and the consequences (good and bad). Read these before proposing architectural changes — the reasoning may already be documented.

When adding a new decision doc:
1. Copy the template below
2. Name the file `<decision-slug>.md`
3. Add a row to this index

```markdown
## Context
What situation or constraint forced a decision?

## Options Considered
1. Option A — pros/cons
2. Option B — pros/cons

## Decision
What was chosen and why.

## Consequences
- Good: ...
- Bad / accepted tradeoffs: ...
- Follow-up work: ...
```
