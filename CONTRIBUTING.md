# Project Coding Guidelines

This document outlines the coding standards and architectural patterns used in the Oversite project. Please follow these guidelines when contributing to the codebase.

## Project Structure

- **`/src/server`**: Backend logic, API handlers, and WebSocket server implementation.
- **`/src/components`**: Frontend Web Components.
- **`/src/util`**: Shared utility functions.
- **`server.mjs`**: Main entry point for the backend server.

## Backend Development (`/src/server`)

The backend is built with Node.js using **ES Modules** (`.mjs`).

### Style & Patterns
- **Modules**: Use ES Module syntax (`import`/`export`).
- **File Extensions**: Use `.mjs` for all backend files to ensure proper module parsing.
- **Configuration**:
  - Use `dotenv` for environment variables.
  - Centralize configuration in a `config` object (see `server.mjs`).
  - Support both `.env` and CLI arguments (e.g., `process.env.PORT` vs `--port`).
- **Path Handling**:
  - Use `path.join()` and `path.resolve()` for cross-platform compatibility.
  - Derive `__dirname` using `fileURLToPath(import.meta.url)`.
- **Logging**:
  - Use the custom logging utilities from `src/server/util.mjs` (`logBlue`, `logGreen`, `eventLog`) instead of raw `console.log` where appropriate.
- **Classes**:
  - Bind methods in the `constructor` if they are passed as callbacks.
  - Use descriptive class properties for constants (e.g., `DEFAULT_CHANNEL`).

### Example (Backend Class)
```javascript
import { logGreen } from "./util.mjs";

class MyServerModule {
  constructor(app) {
    this.app = app;
    this.handleRequest = this.handleRequest.bind(this); // Bind for callbacks
  }

  addRoutes() {
    this.app.get("/api/my-route", this.handleRequest);
  }

  handleRequest(req, res) {
    logGreen("Request received");
    res.json({ success: true });
  }
}
```

## Frontend Development (`/src/components`)

The frontend uses **Vanilla Web Components** (Custom Elements) without a heavy framework.

### Component Architecture
- **Base Class**: Most components should extend `AppStoreElement` (from `./app-store-element.js`).
- **Registration**:
  - Include a static `register()` method.
  - Call `register()` at the end of the file.
  - Register components in `_register-components.js`.
- **State Management**:
  - Components interact with a global `_store` object.
  - Implement `initStoreListener()` to subscribe to store updates.
  - Implement `storeUpdated(key, value)` to react to changes.
  - Use `setStoreValue(value)` to update the DOM when data changes.
- **Templates & Styles**:
  - Use `html()` method to return HTML strings. Tag with `/*html*/` for editor support.
  - Use `css()` method to return CSS strings. Tag with `/*css*/` for editor support.
  - `AppStoreElement` handles the rendering lifecycle.

### Component Template
```javascript
import AppStoreElement from "./app-store-element.js";

class MyComponent extends AppStoreElement {
  // Define attributes to watch
  static observedAttributes = ["my-attr"];

  // Initialize store listeners
  initStoreListener() {
    super.initStoreListener();
    // Custom initialization logic
  }

  // Handle store updates
  storeUpdated(key, value) {
    if (key !== this.storeKey) return;
    this.setStoreValue(value);
  }

  // Update DOM based on value
  setStoreValue(value) {
    // Update specific elements or re-render
    const display = this.el.querySelector(".display");
    if (display) display.textContent = value;
  }

  // Component Styles
  css() {
    return /*css*/`
      :host {
        display: block;
      }
      .display {
        color: blue;
      }
    `;
  }

  // Component HTML
  html() {
    return /*html*/`
      <div class="display">${this.storeValue || ""}</div>
    `;
  }

  static register() {
    customElements.define("my-component", MyComponent);
  }
}

MyComponent.register();
export default MyComponent;
```

## General Best Practices

- **Formatting**: Use Prettier-compatible formatting (2 spaces indentation, semicolons, double quotes).
- **Comments**: Use block comments for major sections:
  ```javascript
  /////////////////////////////////////////////////////////
  // Section Name
  /////////////////////////////////////////////////////////
  ```
- **File Naming**: Use kebab-case for filenames (e.g., `app-store-button.js`, `socket-server.mjs`).
