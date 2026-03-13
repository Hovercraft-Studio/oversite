# Commands

All commands run from the repo root.

## Development

```bash
npm install          # install dependencies
npm run dev          # Vite dev server (:3002) + nodemon server (:3003) concurrently
```

- Vite serves frontend assets with HMR on `http://localhost:3002`
- Express + WebSocket server on `http://localhost:3003`
- Backend auto-restarts on changes to `src/server/` via nodemon

## Build & Production

```bash
npm run build        # Vite → dist/ (frontend only)
npm start            # serve dist/ from Express on :3003 (production mode)
```

In production, Express serves the Vite `dist/` as static files. Vite is not involved at runtime.

**DigitalOcean prebuild note**: `package.json` includes a prebuild step that installs a Linux-specific Rollup binary:
```bash
npm run prebuild     # runs automatically before `npm run build`
# "prebuild": "npm install @rollup/rollup-linux-x64-gnu --no-save || true"
```

## Legacy

```bash
npm run ws           # bare WebSocket relay only (ws-relay.mjs) — no Express, no dashboard
```

## Ports

| Port | What |
|---|---|
| `3002` | Vite dev server (dev only) |
| `3003` | Express HTTP API + WebSocket + static files (dev and prod) |

In production (cloud), `process.env.PORT` is used instead of 3003.

## WebSocket URLs

```
# local dev
ws://localhost:3003/ws?sender=tablet&channel=default

# production (DigitalOcean, TLS)
wss://your-app.ondigitalocean.app/ws?sender=tablet&channel=default
```

## Key Pages (dev)

| URL | What |
|---|---|
| `http://localhost:3002/` | Home / demo index |
| `http://localhost:3002/app-store-demo/` | AppStore component demo |
| `http://localhost:3002/app-store-monitor/` | Live state monitor |
| `http://localhost:3002/dashboard/` | Dashboard UI |

## Dependency Management

```bash
npm outdated                              # list outdated packages
npm update <pkg>                          # update one package
npx npm-check-updates -u && npm install  # update all packages in package.json
```

## npm Package Publishing

Make sure to switch to `main` branch and update the version in `package.json` before publishing.

```bash
npm version patch   # or minor / major — bumps version and tags
npm publish
```

To publish: switch to `main`, run publish, switch back to `dev`.

## Using Oversite as a Module in Another Project

```bash
npm update oversite   # pull latest after updates
```

See [`docs/references/deployment.md`](references/deployment.md) for full module usage details.
