# @simple-presence/solid-js

SolidJS primitives for realtime presence counts.

## Install

```bash
npm install @simple-presence/solid-js
```

`solid-js` is a peer dependency and must be `>= 1.8`.

## Usage

```tsx
import { createPresenceCount } from "@simple-presence/solid-js";

function OnlineUsers() {
  const count = createPresenceCount(
    () => "landing-page",
    () => ({ appKey: "your-public-app-key" }),
  );

  return <span>{count()} users online</span>;
}
```

The signal returns `0` until the first presence update arrives.

## API

### `createPresenceCount(tag, options)`

```ts
function createPresenceCount(
  tag: () => string,
  options: () => {
    appKey: string;
    apiUrl?: string;
  },
): () => number;
```

Returns a signal with the current live count for that tag.

### `createPresence(tag, options)`

```ts
function createPresence(
  tag: () => string,
  options: () => {
    appKey: string;
    apiUrl?: string;
  },
): {
  count: () => number;
  history: () => CountSnapshot[];
  peak: () => number;
  peakAt: () => string | null;
  refresh: () => Promise<void>;
};
```

Returns signals for count, history snapshots (for sparklines), and peak concurrent users.
History is polled every 10 seconds.

| Return    | Type                    | Description                                     |
| --------- | ----------------------- | ----------------------------------------------- |
| `count`   | `() => number`          | Live count for the tag                          |
| `history` | `() => CountSnapshot[]` | Time-bucketed count snapshots (last 30 minutes) |
| `peak`    | `() => number`          | All-time peak concurrent users for the tag      |
| `peakAt`  | `() => string \| null`  | ISO timestamp when peak was reached             |
| `refresh` | `() => Promise<void>`   | Manually re-fetch history and stats             |

## Custom Backend URL

```tsx
const count = createPresenceCount(
  () => "landing-page",
  () => ({
    appKey: "your-public-app-key",
    apiUrl: "http://localhost:3000/api",
  }),
);
```

## Notes

- Use this in client-side SolidJS code (islands, client components).
- Arguments are accessor functions so the primitive stays reactive.
- The default hosted presence endpoint is `wss://simple-presence.erickr.dev/api/presence`.

## License

MIT
