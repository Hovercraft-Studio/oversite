# Oversite: React + Vite Example

This example demonstrates how to use Oversite with a React application built using Vite.

To run _this_ example, follow these steps:

```bash
cd examples/react
npm install
npm run dev
```

Then open your browser and navigate to `http://localhost:5173` to see the application in action.

## To start a React project using Oversite

If you want to create a new React project with Oversite, you can use the following commands:

```bash
npm create vite@latest --template react
cd <your-project-name>
npm install
```

Then install `oversite`:

```bash
npm install git@github.com:Hovercraft-Studio/oversite.git#main
npm run dev
```

In your Javascript (likely main.jsx), import the `oversite` components and any css/js that you want to use:

```javascript
// src/main.jsx
import "oversite/src/components/_register-components.js"; // required

// optional, but will give you nice base styling
import "oversite/shared/css/pico.css";
import "oversite/shared/css/styles.css";
```

In your index.html, add the `<app-store-init>` component to initialize Oversite:

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Oversite + React</title>
  </head>
  <body>
    <!-- required: add app-store-init above the #root div -->
    <app-store-init
      sender="custom-app"
      init-keys="*"
      debug
      side-debug
    ></app-store-init>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

See also [`oversite-module/frontend/README.md`](../oversite-module/frontend/README.md).

## To run the AppStore servers

To run Oversite’s frontend server and the server app:

```bash
cd node_modules/oversite
npm run dev
```

Learn more in the [Oversite README](../../README.md).

## To Update Oversite

Pull the latest from `oversite`:

- Make sure to delete package-lock.json, as this will prevent the update from working
- `npm update oversite`
- Restart dev server to see changes
