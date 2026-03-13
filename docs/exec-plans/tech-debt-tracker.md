# Tech Debt Tracker

Active debt items with impact, priority, and target area. Cross-reference with [`roadmap.md`](roadmap.md) for feature work.

| ID | File | Debt | Impact | Priority |
|---|---|---|---|---|
| ~~R1~~ | ~~`dashboard-api.mjs`~~ | ~~Sync fs calls~~ | — | ✅ Done — migrated to `fs.promises` |
| R2 | `src/components/monitor/app-store-table.js` | Unbounded memory leak — listeners and DOM nodes accumulate on every state update | High — monitor unusable after hours of uptime | High |
| R3 | `src/server/socket-server.mjs` + `persistent-state.mjs` | No shared config object — config is scattered as constructor args | Medium — makes coordinated changes harder | Medium |
| R4 | `src/app-store/app-store-.mjs` | `window._store` global — fragile, hard to test, blocks module isolation | Low — works fine in browser context | Low |
| R5 | `src/components/dashboard/dashboard-view.js` | ~640 lines, handles too much — candidate for decomposition | Low — functional but hard to modify | Low |
| R6 | All web components | `disconnectedCallback` doesn't fully clean up listeners/DOM in all components | Medium — contributes to memory issues in long-running pages | Medium |

## Detail

### R2 — Memory Leak in `app-store-table.js`

**Symptom**: Monitor page consumes multiple GB of RAM after hours/days of uptime.

**Likely cause**: On every AppStore update, the component may be adding event listeners or creating DOM nodes without cleaning up old ones. The state table re-renders on each key change without removing stale entries.

**Fix approach**:
1. Audit listener registration in `connectedCallback` / `disconnectedCallback`
2. Implement a fixed-size ring buffer or keyed update (update existing row, don't append) for the state table
3. Verify cleanup in `disconnectedCallback` removes all listeners

**Workaround**: Refresh the monitor page every few hours during long sessions.

### R3 — Shared Config / ServerContext

**Symptom**: `SocketServer` and `PersistentState` receive their config as constructor args from `server.mjs`. As more config is needed, the arg lists grow.

**Fix approach**: Introduce a `ServerContext` class or plain config object that all modules receive. Makes it easier to add new server-wide config without updating every constructor signature.

### R4 — `window._store` Global

**Symptom**: AppStore sets `window._store` on construction. This makes it impossible to run multiple stores in one page or to test components in Node (no `window`).

**Fix approach**: Audit all usages. Consider a module-level singleton export as an alternative path. Low priority unless testing infra is added.

### R5 — `dashboard-view.js` Decomposition

**Symptom**: Single component at ~640 lines handles fetching, rendering all project cards, and card interactions.

**Fix approach**: Extract into `dashboard-card.js`, `dashboard-grid.js`, and a data-fetching layer. No behavior change needed.

### R6 — Component Cleanup

**Symptom**: Several components subscribe to store events in `connectedCallback` but `disconnectedCallback` may not remove all listeners, particularly for components that wire up DOM events dynamically in `subclassInit()`.

**Fix approach**: Audit each component in `src/components/`. Ensure `disconnectedCallback` calls `_store.removeListener(this)` and removes any DOM event listeners added in `subclassInit()`.
