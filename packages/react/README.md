# @simple-presence/react

React hooks for realtime presence tracking.

## Install

```bash
npm install @simple-presence/react
```

`react` is a peer dependency and must be `>= 18`.

## Usage

```tsx
import { usePresenceCount } from "@simple-presence/react";

function OnlineUsers() {
  const count = usePresenceCount("landing-page", {
    appKey: "your-public-app-key",
  });

  return <span>{count} users online</span>;
}
```

The hook returns `0` until the first presence update arrives.

## API

### `usePresenceCount(tag, options)`

```ts
function usePresenceCount(
  tag: string,
  options: {
    appKey: string;
    apiUrl?: string;
  },
): number;
```

| Argument         | Type                  | Description                                                            |
| ---------------- | --------------------- | ---------------------------------------------------------------------- |
| `tag`            | `string`              | Logical bucket to track                                                |
| `options.appKey` | `string`              | Public app key from the Simple Presence dashboard                      |
| `options.apiUrl` | `string \| undefined` | Base API URL for a custom backend, such as `http://localhost:3000/api` |

Returns the current live count for that tag.

### `usePresence(tag, options)`

```ts
function usePresence(
  tag: string,
  options: {
    appKey: string;
    apiUrl?: string;
  },
): {
  count: number;
  history: CountSnapshot[];
  peak: number;
  peakAt: string | null;
  refresh: () => Promise<void>;
};
```

Returns live count, count history snapshots, and peak concurrent users. History is polled every 10 seconds.

| Return    | Type                  | Description                                     |
| --------- | --------------------- | ----------------------------------------------- |
| `count`   | `number`              | Live count for the tag                          |
| `history` | `CountSnapshot[]`     | Time-bucketed count snapshots (last 30 minutes) |
| `peak`    | `number`              | All-time peak concurrent users for the tag      |
| `peakAt`  | `string \| null`      | ISO timestamp when peak was reached             |
| `refresh` | `() => Promise<void>` | Manually re-fetch history and stats             |

```tsx
import { usePresence } from "@simple-presence/react";

function PresencePanel() {
  const { count, history, peak } = usePresence("landing-page", {
    appKey: "your-public-app-key",
  });

  return (
    <div>
      <span>{count} online</span>
      <span>Peak: {peak}</span>
      {/* history is CountSnapshot[] — use for sparklines */}
    </div>
  );
}
```

## Custom Backend URL

```tsx
const count = usePresenceCount("landing-page", {
  appKey: "your-public-app-key",
  apiUrl: "http://localhost:3000/api",
});
```

Both hooks create an internal `SimplePresence` instance and clean it up automatically when `tag`, `appKey`, `apiUrl`, or the component lifecycle changes.

## Exported Types

- `PresenceState` — return type of `usePresence`
- `CountSnapshot` — `{ timestamp: string; sessions: number; online: number; away: number }`
- `TagPeak` — `{ peak: number; peakAt: string | null }`

## Notes

- Use these hooks in client-side React code.
- The default hosted presence endpoint is `wss://simple-presence.erickr.dev/api/presence`.

## License

MIT
