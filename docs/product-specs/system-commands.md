# System Commands

Remote system management for installation PCs, triggered from a web UI via AppStore messages over a WebSocket channel.

## What It Does

SystemCommands is a lightweight Node.js service that listens for AppStore key/value messages on a channel (typically `dashboard`) and executes OS-level commands on the local machine. It responds with success/failure on the same key with `_response` appended, routed back to the requesting client.

This enables basic remote management of installation PCs from the Dashboard or any connected web UI — kill stuck processes, send keystrokes, restart machines, and more.

## Deployment Modes

### 1. Standalone (any PC with Node 22+)

Run on any machine that needs remote management, even without the full Oversite server. Connects to a local or cloud Oversite server via AppStoreDistributed.

```bash
node examples/system-commands/index.mjs
node examples/system-commands/index.mjs --server ws://192.168.1.10:3003/ws
node examples/system-commands/index.mjs --server wss://oversite.example.com/ws --channel dashboard --sender pc-lobby-01 --auth my-auth-key
```

| Option | Default | Description |
|---|---|---|
| `--server` | `ws://127.0.0.1:3003/ws` | WebSocket URL of the Oversite server |
| `--channel` | `dashboard` | AppStore channel to join |
| `--sender` | hostname | Sender ID to identify this machine |
| `--auth` | none | Auth key for the channel |

The standalone runner also sends a heartbeat every 10 seconds so the Dashboard can show a live connection indicator for this client.

### 2. Embedded in server.mjs

Enable with a CLI flag or environment variable — disabled by default:

```bash
# CLI flag
node server.mjs --system-commands

# Or .env variable
SYSTEM_COMMANDS=true
```

When enabled, `server.mjs` dynamically imports the module and connects as an AppStore client on the `dashboard` channel:

```js
if (enableSystemCommands) {
  const sysStore = new AppStoreDistributed(`ws://127.0.0.1:${PORT}/ws`, "system_commands", "dashboard");
  const systemCommands = new SystemCommands(sysStore);
}
```

## Commands

Each command is a standard AppStore key/value pair — no structured JSON payloads. This follows the [data transmission best practices](app-store.md#data-transmission-best-practices): prefer individual keys over bundled objects.

| Key | Value | Description | Platform |
|---|---|---|---|
| `kill_process` | `"chrome.exe"` | Kill a process by name | All |
| `restart_computer` | `10` | Restart after N seconds (default 10, max 300) | All |
| `send_keys` | `"{F11}"` | Send keystrokes to the foreground window | Windows, Linux |
| `minimize_windows` | `true` or `"teamviewer\|anydesk"` | Minimize windows by title match | Windows |
| `list_processes` | `"chrome"` or `""` | List running processes, optionally filtered | All |

### Responses

Responses are sent on `{key}_response` as a plain string message, routed back to the original sender via the `receiver` field:

```
key: "kill_process_response"    value: "Killed process: chrome.exe"
key: "send_keys_response"       value: "Sent keys: {F11}"
```

### Custom Commands

Register additional handlers at runtime via `addCommand()`:

```js
const systemCommands = new SystemCommands(appStore, "pc-lobby-01");

// handler receives the raw AppStore value and must return { message: "..." }
systemCommands.addCommand("launch_slideshow", async (value) => {
  // custom logic here
  return { message: "Slideshow launched" };
});
```

This registers the listener and handler in one call. The new command is immediately available — send `key: "launch_slideshow"` from any client on the channel.

## Sending Commands from a Web UI

Any page connected to the same channel can send commands using `<app-store-button>`:

```html
<oversite-header id="sys_cmd_ui" channel="dashboard" auth="my-auth-key"></oversite-header>

<!-- Broadcast to all SystemCommands clients on the channel -->
<app-store-button key="kill_process" value="chrome.exe">Kill Chrome</app-store-button>

<!-- Target a specific machine -->
<app-store-button key="minimize_windows" value="teamviewer" receiver="pc-lobby-01">Minimize TV (Lobby)</app-store-button>
```

The `receiver` attribute on `<app-store-button>` sends the message to a specific client by sender ID, so commands can target individual PCs even when multiple SystemCommands instances share the same channel.

See [`examples/dashboard/js-frontend/`](../../examples/dashboard/js-frontend/) for a working test UI.

## Key Files

| File | Role |
|---|---|
| `src/server/system-commands.mjs` | Core SystemCommands class |
| `examples/system-commands/index.mjs` | Standalone runner |
| `examples/dashboard/js-frontend/index.html` | Test UI with command buttons |

## Security Considerations

- All command inputs are sanitized (regex allow-lists for process names, key strings, window patterns, script paths).
- `restart_computer` delay is clamped to 0–300 seconds.
- Commands execute with the permissions of the Node process. In production, run with minimal privileges.
- Auth keys on the WebSocket channel prevent unauthorized connections, but anyone on the channel can send commands. Consider limiting who can connect to the `dashboard` channel.
- The `send_keys` command sends keystrokes to the foreground window — this is inherently a power-user feature for managed kiosk PCs, not for general-purpose servers.

## Implementation Notes

- **PowerShell temp-file pattern**: The `minimize_windows` command writes a `.ps1` script to `os.tmpdir()` and runs it with `powershell -ExecutionPolicy Bypass -File`, then cleans up. This avoids PowerShell here-string quoting issues where the `'@` terminator must be at column 0 with no leading whitespace — impossible to guarantee inside a JS template literal. Other commands that need complex PowerShell scripts should follow the same pattern.
- **Platform detection**: `os.platform()` is checked at construction time. Commands that aren't available on the current platform throw descriptive errors (e.g., `minimize_windows` is Windows-only, `send_keys` supports Windows and Linux).
- **No util.mjs dependency**: `system-commands.mjs` deliberately avoids importing from `util.mjs` so it can work as a standalone file without the full server context.

## Future Plans

- **Dashboard integration**: App cards in `<dashboard-view>` should offer management buttons (kill process, restart, send keys) per PC, visible when a SystemCommands client is connected for that project.
- **Connection status**: A green dot on the Dashboard card indicating a live SystemCommands connection for that machine.
- **Process monitoring**: Periodic process list reporting so the Dashboard can detect stuck apps and offer a restart button.
- **Configurable command sets**: Per-deployment command lists so each installation only exposes the commands it needs.
