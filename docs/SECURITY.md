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
- Multi-tenant isolation (all channels share one server process)

## Planned Improvements

- WebSocket auth enforcement (validate `?auth=` against a server-known key)
- Auth token/session upgrade (replace username:password with token-based auth)
- Per-channel auth keys for the rooms concept

See [`docs/exec-plans/roadmap.md`](exec-plans/roadmap.md) for status.
