# Client-specific frontend

This is a starter template to use `oversite` as a module

Install:

```bash
npm create vite@latest
npm install git@github.com:Hovercraft-Studio/oversite.git#main
npm run dev
```

In your Javascript, make sure to import the `oversite` components and any css/js that you want to use:

```javascript
import "oversite/src/components/_register-components.js";

import "oversite/shared/css/pico.css";
import "oversite/shared/css/styles.css";

import MobileUtil from "oversite/src/util/mobile-util.mjs";
import ErrorUtil from "oversite/src/util/error-util.mjs";
```

And at least add the <app-store-init> component for easy connection

```html
<app-store-init sender="custom-app" init-keys="*" debug side-debug></app-store-init>
```

Pull the latest from `oversite`:

- `npm update oversite`
- Restart dev server to see changes
- Make sure to delete package-lock.json, as this will prevent the update from working
