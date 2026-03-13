# Frontend Architecture

Oversite's frontend is built entirely with vanilla Web Components (Custom Elements). No framework, no build-time JSX, no Shadow DOM (with one exception).

See [`docs/references/web-components.md`](references/web-components.md) for the full component catalog and attribute reference.

## AppStoreElement — Base Class

`src/components/ui/app-store-element.js` is the base class all UI components extend. It handles:

- Waiting for `window._store` to be ready before initializing (via `AppStore.checkStoreReady()`)
- Calling `subclassInit()` once the store is available
- Registering as a store listener; calling `storeUpdated(key, value)` and then `setStoreValue(value)` on changes
- Rendering via `html()` → `this.el.innerHTML`; injecting `css()` into `<head>` once per tag name
- Removing itself as a listener in `disconnectedCallback`

### Lifecycle Order

```
connectedCallback()
  → initComponent()          reads key/value attrs, sets this.storeKey / this.storeValue
  → AppStore.checkStoreReady()
      → storeIsReady()
          → subclassInit()   ← override this for component-specific setup
          → hydrateOnInit()  applies current store value if already set
  → render()                 writes html() to DOM, injects css() to <head>

storeUpdated(key, value)     called for every store change
  → setStoreValue(value)     ← override this to react to updates
```

### Overriding in Subclasses

```js
class MyWidget extends AppStoreElement {
  subclassInit() {
    // store is ready; this.storeKey / this.storeValue are set
    // wire up DOM events here
    this.el.querySelector('button').addEventListener('click', () => {
      _store.set(this.storeKey, this.storeValue, true); // broadcast
    });
  }

  setStoreValue(value) {
    this.render(); // or update specific elements
  }

  html() {
    return /*html*/ `<button>${this.initialHTML}</button>`;
  }

  css() {
    return /*css*/ `my-widget button { color: red; }`;
  }

  static register() {
    customElements.define('my-widget', MyWidget);
  }
}
MyWidget.register();
export default MyWidget;
```

## State Access

All components share a single store instance via `window._store`. The global is set by `AppStore` on construction and is available from any component without importing.

```js
_store.get('app_state')          // read
_store.set('volume', 0.8)        // local update only
_store.set('volume', 0.8, true)  // broadcast via WebSocket
_store.addListener(this)         // subscribe to all key changes
_store.removeListener(this)      // unsubscribe
```

## Page Bootstrap

The `<oversite-header>` component sets up everything a typical page needs:

```html
<oversite-header id="tablet"></oversite-header>
```

This injects (using the `id` as the sender identifier):
- `<app-store-init sender="tablet" init-keys="*">` — connects to WS, hydrates state
- `<app-store-heartbeat key="tablet_heartbeat">` — sends uptime every 30s
- `<auth-logout-button>` and `<notyf-listener>`

For pages without `oversite-header`, use `app-store-init` directly:
```html
<app-store-init sender="my-app" channel="default" init-keys="*" debug></app-store-init>
```

## Shadow DOM Policy

**Do not use Shadow DOM on new components.** Components write directly to `this.innerHTML` so global PicoCSS and `shared/css/styles.css` apply without workarounds.

The only exception is `app-store-init`, which uses Shadow DOM already and should not be changed.

## CSS Architecture

- `shared/css/pico.css` — PicoCSS base (semantic elements get default styles)
- `shared/css/styles.css` — global overrides and custom properties
- Per-component CSS via `css()` → injected once into `<head>` as `<style id="style-{tag-name}">`

Override PicoCSS via custom properties:
```css
:root {
  --pico-primary: #ff6600;
}
```

See `.github/skills/picocss-customization/SKILL.md` for theming guidance.

## Component Registration

All components self-register via a static `register()` method called at the bottom of each file. Import them all at once:

```js
import '../src/components/_register-components.js';
```

## Canonical Usage Example

`app-store-demo/index.html` is the canonical reference for how components are used together. Read it before building new pages.
