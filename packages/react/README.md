# @simple-presence/react

React hook for realtime presence counts.

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

| Argument | Type | Description |
| --- | --- | --- |
| `tag` | `string` | Logical bucket to track |
| `options.appKey` | `string` | Public app key from the Simple Presence dashboard |
| `options.apiUrl` | `string \| undefined` | Base API URL for a custom backend, such as `http://localhost:3000/api` |

Returns the current live count for that tag.

## Custom Backend URL

```tsx
const count = usePresenceCount("landing-page", {
  appKey: "your-public-app-key",
  apiUrl: "http://localhost:3000/api",
});
```

The hook creates an internal `SimplePresence` instance and cleans it up automatically when `tag`, `appKey`, `apiUrl`, or the component lifecycle changes.

## Notes

- Use this in client-side React code.
- The default hosted presence endpoint is `wss://simple-presence.erickr.dev/api/presence`.

## License

MIT
