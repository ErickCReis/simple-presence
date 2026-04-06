# @simple-presence/core

Framework-agnostic browser client for realtime presence tracking.

## Install

```bash
npm install @simple-presence/core
```

## Usage

```js
import { SimplePresence } from "@simple-presence/core";

const presence = new SimplePresence({
  tag: "landing-page",
  appKey: "your-public-app-key",
  onCountChange: (count) => {
    document.getElementById("counter").textContent = `${count} online`;
  },
});

window.addEventListener("beforeunload", () => {
  void presence.destroy();
});
```

`SimplePresence` starts connecting as soon as you instantiate it. The initial count is `0` until the first subscription update arrives.

## API

### `new SimplePresence(config)`

```ts
type PresenceConfig = {
  tag: string;
  appKey: string;
  apiUrl?: string;
  onCountChange?: (count: number) => void;
};
```

| Option          | Type                      | Required | Description                                                            |
| --------------- | ------------------------- | -------- | ---------------------------------------------------------------------- |
| `tag`           | `string`                  | Yes      | Logical bucket to track, such as `"landing-page"` or `"docs"`          |
| `appKey`        | `string`                  | Yes      | Public app key from the Simple Presence dashboard                      |
| `apiUrl`        | `string`                  | No       | Base API URL for a custom backend, such as `http://localhost:3000/api` |
| `onCountChange` | `(count: number) => void` | No       | Called whenever the live count changes                                 |

When `apiUrl` is provided, the client converts `http://` to `ws://`, `https://` to `wss://`, and appends `/presence`.

### `initPresence(config)`

Async helper that returns `new SimplePresence(config)`. It throws if called outside the browser.

```ts
import { initPresence } from "@simple-presence/core";

const presence = await initPresence({
  tag: "landing-page",
  appKey: "your-public-app-key",
});
```

### Instance methods

- `getCount(): number` returns the most recent count
- `getStatus(): "online" | "away"` returns the current local presence state
- `getClientId(): string` returns the persisted browser client id
- `destroy(): Promise<void>` removes listeners and releases the shared connection

### Exported types

- `PresenceConfig`
- `PresenceData`

## Behavior

- Uses a websocket subscription to receive live counts.
- Sends `online` and `away` updates based on page visibility.
- Shares one underlying websocket per `(apiUrl, appKey, tag)` combination.
- Persists the client id in `localStorage` when available, then falls back to cookies or in-memory storage.

## Notes

- This package is intended for browser runtimes.
- The default hosted presence endpoint is `wss://simple-presence.erickr.dev/api/presence`.

## License

MIT
