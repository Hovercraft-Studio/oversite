# Dashboard System

The Dashboard is Oversite's internal monitoring tool for tracking the health of deployed applications. It answers the question: **"Is this installation up and running right now?"**

Apps post periodic check-ins to the Dashboard server. The Dashboard web UI displays all known apps, their last-seen time, their current screenshot, and any custom status data they include.

## Architecture

```
Deployed App (client)
       |
  DashboardPoster (posts JSON on interval)
       |
  [Dashboard API - dashboard-api.mjs]
  POST /api/dashboard
       |
  _tmp_data/dashboard/projects.json + images/
       |
  Dashboard Web UI ← GET /api/dashboard/json
       |
  OfflineAlerts ← polls in-memory data, fires Slack webhook when stale or recovered
```

## Key Files

| File | Role |
|---|---|
| `src/server/dashboard-api.mjs` | REST API: store/retrieve check-ins and screenshots |
| `src/server/offline-alerts.mjs` | Polls dashboard data; Slack webhook when app goes offline or comes back online |
| `src/dashboard/dashboard-poster.mjs` | Client utility: sends check-ins from any JS context (browser or Node) |
| `src/components/dashboard/dashboard-view.js` | Web component: full dashboard UI |
| `dashboard/index.html` | Dashboard page (served by the Oversite server) |
| `dashboard/js/app.js` | Dashboard page application logic |
| `examples/dashboard/desktop-electron/` | Electron desktop app (with native screenshot via `screenshot-desktop`) |

## Client: DashboardPoster

`DashboardPoster` is isomorphic — it works in both browser and Node.js contexts. It posts check-in data as JSON on a configurable interval.

### Constructor

```js
import DashboardPoster from 'oversite/src/dashboard/dashboard-poster.mjs';

const poster = new DashboardPoster(
  'https://oversite.example.com/api/dashboard', // POST URL (full path to the dashboard route)
  'my-installation',                            // appId — unique string ID for this app
  'My Installation — NYC',                      // appTitle — human-readable display name
  10 * 60 * 1000                                // interval in ms (default: 10 minutes)
);
// Posts immediately on construction, then on the interval
```

### Check-in Payload

The poster builds and sends this JSON on each interval:

```json
{
  "appId": "my-installation",
  "appTitle": "My Installation — NYC",
  "uptime": 3600,
  "resolution": "1920x1080",
  "frameCount": 216000,
  "frameRate": 60,
  "imageScreenshot": "<base64 PNG string>",
  "imageExtra": "<base64 PNG string>"
}
```

| Field | Description |
|---|---|
| `appId` | Required by the server. Unique identifier for this app. |
| `appTitle` | Human-readable display name shown in the dashboard UI. |
| `uptime` | Seconds since `DashboardPoster` was constructed. |
| `resolution` | Browser: `"WxH"` from `window.innerWidth/Height`. Node: `"headless"`. |
| `frameCount` / `frameRate` | Browser only: tracked via `requestAnimationFrame`. |
| `imageScreenshot` | Base64 PNG. In browser: pass a canvas via `setImageScreenshot(canvas)`. In Node: captured automatically via `screenshot-desktop`. |
| `imageExtra` | Base64 PNG for a second optional image. Pass a canvas via `setImageCustom(canvas)`. |

Images are sent as base64 strings in the JSON body (not multipart/form-data). To keep payloads manageable, images are sent on alternating intervals — `imageExtra` every 3rd post, `imageScreenshot` every 3rd post offset by 1.

### Adding Custom Data

```js
poster.setCustomProp('scene', 'intro');
poster.setCustomProp('visitors', 42);
// Custom props are merged into the next check-in and then reset
```

### Screenshot Behavior

**In the browser**: Set a canvas element reference; it's converted to base64 on the next post.
```js
poster.setImageScreenshot(myCanvasElement);
poster.setImageCustom(mySecondCanvas);
```

**In Node.js**: `DashboardPoster` automatically takes a desktop screenshot every 15 minutes using the `screenshot-desktop` npm package and includes it in the next post. No setup needed.

### Other Methods

```js
poster.successCallback((responseData) => { /* called after successful post */ });
poster.dispose(); // clear the interval
```

## Server: Dashboard API (`dashboard-api.mjs`)

Stores check-in data and images to disk under `_tmp_data/dashboard/`. All data is kept in a single `projects.json` file. Images are saved to `_tmp_data/dashboard/images/`.

### REST Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/dashboard` | Receive a check-in (JSON body; `appId` field required) |
| `POST` | `/` | Alternative check-in route for legacy clients |
| `GET` | `/api/dashboard/json` | All projects with their latest check-in data |
| `GET` | `/api/dashboard/json/:appId` | Check-in data for a specific project |
| `GET` | `/api/dashboard/delete/:appId` | Delete a project's check-in data and images |
| `GET` | `/api/dashboard/images/...` | Serves saved screenshot images statically |

### Check-in Processing

On each received check-in the server:
1. Adds a `lastSeen` timestamp (Unix seconds)
2. Decodes base64 image fields and saves them as PNG files; replaces the field with the image URL
3. Merges the new data into the existing entry for that `appId`
4. Appends to a `history` array (max 100 entries per project); oldest entries and their images are pruned

### Data File

`_tmp_data/dashboard/projects.json` — structure:
```json
{
  "checkins": {
    "my-installation": {
      "appId": "my-installation",
      "appTitle": "My Installation — NYC",
      "lastSeen": 1705312200,
      "uptime": 3600,
      "imageScreenshot": "/api/dashboard/images/my-installation-...-screenshot.png",
      "history": [ ... ]
    }
  }
}
```

## Server: Offline Alerts (`offline-alerts.mjs`)

Polls the dashboard data every 60 seconds and fires a Slack webhook when a monitored project hasn't checked in for more than 20 minutes. Also sends a recovery alert when a project comes back online.

### Configuration

```bash
ALERT_PROJECT_IDS=installation-nyc,installation-la   # comma-separated project IDs to monitor
ALERT_SLACK_HOOK_URL=https://hooks.slack.com/services/...
```

Only projects in `ALERT_PROJECT_IDS` trigger alerts. Both OFFLINE and back-ONLINE events send a Slack message.

## Dashboard Web UI

The dashboard UI at `/dashboard/` fetches from `/api/dashboard/json` and renders a card for each project. Each card shows:

- Project title and ID
- Last check-in time and elapsed time
- Online/offline status
- Screenshots (if available)
- Custom data fields

The dashboard requires authentication (configured via `AUTH_USERS` in `.env`).

### `dashboard-view` Component

`src/components/dashboard/dashboard-view.js` renders the full dashboard UI (~640 lines). It is a candidate for decomposition into smaller components. See [roadmap](./roadmap.md).

## Electron Desktop Client

`examples/dashboard/desktop-electron/` is a full Electron application that loads a local web app and posts check-ins (with screenshots) to the Dashboard on an interval.

Build with `npm run make` (uses Electron Forge + Vite).

## Planned: AppStore ↔ Dashboard Integration

A planned feature would allow apps to post check-ins via AppStore WebSocket messages (using `receiver: "dashboard"`) instead of a separate HTTP POST. This would unify the two systems and enable real-time connection status tracking. See [roadmap](./roadmap.md).
