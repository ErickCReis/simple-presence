# @simple-presence/core

Framework-agnostic real-time user presence tracking.

## Install

```bash
npm install @simple-presence/core
```

## Usage

```js
import { SimplePresence } from "@simple-presence/core";

const presence = new SimplePresence({
  tag: "my-page",
  appKey: "your-app-key",
  onCountChange: (count) => {
    document.getElementById("counter").textContent = `${count} online`;
  },
});

// Clean up when done
await presence.destroy();
```

## API

### `new SimplePresence(config)`

| Option          | Type                      | Required | Description                                       |
| --------------- | ------------------------- | -------- | ------------------------------------------------- |
| `tag`           | `string`                  | Yes      | The tag (page/section) to track                   |
| `appKey`        | `string`                  | Yes      | Your app's public key                             |
| `apiUrl`        | `string`                  | No       | Override the API URL (defaults to hosted service) |
| `onCountChange` | `(count: number) => void` | No       | Called when the online count changes              |

### `initPresence(config)`

Async factory that creates a `SimplePresence` instance. Only works in browser environments.

### Instance Methods

- `getCount()` - Returns the current online count
- `getStatus()` - Returns `"online"` or `"away"`
- `getClientId()` - Returns the persistent client identifier
- `destroy()` - Cleans up the connection and event listeners

## Behavior

- Connects via WebSocket to the presence backend.
- Automatically tracks `online` / `away` status based on page visibility.
- Shares connections across multiple instances with the same `(appKey, tag)`.
- Persists a stable client ID in localStorage (falls back to cookie or in-memory).

## License

MIT
