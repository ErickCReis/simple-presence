# @simple-presence/react

React hooks for real-time user presence tracking.

## Install

```bash
npm install @simple-presence/react @simple-presence/core
```

## Usage

```tsx
import { usePresenceCount } from "@simple-presence/react";

function OnlineUsers() {
  const count = usePresenceCount("my-page", {
    appKey: "your-app-key",
  });

  return <span>{count} users online</span>;
}
```

## API

### `usePresenceCount(tag, options)`

Returns the current online count for the given tag.

| Param            | Type      | Description           |
| ---------------- | --------- | --------------------- |
| `tag`            | `string`  | The tag to track      |
| `options.appKey` | `string`  | Your app's public key |
| `options.apiUrl` | `string?` | Override the API URL  |

**Returns:** `number` — the current online count for the tag.

The hook manages the `SimplePresence` lifecycle automatically — it creates the instance on mount and destroys it on unmount.

## Override API URL

For local development or self-hosting:

```tsx
const count = usePresenceCount("my-page", {
  appKey: "your-app-key",
  apiUrl: "http://localhost:3000",
});
```

## Requirements

- React >= 18

## License

MIT
