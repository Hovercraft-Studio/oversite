# Web Components

Oversite provides a library of web components for building show control UIs and visitor-facing interfaces. All components are built with vanilla JavaScript — no frameworks.

## Core Concept: AppStoreElement

All Oversite UI components extend `AppStoreElement` (`src/components/ui/app-store-element.js`), which provides:

- Automatic access to `window._store` (the shared AppStore instance)
- Store subscription lifecycle: `storeIsReady()` → `subclassInit()` → `storeUpdated(key, value)` → `setStoreValue(value)`
- `render()` that writes `this.html()` to `this.el.innerHTML` and injects `this.css()` into `<head>` (once per tag name)
- `disconnectedCallback` removes the store listener automatically

**Key pattern**: override `subclassInit()` (not `connectedCallback`) for post-store initialization, and override `setStoreValue(value)` to react to store updates.

```js
import AppStoreElement from '../ui/app-store-element.js';

class MyWidget extends AppStoreElement {
  subclassInit() {
    // store is ready, this.storeKey and this.storeValue are set
    this.button = this.el.querySelector('button');
    this.button.addEventListener('click', () => {
      _store.set(this.storeKey, this.storeValue, true);
    });
  }

  setStoreValue(value) {
    this.render();
  }

  html() {
    return `<button>${this.initialHTML}</button>`;
  }
}

customElements.define('my-widget', MyWidget);
```

### Base Attributes (all AppStoreElement subclasses)

| Attribute | Alias | Description |
|---|---|---|
| `key` | `store-key` | The AppStore key this component reads/writes |
| `value` | `store-value` | The value to send, or initial/default value |
| `disabled` | — | Disables all `input`, `button`, `select`, `textarea` children |
| `flash-on-update` | — | Briefly flashes background when the store value changes |

Boolean string values (`"true"`, `"false"`, `"0"`, `"1"`, `"-1"`) are coerced to their JS equivalents automatically.

---

## Component Catalog

### UI Components (`src/components/ui/`)

#### `<app-store-element>` — inline value display

The base class is also registered as a component. Use it inline to display the current value of any key:

```html
app_state = <code><app-store-element key="app_state"></app-store-element></code>
audio_volume: <code><app-store-element key="audio_volume" flash-on-update></app-store-element></code>
```

#### `<app-store-button>` — button that sets a store key

Inner text becomes the button label. Multiple buttons can share the same `key` with different `value`s — the active one is highlighted (gets `.secondary` class).

```html
<!-- Shared key, different values — radio-button style -->
<app-store-button key="app_state" value="attract">Attract</app-store-button>
<app-store-button key="app_state" value="gameplay">Gameplay</app-store-button>
<app-store-button key="app_state" value="game_over">Game Over</app-store-button>

<!-- Special modes -->
<app-store-button key="btn_pulse" value="1" momentary>Momentary / Pulse</app-store-button>
<app-store-button key="btn_toggle" value="0" toggle>Toggle</app-store-button>
<app-store-button key="btn_confirm" value="true" confirm>Confirm</app-store-button>
<app-store-button key="btn_disabled" value="true" disabled>Disabled</app-store-button>

<!-- Alternate attribute names -->
<app-store-button store-key="test_key" store-value="test_value">Alternate Attributes</app-store-button>
```

| Attribute | Description |
|---|---|
| `momentary` | Sends `value` then immediately sends `0` after 50ms (pulse) |
| `toggle` | Toggles between `0`/`1` or `false`/`true` on each click; adds a checkbox switch indicator |
| `confirm` | Shows `window.confirm()` before sending; set to a string for a custom message |
| `disabled` | Disables the button |

#### `<buttons-for-key>` — dynamic button grid from store array

Renders a grid of `<app-store-button>` elements based on a JSON array stored in the AppStore, or from a static comma-separated `values` attribute. The output key is derived from the input key by stripping `_buttons` (e.g. `scene_buttons` → `scene`).

```html
<!-- Buttons from store array (sent by another client) -->
<buttons-for-key store-key="scene_buttons"></buttons-for-key>

<!-- Buttons from static attribute -->
<buttons-for-key store-key="scene_buttons" values="intro, main, outro"></buttons-for-key>

<!-- Momentary buttons -->
<buttons-for-key store-key="cue_buttons" momentary></buttons-for-key>
```

| Attribute | Description |
|---|---|
| `store-key` | AppStore key containing a JSON array of button labels (e.g. `["intro", "main", "outro"]`) |
| `values` | Comma-separated list of button labels — used as initial buttons before any store update arrives |
| `momentary` | If present, each button sends its value then immediately sends `0` (pulse mode) |

The component hides its nearest parent `<details>` element when the button list is empty, and shows it when buttons are available.

#### `<app-store-slider>` — range slider

Use an external `<label>` element for labeling — no `label` attribute exists.

```html
<label>audio_volume: <code><app-store-element key="audio_volume"></app-store-element></code></label>
<app-store-slider key="audio_volume" value="0" max="1"></app-store-slider>

<!-- With icon -->
<app-store-slider key="audio_volume" value="0" max="1" icon-audio></app-store-slider>
<app-store-slider key="brightness" value="100" icon-brightness></app-store-slider>

<!-- With live value display -->
<app-store-slider key="mouse_x" show-value></app-store-slider>
```

| Attribute | Description |
|---|---|
| `icon-audio` | Shows an audio speaker SVG icon before the slider |
| `icon-brightness` | Shows a brightness/sun SVG icon before the slider |
| `show-value` | Shows the key name and its current live value before the slider |

#### `<app-store-textfield>` — text input

```html
<label>app-store-textfield</label>
<app-store-textfield key="text_input" value="" placeholder="Enter text here"></app-store-textfield>
```

#### `<app-store-number>` — numeric input

```html
<label>app-store-number</label>
<app-store-number key="numeric_input" value=""></app-store-number>
```

#### `<app-store-checkbox>` — checkbox

Inner text becomes the checkbox label.

```html
<app-store-checkbox key="checkbox_1">Checkbox 1</app-store-checkbox>
<app-store-checkbox key="checkbox_2" value="true">Checkbox 2 (starts checked)</app-store-checkbox>
<app-store-checkbox key="checkbox_3" disabled>Checkbox 3 (disabled)</app-store-checkbox>
<app-store-checkbox key="checkbox_toggle" toggle>Checkbox Toggle</app-store-checkbox>
```

| Attribute | Description |
|---|---|
| `toggle` | Toggles the boolean value in the store on each change |
| `disabled` | Disables the checkbox |

#### `<app-store-health>` — status indicator dot

Renders a colored circle: yellow (no data), green (`true`/`1`), red (`false`/`0`). Displays the key name automatically — no label attribute needed.

```html
<app-store-health key="camera_1_health" value=""></app-store-health>
<app-store-health key="camera_2_health" value=""></app-store-health>
```

#### `<modal-dialog>` and `<modal-window-demo>`

```html
<modal-window-demo key="show_modal" value="true" modal-target="example_modal"></modal-window-demo>
<modal-dialog></modal-dialog>
```

---

### Store Components (`src/components/store/`)

Infrastructure components — place once per page. In practice, `<oversite-header>` handles all of these automatically.

#### `<app-store-init>` — boots the distributed store

Uses Shadow DOM. Connects to the WebSocket server, hydrates state from the server, and sets `window._store`.

```html
<app-store-init sender="tablet" channel="default" init-keys="*" debug side-debug></app-store-init>
```

| Attribute | Description |
|---|---|
| `sender` | Identifies this client in the monitor (use lowercase with underscores, e.g. `tablet`) |
| `channel` | WebSocket channel to connect to (default: `"default"`) |
| `auth-key` | Authentication key for the connection |
| `init-keys` | Space-separated list of keys to hydrate on connect, or `"*"` for all keys |
| `debug` | Shows the debug overlay in the browser |
| `side-debug` | Renders the debug overlay on the side instead of the bottom |
| `disable-favicon-status` | Disables automatic favicon updates showing WS connection status |
| `ws-url` | Directly override the WebSocket URL (bypasses hash-based config) |

The WebSocket URL is determined in this order:
1. `ws-url` attribute (if set)
2. `#&wsURL=` hash parameter in the page URL
3. Auto-detected from the current page host (uses `wss://` in production, `ws://` in dev)

**Hash parameter overrides:** `channel` and `sender` can also be set via the URL hash. When present, hash values take priority over HTML attributes. Parameters are auto-written to the hash on first load, making URLs shareable.

| Hash Param | Overrides Attribute | Default |
|---|---|---|
| `wsURL` | `ws-url` | Auto-detected |
| `channel` | `channel` | `"default"` |
| `sender` | `sender` | Attribute value |

```
http://localhost:3002/app-store-demo/#&wsURL=ws://localhost:3003/ws&channel=dashboard&sender=cool_ui_yo
```

#### `<app-store-heartbeat>` — sends periodic uptime heartbeats

```html
<app-store-heartbeat key="tablet_heartbeat" value="n/a" interval="30000" show="false"></app-store-heartbeat>
```

| Attribute | Default | Description |
|---|---|---|
| `key` | — | The AppStore key to write uptime to |
| `value` | — | Initial/placeholder value before first heartbeat |
| `interval` | `5000` | Milliseconds between heartbeats |
| `show` | `"false"` | Set `"true"` to render the formatted uptime in the DOM |

Sends milliseconds since the component connected (i.e. page load) as the value on each interval.

---

### Site Components (`src/components/site/`)

#### `<oversite-header>` — standard page header

The simplest way to set up a full page. Injects `app-store-init`, `app-store-heartbeat`, `auth-logout-button`, `notyf-listener`, and `home-button` (on non-home pages).

```html
<oversite-header id="tablet"></oversite-header>
```

The `id` attribute doubles as the `sender` ID passed to `app-store-init` and as the heartbeat key prefix (`{id}_heartbeat`). Use a descriptive identifier for the machine/role (e.g. `tablet`, `kiosk_1`, `controller`).

Other site components:
- `<home-button>` — link back to root
- `<modal-window-demo>` — modal demo

---

### Monitor Components (`src/components/monitor/`)

Used in the App Store Monitor page. Can also be embedded in custom debug UIs.

| Component | Element | Description |
|---|---|---|
| `app-store-table.js` | `<app-store-table>` | Full live key/value state table |
| `app-store-event-table.js` | `<app-store-event-table>` | Incoming message log as a table |
| `app-store-clients.js` | `<app-store-clients>` | Connected clients list |
| `event-log-view.js` | `<event-log-view>` | Alternative event log view |

```html
<!-- Show last 10 events, hide filter controls -->
<app-store-event-table max-length="10" hide-filters></app-store-event-table>
```

**Note:** `app-store-table` has a known memory leak — see [monitor.md](./monitor.md#known-issue-memory-leak-in-app-store-table).

---

### Auth Components (`src/components/auth/`)

| Component | Element | Description |
|---|---|---|
| `auth-form.js` | `<auth-form>` | Login form |
| `auth-redirect.js` | `<auth-redirect>` | Wraps protected content; redirects to login if not authenticated |
| `auth-logout-button.js` | `<auth-logout-button>` | Logout button |

Wrap protected page content with `<auth-redirect>`:
```html
<auth-redirect style="display: none">
  <main class="container">
    <!-- protected content here -->
  </main>
</auth-redirect>
```

### Dashboard Components (`src/components/dashboard/`)

| Component | Element | Description |
|---|---|---|
| `dashboard-view.js` | `<dashboard-view>` | Full dashboard UI (~640 lines; candidate for decomposition) |
| `dashboard-client-example.js` | _(example)_ | Usage example for DashboardPoster |

---

## Registering Components

All components are registered in `src/components/_register-components.js`. Import once in your page's JS entry point:

```js
import '../src/components/_register-components.js';
```

Or import only what you need:
```js
import '../src/components/ui/app-store-button.js';
import '../src/components/store/app-store-init.js';
```

---

## A Minimal Show Controller Page

Based on `app-store-demo/index.html` — the canonical reference for component usage:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Show Controller</title>
  <link rel="stylesheet" href="/shared/css/pico.css" />
  <link rel="stylesheet" href="/shared/css/styles.css" />
  <script type="module" src="/src/components/_register-components.js"></script>
</head>
<body>
  <!-- oversite-header id = sender ID for this client -->
  <oversite-header id="tablet"></oversite-header>

  <custom-app>
    <auth-redirect style="display: none">
      <main class="container">
        <home-button></home-button>

        <section>
          <h2>Scene Control</h2>
          <h4>app_state = <code><app-store-element key="app_state"></app-store-element></code></h4>
          <nav>
            <app-store-button key="app_state" value="attract">Attract</app-store-button>
            <app-store-button key="app_state" value="gameplay">Gameplay</app-store-button>
            <app-store-button key="app_state" value="game_over">Game Over</app-store-button>
          </nav>
        </section>

        <section>
          <h2>Audio</h2>
          <label>audio_volume: <code><app-store-element key="audio_volume"></app-store-element></code></label>
          <app-store-slider key="audio_volume" value="0" max="1"></app-store-slider>
          <app-store-checkbox key="audio_mute">Mute</app-store-checkbox>
        </section>

        <section>
          <h2>Status</h2>
          <p class="grid">
            <app-store-health key="camera_1_health" value=""></app-store-health>
            <app-store-health key="camera_2_health" value=""></app-store-health>
          </p>
        </section>

        <details>
          <summary>Event Log</summary>
          <app-store-event-table max-length="10" hide-filters></app-store-event-table>
        </details>
      </main>
    </auth-redirect>
    <modal-dialog></modal-dialog>
  </custom-app>

  <script type="module" src="./js/app.js"></script>
</body>
</html>
```

The `app.js` for a custom page connects to the store via the `storeUpdated` pattern:

```js
class CustomApp extends HTMLElement {
  connectedCallback() {
    this.init();
    _store.addListener(this);
  }

  storeUpdated(key, value) {
    // react to any store key changes here
  }

  init() {
    // page-specific setup
  }
}
customElements.define('custom-app', CustomApp);
```

---

## Styling

Components use [PicoCSS](https://picocss.com/) for base styling — semantic HTML with no extra classes needed. Custom styles go in `shared/css/styles.css`. Do not use external CSS frameworks (Bootstrap, Tailwind, etc.).

See `.github/skills/picocss-customization/SKILL.md` for theming guidance.

---

## Writing New Components

1. Extend `AppStoreElement`
2. Override `subclassInit()` for post-store-ready initialization (not `connectedCallback`)
3. Override `setStoreValue(value)` to react to incoming store updates
4. Override `html()` to define the component's markup
5. Override `css()` to define component-scoped styles (injected once into `<head>`)
6. Register with `customElements.define()` in a static `register()` method
7. Add the import to `_register-components.js`

**Do not** use Shadow DOM for new components — it blocks global CSS. The exception is `app-store-init`, which already uses Shadow DOM and should not be changed.

See `.github/skills/web-components/SKILL.md` for a detailed authoring guide with examples.

---

## Patterns and Conventions

- **No Shadow DOM** — write to `this.innerHTML` directly so global CSS applies
- **No frameworks** — vanilla JS only (no React, Vue, Svelte, Lit)
- **No TypeScript** — plain `.js` files
- **Labels are inner text** — not attributes; `<app-store-button key="x" value="y">Label</app-store-button>`
- **Use `key` attribute** — every component that reads/writes the store uses `key` (or `store-key` alias)
- **Shared keys** — multiple buttons can share one `key` with different `value`s for radio-button-style scene selection
