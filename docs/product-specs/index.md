# Product Specs Index

One file per feature — behavior, data shape, edge cases, and explicit out-of-scope items.

| Feature | Spec | Status |
|---|---|---|
| AppStore + WebSockets | [app-store.md](app-store.md) | Stable |
| Dashboard | [dashboard.md](dashboard.md) | Stable |
| App Store Monitor | [monitor.md](monitor.md) | Stable, known memory leak |
| System Commands | [system-commands.md](system-commands.md) | New — remote PC management |

## What a Spec Covers

Each spec includes:
- What the feature does and for whom
- The key data shapes and wire formats
- Normal flows and edge cases
- Explicit out-of-scope items
- Links to implementation references

## Features Not Yet Specced

- **Rooms** — planned higher-level namespace concept (see [roadmap](../exec-plans/roadmap.md))
- **Web Components library** — more of a reference than a product feature; see [`docs/references/web-components.md`](../references/web-components.md)
