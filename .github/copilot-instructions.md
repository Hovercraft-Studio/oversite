# Oversite — Copilot Instructions

Oversite is a **venue/installation operations toolkit** — distributed state (AppStore + WebSockets), app health monitoring (Dashboard), and show-control web components. Built for **longevity**: vanilla JS, Web Components, no frameworks, no TypeScript.

Full documentation lives in [`AGENTS.md`](../AGENTS.md) (root map) and the [`docs/`](../docs/) tree. Read the relevant doc before working on any system.

## Hard Constraints

- **No TypeScript, React, Vue, Svelte, or Lit**
- **No Shadow DOM** on new components — global CSS must reach all components
- **No CSS class frameworks** — PicoCSS only
- **No build step for server code** — `.mjs` files run directly with Node
- **Bounce-back sync** — `_store.set(key, val, true)` sends to server; local state updates ONLY on echo back. Never update local state before the echo.
- Keys are `snake_case`. Heartbeat keys: `{sender}_heartbeat`. Health keys: `{thing}_health`.

## Code Patterns

### Backend module
```js
import { logGreen } from "./util.mjs"; // always use util.mjs colors, not console.log

class MyModule {
  constructor(app, config) {
    this.app = app;
    this.handleRequest = this.handleRequest.bind(this); // bind all callbacks
  }
  addRoutes() { this.app.get("/api/my-route", this.handleRequest); }
  handleRequest(req, res) { logGreen("hit"); res.json({ ok: true }); }
}
```

### Web component
```js
import AppStoreElement from "./app-store-element.js";

class MyComponent extends AppStoreElement {
  subclassInit() { /* wire DOM events; store is ready, this.storeKey/storeValue set */ }
  setStoreValue(value) { this.render(); /* or update specific child elements */ }
  html() { return /*html*/ `<div>${this.storeValue || ""}</div>`; }
  css()  { return /*css*/  `my-component { display: block; }`; }
  static register() { customElements.define("my-component", MyComponent); }
}
MyComponent.register();
export default MyComponent;
```

- Use `/*html*/` and `/*css*/` template comment tags for editor syntax highlighting
- Override `subclassInit()`, not `connectedCallback()`
- `this.el` is the element reference (`this` in light-DOM components)

## Key Docs

| What | Where |
|---|---|
| System diagram + data flows | [`ARCHITECTURE.md`](../ARCHITECTURE.md) |
| All commands | [`docs/COMMANDS.md`](../docs/COMMANDS.md) |
| AppStore wire format + API | [`docs/product-specs/app-store.md`](../docs/product-specs/app-store.md) |
| WebSocket server internals | [`docs/references/websocket-server.md`](../docs/references/websocket-server.md) |
| Web component catalog | [`docs/references/web-components.md`](../docs/references/web-components.md) |
| Tech debt + known issues | [`docs/exec-plans/tech-debt-tracker.md`](../docs/exec-plans/tech-debt-tracker.md) |
| Roadmap | [`docs/exec-plans/roadmap.md`](../docs/exec-plans/roadmap.md) |
