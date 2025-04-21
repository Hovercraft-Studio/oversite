To use AppStoreDistributed in a React app, you’ll need to add the AppStore-related web-components to your app, and to connect to a properly configured websocket server. (You can use the [`hc-socket-server`](https://github.com/Hovercraft-Studio/hc-socket-server) for this.)

## Add AppStoreDistributed to your project

- Copy this `/shared` folder into your project, or at least the `/shared/js` subfolder.
- **JS.** Add the `_register-components.js` file int a script tag in your index.html file.
- **Web Components.** Drop the `app-store-init` and optionally the `app-store-heartbeat` components into your index.html file, outside of the `#root` div (which gets replace with React content.) This initializes `AppStoreDistributed`, provides a debug interface, and shows the app as a client in the monitor:

```html
<head>
  <!-- ... -->
  <!-- path to your _register-components.js file, example: -->
  <script
    type="module"
    src="/src/components/_register-components.js"
  ></script>
</head>
<body>
  <app-store-init
    sender="schedule_display"
    init-keys="*"
    debug
    side-debug
  ></app-store-init>
  <app-store-heartbeat
    key="schedule_display_heartbeat"
    value="n/a"
    interval="5000"
    show="false"
  ></app-store-heartbeat>
  <div id="root"></div>
  <!-- React content will be injected within the #root div -->
  <script type="module" src="/src/display/main.jsx"></script>
  <!-- JS entry point for your React app -->
</body>
```

- The `app-store-init` component takes a few optional props:

  - `sender` — a string that identifies your app in the monitor. `use_lowercase_with_underscores` for consistency.
  - `init-keys` — a space-separated string list of the keys that you want to retrieve from the store upon connection. If set to `"*"`, it will initialize with all keys in the store. If not set it will initialize with no keys.
  - `debug` — if set, the component will show a debug interface in the browser.
  - `side-debug` — if set, the debug interface will be shown on the side of the screen instead of the bottom.

- The `app-store-heartbeat` component is optional and can be used to send a heartbeat message to the server at a regular interval. This can be useful for monitoring the health of your app. It takes a few arguments:

  - `key` — a string that identifies the heartbeat message in the store. `use_lowercase_with_underscores`, ending in `_heartbeat` for consistency.
  - `value` — leave as `"n/a"`.
  - `interval` — the time in milliseconds between heartbeat messages.
  - `show` — if set to `"true"`, the heartbeat message will display on screen.

- To subscribe to and set store values from a React component, use the `useAppStore` hook:

  ```javascript
  import { useAppStore } from "/shared/js/react/useAppStore";

  const MyComponent = () => {
    // a optional callback passed as the `onUpdate` option
    const onColorUpdate = (value) => {
      console.log("color updated:", value);
    };
    // the hook returns the value and a setter function
    const [color, setColor] = useAppStore("COLOR", {
      defaultValue: "red",
      onUpdate: onColorUpdate,
    });

    // you can trigger other logic here if you only need to do something when the value changes
    useEffect(() => {
      console.log("color changed:", color);
    }, [color]);

    return (
      <div style={{ backgroundColor: color }}>
        <button onClick={() => setColor("blue")}>Blue</button>
        <button onClick={() => setColor("purple")}>Purple</button>
        <button onClick={() => setColor("red")}>Red</button>
      </div>
    );
  };
  ```

- The `useAppStore` hook takes two arguments: `storeKey` (required) and an `options` object (optional).

  - `storeKey` is a string that identifies the value in the store. It is usually all caps (with underscores for spaces), like `"COLOR"` or `"TIME_LEFT"`.
  - The options object can include:
    - `defaultValue` — an initial value for this key in local state (not yet published to the store); will default to `null`.
    - `onUpdate` — a callback function that will be called whenever the store key is updated. See note below.
  - The hook will return an array with two values:
    - The first value is the current value of the store key. This will always be up-to-date with the value in the store.
    - The second value is a setter function for that store key value.

- The `onUpdate` option vs `useEffect`:
  - If you want to run some code any time the store value is updated, you can use the `onUpdate` option. This code will run every time the store key is updated, even if the value has not changed.
  - If you want to run some code only when the store value _changes_, you can use a `useEffect` hook with the value as a dependency as usual.

## Notes & Features

This project uses tools from [cacheflowe/haxademic.js](https://github.com/cacheflowe/haxademic.js):

- [SolidSocket](https://github.com/cacheflowe/haxademic.js/blob/master/src/solid-socket.es6.js) — establishes a connection to the websocket server; handles sending and recieving messages, reconnection, and cleanup; exposes listeners.

- [AppStore](https://github.com/cacheflowe/haxademic.js/blob/master/src/app-store-.es6.js) — a tool for app-wide state management, with optional localStorage integration.

- [AppStoreDistributed](https://github.com/cacheflowe/haxademic.js/blob/master/src/app-store-distributed.es6.js) — distributes the AppStore state across all clients connected over websockets, with optional client uuids.

The logic of [AppStoreDebug](https://github.com/cacheflowe/haxademic.js/blob/master/src/app-store-debug.es6.js) has been ported into the [AppStore React component](./src/components/debug/AppStore.jsx).

AppStore values are made accessible to React components with the [`useGetValue` hook](./hooks/useAppStore.js).

### Troubleshooting

If you run into an error involving `import("ws");`, comment out that line. The `ws` package is only needed for Node.js, and not needed for the browser.
