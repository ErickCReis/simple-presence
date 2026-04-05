# Simple Presence

Real-time user presence tracking for any JavaScript application.

**SDK Packages:**

- [`@simple-presence/core`](./packages/core) - Framework-agnostic presence client
- [`@simple-presence/react`](./packages/react) - React hooks for presence tracking

**Hosted Service:**

- Dashboard: [simple-presence.erickr.dev](https://simple-presence.erickr.dev)
- API/WebSocket: `api.simple-presence.erickr.dev`

## Quick Start

### React

```tsx
import { usePresenceCount } from "@simple-presence/react";

function OnlineUsers() {
  const count = usePresenceCount("my-page", {
    appKey: "your-app-key",
  });

  return <span>{count} users online</span>;
}
```

### Vanilla JS

```js
import { SimplePresence } from "@simple-presence/core";

const presence = new SimplePresence({
  tag: "my-page",
  appKey: "your-app-key",
  onCountChange: (count) => {
    console.log("Online users:", count);
  },
});

// Clean up when done
presence.destroy();
```

## How It Works

1. **Create an app** at [simple-presence.erickr.dev](https://simple-presence.erickr.dev) and copy your app key.
2. **Install the SDK** in your project.
3. **Track presence** by tag — each tag represents a page or section.
4. **Get live counts** via WebSocket callbacks.

The SDK defaults to the hosted backend. For local development or self-hosting, pass `apiUrl`:

```js
new SimplePresence({
  tag: "my-page",
  appKey: "your-app-key",
  apiUrl: "http://localhost:3000",
});
```

## Monorepo Structure

```
apps/
  server/   - Cloudflare Worker (Hono + oRPC + Durable Objects)
  web/      - Dashboard (TanStack Start + React)
packages/
  contracts/ - Shared schemas and wire contracts (private)
  config/    - Shared constants (private)
  core/      - @simple-presence/core
  react/     - @simple-presence/react
```

## Development

```bash
bun install
bun run dev
```

## License

MIT
