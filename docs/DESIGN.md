# Design Principles

Oversite is built for **longevity in production at physical interactive installations** — museums, exhibits, venues that run for years without active maintenance. Every design decision flows from that context.

See [`docs/design-docs/core-beliefs.md`](design-docs/core-beliefs.md) for the full rationale behind these principles.

## Principles

### 1. Longevity over framework adoption

Frameworks have release cycles, breaking changes, and community shifts. A React app from 2019 is a maintenance burden today. A vanilla JS Web Component from 2019 still runs.

- No React, Vue, Svelte, Lit, or Angular
- No TypeScript (adds a build step and tooling churn)
- Dependencies are minimized and chosen for stability

### 2. Simplicity over abstraction

The minimum complexity needed for the current task. Three similar lines of code is better than a premature abstraction.

- No helpers for one-time operations
- No feature flags
- No design for hypothetical future requirements
- If a section is unknown, mark it TODO — don't stub it out

### 3. Semantic HTML, classless styling

PicoCSS lets us write plain HTML and get decent UI without adding class names everywhere.

- No Bootstrap, Tailwind, or utility class frameworks
- Style with element selectors and CSS variables
- Override PicoCSS via CSS custom properties in `shared/css/styles.css`

### 4. Single-value-at-a-time messaging

AppStore prefers one key/value pair per message rather than bundled objects. This makes state granular, traceable in the monitor, and easier to handle in strongly-typed languages.

- Send multiple messages in sequence to update multiple keys
- Keys: `lowercase_with_underscores`
- Avoid deeply nested values — flatten state

### 5. Server as source of truth

Clients never update local state optimistically. They send to the server and wait for the echo back. This ensures all clients stay in sync even across reconnects.

- `_store.set(key, val, true)` → sends to server → updates locally on echo
- `_store.set(key, val, false)` → local only (no WS send)

### 6. Progressive disclosure in docs

Agents and developers start from a short root map (`AGENTS.md`) and follow links into deeper docs only when needed. No one file should contain everything.

## What This Is Not

- Not a general-purpose state management library
- Not a realtime multiplayer game framework (though it could be used for that)
- Not a cloud platform (deployable to cloud, but designed for physical venues)
- Not opinionated about the apps that connect to it — any language that speaks WebSocket + JSON can participate
