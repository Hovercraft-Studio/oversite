# Core Beliefs: Longevity-First Technology Choices

**Status**: Active
**Last reviewed**: 2026-03

## Context

Oversite is deployed at physical interactive installations that run for 1–5 years without active development. The team that builds an installation may not be the team that maintains it. Framework-dependent codebases become liabilities as ecosystems move on.

## Decision

### Vanilla JavaScript + Web Components

**Options considered**:
1. React — component model, large ecosystem, fast to build with
2. Vue — lighter than React, similar tradeoffs
3. Vanilla JS + Custom Elements — verbose but zero framework dependency

**Decision**: Vanilla JS + Web Components.

**Reasoning**: A React app from 2019 requires significant effort to maintain today (breaking changes across major versions, dependency audit, build tooling churn). A vanilla JS Custom Element from 2019 still runs unmodified. For a codebase that must remain operational for years with minimal maintenance, framework independence is worth the verbosity.

**Consequences**:
- Good: no npm audit alerts about framework internals; no forced upgrades
- Good: any developer who knows the web platform can read the code
- Bad: more boilerplate per component than React/Vue
- Bad: no hot ecosystem of compatible component libraries
- Accepted: we build what we need; we don't import what we don't control

### No TypeScript

**Options considered**:
1. TypeScript — type safety, better IDE support, catches errors at compile time
2. Plain JavaScript — runs directly, no build step for backend

**Decision**: Plain JavaScript.

**Reasoning**: TypeScript adds a compilation step and tooling dependency. The backend runs directly with Node — adding a TS compile step introduces a failure point and maintenance surface. For the frontend, the type safety benefit is real but not worth the complexity for a team-sized codebase where the same people write the types and consume them. If this changes (larger team, more complex data flows), TypeScript should be reconsidered.

**Consequences**:
- Good: backend files run directly with `node server.mjs`; no watch/compile loop
- Bad: no compile-time type checking
- Accepted: JSDoc types can provide IDE hints without a build step

### PicoCSS (Classless/Semantic)

**Options considered**:
1. Bootstrap — large, class-heavy, opinionated grid
2. Tailwind — utility-first, requires build step, changes HTML readability
3. PicoCSS — semantic HTML gets default styles; no classes required
4. No framework — hand-write all CSS

**Decision**: PicoCSS.

**Reasoning**: Show control UIs are simple — buttons, sliders, status indicators. PicoCSS gives a clean baseline without requiring class names on every element. Semantic HTML (`<button>`, `<input>`, `<nav>`) gets sensible styles automatically. Customization via CSS custom properties keeps the approach clean.

**Consequences**:
- Good: HTML stays readable; no `className="px-4 py-2 bg-blue-500 rounded"` soup
- Good: easy to theme via `--pico-primary` and similar variables
- Bad: less flexible than utility frameworks for complex layouts
- Bad: PicoCSS has less community momentum than Tailwind
- Accepted: for show control UIs, PicoCSS is more than sufficient

### No Shadow DOM (on new components)

**Options considered**:
1. Shadow DOM — true encapsulation, no style leakage
2. Light DOM — global CSS applies directly

**Decision**: Light DOM for new components. `app-store-init` uses Shadow DOM but isn't a visual component.

**Reasoning**: Shadow DOM blocks global CSS from applying inside components. This means PicoCSS styles don't reach component internals without `::part()` selectors or CSS custom properties — defeating the purpose of the classless approach. Light DOM lets global styles flow naturally.

**Consequences**:
- Good: components inherit global theme automatically
- Bad: no style isolation; components can accidentally be styled by global rules
- Accepted: the codebase is small enough that style collisions are manageable
