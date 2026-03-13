# Product Sense

## Who Uses Oversite

**Primary users**: Creative technologists and developers at studios building site-specific interactive installations — museums, galleries, theme parks, branded experiences.

**Typical team**: 2–5 engineers who built the installation, may not be on-site after opening. They need remote visibility into whether their apps are running.

**Operators**: Venue staff or AV technicians who monitor the dashboard during the run of an exhibition, often non-technical. They need a clear "is it up or down" answer.

**Visitors**: Members of the public interacting with the installation. They may interact with Oversite-connected apps (touchscreens, tablets) without knowing it.

## Problems Solved

### 1. "Is the installation running right now?"

A PC in a venue closet runs a Java app, a TouchDesigner composition, and a Chrome kiosk. Without Oversite: you find out it's crashed when the venue calls you. With Oversite: the Dashboard shows last-seen timestamp, uptime, and a screenshot. Offline alerts fire to Slack within 20 minutes.

### 2. "How do I send a command from one app to another?"

A show controller tablet needs to trigger a scene change in TouchDesigner. Without Oversite: custom UDP/OSC wiring, brittle and hard to debug. With Oversite: both connect to the AppStore WebSocket server. The tablet sets `app_state = "gameplay"`, TouchDesigner receives the echo and reacts.

### 3. "How do I keep multiple machines in sync?"

A 5-screen installation needs every display to show the same state. With AppStore: all clients connect to one WebSocket channel. State changes broadcast to all; the bounce-back pattern ensures consistency even across reconnects.

### 4. "How do I build a show control UI quickly?"

Use `<app-store-button>`, `<app-store-slider>`, `<app-store-health>` — components that wire to AppStore keys with HTML attributes. No JavaScript required for simple UIs.

## Deployment Contexts

| Context | Description |
|---|---|
| **Local LAN** | Server runs on a backstage PC; all clients on the same network. Simplest setup. |
| **Cloud (DigitalOcean)** | Server deployed publicly; clients connect over the internet. Enables remote monitoring and visitor-facing features. |
| **Hybrid** | Cloud server for remote visibility; local clients connect over internet instead of LAN. Solves SSL issues on tablets. |

## Value Props

- **Zero infrastructure opinion** — one Node process, one port, deploy anywhere
- **Language-agnostic** — anything that speaks WebSocket + JSON can participate
- **Operator-friendly** — Dashboard gives non-technical staff clear status
- **Developer-friendly** — Monitor UI shows live state; no logging setup needed for debugging
- **Long-lived** — vanilla JS, minimal deps; code written today should still run in 5 years

## Known Limitations & Tradeoffs

- **Ephemeral cloud state** — `_tmp_data/` resets on redeploy; not suitable for durable user data
- **No horizontal scaling** — single-process WebSocket server; not designed for thousands of concurrent users
- **No end-to-end encryption** — WebSocket connections are plaintext on LAN, TLS on cloud (DigitalOcean handles it)
- **No WebSocket auth** — the `auth` querystring param is parsed but not yet enforced; the server is open to anyone who can reach it
- **SSL on local tablets is painful** — iOS/Android require `wss://` even on LAN; workaround is to use cloud deployment
