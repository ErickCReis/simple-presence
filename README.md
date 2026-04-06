# Simple Presence

Real-time presence tracking for browser apps.

Simple Presence gives you live per-page or per-section counts with a small client SDK, a hosted dashboard, and a realtime backend.

## Packages

- [`@simple-presence/core`](./packages/core) for framework-agnostic browser apps
- [`@simple-presence/react`](./packages/react) for React apps

## Hosted Service

- Dashboard: [simple-presence.erickr.dev](https://simple-presence.erickr.dev)
- Hosted presence endpoint: `wss://simple-presence.erickr.dev/api/presence`

Create an app in the dashboard and use its public key as `appKey` in the SDKs.

## Quick Start

### React

```bash
npm install @simple-presence/react
```

```tsx
import { usePresenceCount } from "@simple-presence/react";

function OnlineUsers() {
  const count = usePresenceCount("landing-page", {
    appKey: "your-public-app-key",
  });

  return <span>{count} users online</span>;
}
```

### Vanilla JavaScript

```bash
npm install @simple-presence/core
```

```js
import { SimplePresence } from "@simple-presence/core";

const presence = new SimplePresence({
  tag: "landing-page",
  appKey: "your-public-app-key",
  onCountChange: (count) => {
    console.log("Users online:", count);
  },
});

window.addEventListener("beforeunload", () => {
  void presence.destroy();
});
```

## Custom Backend URL

By default the SDKs connect to the hosted service. For local development or self-hosting, pass your base API URL and the client will connect to the matching websocket presence endpoint.

```ts
new SimplePresence({
  tag: "landing-page",
  appKey: "your-public-app-key",
  apiUrl: "http://localhost:3000/api",
});
```

That produces a websocket connection to `ws://localhost:3000/api/presence`.

## How It Works

1. Create an app in the dashboard.
2. Copy its public key.
3. Track presence with a `tag` such as `"landing-page"` or `"pricing"`.
4. Receive live counts as users join, leave, or go away.

The core client also:

- marks users as `away` when the page becomes hidden and `online` when it becomes visible again
- reuses a single websocket connection for identical `(apiUrl, appKey, tag)` pairs
- keeps a stable browser client id in local storage, with cookie and in-memory fallbacks

## Monorepo

```text
apps/
  server/     Cloudflare Worker + Durable Objects backend
  web/        Dashboard and marketing site
packages/
  config/     Shared configuration
  contracts/  Shared contracts and schemas
  core/       Framework-agnostic SDK
  react/      React hooks
```

## Local Development

This repo uses Bun workspaces.

```bash
bun install
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
bun run dev
```

Defaults from the examples:

- web app: `http://localhost:3001`
- server API: `http://localhost:3000/api`

## License

MIT
