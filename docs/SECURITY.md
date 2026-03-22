# Security

Oversite's security model is intentionally minimal — designed for controlled venue environments, not public consumer applications.

## Authentication

### HTTP / Web UI Auth

Username/password auth backed by `.env`. Credentials are set server-side; there is no user registration flow.

```bash
AUTH_USERS=admin:password,operator:password2
```

- `AuthApi` (`src/server/auth-api.mjs`) handles login/logout and session state
- Sessions are stored server-side (cookie-based, not JWT)
- `<auth-redirect>` web component gates pages client-side; redirects to `/login/` if not authenticated
- `<auth-logout-button>` clears the session

**`VITE_FORCE_LOCAL_AUTH`**: When `true`, forces the auth flow even on localhost. Useful for testing auth behavior in dev. On DigitalOcean App Platform, production mode is always active.

### WebSocket Auth

**Currently not enforced.** The `auth` querystring parameter (`?auth=key`) is parsed by the server and passed to `AppStoreDistributed`, but no validation is performed on the server side. Any client that can reach the server can connect.

This is a known gap — see [`docs/exec-plans/tech-debt-tracker.md`](exec-plans/tech-debt-tracker.md).

## CORS

CORS is configured with maximum permissiveness — all origins, methods, and headers are allowed:

```js
res.header("Access-Control-Allow-Origin", "*");
```

This is intentional for installation environments where client origins vary (local IPs, cloud domains, embedded webviews). Do not tighten CORS without testing all client types.

## Dashboard Check-in Endpoint

`POST /api/dashboard` is **unauthenticated** — any HTTP client can post check-in data. This is intentional (deployed apps post from anywhere), but means anyone who knows the URL can write to the dashboard.

## Data Privacy

- No user data is collected or stored
- Dashboard check-ins may contain screenshots of the installation's screen content (not visitor-facing cameras)
- `AUTH_USERS` credentials are stored in `.env` in plaintext — do not commit `.env` to version control

## Secrets Management

- `.env` is gitignored — never commit it
- On DigitalOcean, set environment variables in the App Platform dashboard
- `ALERT_SLACK_HOOK_URL` is a sensitive webhook URL — treat it as a secret

## Threat Model

Oversite is designed for **trusted network environments**:

- **LAN deployment**: only devices on the venue network can connect
- **Cloud deployment**: the server is public, but installation clients are trusted operators

It is **not** designed for:
- Untrusted public users sending arbitrary AppStore messages
- High-security environments requiring encryption at rest or audit logging
- Multi-tenant isolation (channels share one server process, but have separate persistent state)

## Channels & Deployment Patterns

Channels segment WebSocket traffic into isolated message streams. Each channel gets its own persistent state file (`state-{channelId}.json`). Choosing the right channel for each use case is the first layer of traffic isolation.

### `default` — Local site-specific installations

Use the default channel for on-site installations where all devices are on the same LAN: kiosk PCs, tablets, sensors, show-control systems. This is the standard mode and requires no special configuration.

### `dashboard` — Remote monitoring & management

Use the `dashboard` channel for Dashboard check-in traffic, SystemCommands remote management, and any cross-site operational tooling. This separates operational messages from the installation's real-time state traffic.

### Custom channels — Public-facing or multi-app

For deployments where a public-facing web UI connects to the same server (e.g., an audience participation app), create a dedicated channel to segment that traffic from internal operations. This prevents public clients from seeing or interfering with operational state on `default` or `dashboard`.

```bash
ALLOWED_WS_CHANNELS=default,dashboard,audience_app
```

### Security considerations for public-facing channels

When any channel is exposed to untrusted clients (public websites, audience devices):

- **WebSocket auth is not yet enforced.** The `auth` querystring param is parsed but not validated. Anyone who can reach the server can connect to any allowed channel. This is the most critical gap for public-facing use.
- **Channel names are discoverable.** `/api/state/channels` lists all active channels. Consider restricting or removing this endpoint in production if channel names should not be public.
- **State endpoints are unauthenticated.** `/api/state/all?channel=X` returns the full persistent state for any channel. Restrict or proxy these endpoints if state should not be publicly readable.
- **Message content is visible.** All clients on a channel see all broadcast messages. Do not send secrets, tokens, or PII through AppStore messages on public channels.
- **WebSocket URL leaks server address.** The `#wsURL=` hash param and browser DevTools expose the WebSocket server address. For public-facing deploys, serve through a reverse proxy so the raw server address is not exposed.
- **No rate limiting.** There is no rate limit on WebSocket messages or REST endpoints. A malicious client could flood a channel. Consider adding rate limiting at the reverse proxy layer for public deployments.

### Hardening checklist for public-facing deployments

1. Enforce WebSocket auth — validate `?auth=` against a server-known key per channel
2. Restrict `/api/state/channels` and `/api/state/all` behind auth or a reverse proxy
3. Use `wss://` (TLS) — never expose `ws://` to the public internet
4. Run behind a reverse proxy (nginx, Cloudflare) that handles TLS termination and rate limiting
5. Use `ALLOWED_WS_CHANNELS` to explicitly list permitted channels — do not leave it open
6. Audit what data flows through public channels — no secrets, no PII, no operational commands

## Planned Improvements

- **WebSocket auth enforcement** — validate `?auth=` against a server-known key per channel. This is the highest-priority security item and blocks any public-facing deployment.
- Auth token/session upgrade (replace username:password with token-based auth)
- Per-channel auth keys for the rooms concept
- Rate limiting on WebSocket messages and REST endpoints
- Option to restrict `/api/state/channels` and `/api/state/all` behind auth

See [`docs/exec-plans/roadmap.md`](exec-plans/roadmap.md) for status.
