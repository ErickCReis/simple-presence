# @simple-presence/react

React hook for Simple Presence - User presence tracking.

## Installation

```bash
npm install @simple-presence/react @simple-presence/core
```

## Usage

### usePresenceCount Hook

A simple hook that tracks and returns the current online count:

```tsx
import { usePresenceCount } from '@simple-presence/react';

function OnlineCount() {
  const count = usePresenceCount('your-app-key');

  return <span>{count} users online</span>;
}
```

With custom API URL:

```tsx
function OnlineCount() {
  const count = usePresenceCount('your-app-key', 'https://your-api-url.com');

  return <span>{count} users online</span>;
}
```

## API Reference

### usePresenceCount(appKey, apiUrl?)

**Parameters:**
- `appKey` (string): Required app key for presence tracking
- `apiUrl` (string, optional): API URL override

**Returns:**
- `count` (number): Current online count

## Features

- **Automatic page tracking**: Detects page changes automatically
- **Visibility detection**: Tracks when user switches tabs or windows
- **Heartbeat system**: Maintains presence with periodic updates
- **Debounced updates**: Prevents excessive API calls
- **React lifecycle integration**: Properly cleans up on unmount
- **TypeScript support**: Full type safety

## Dependencies

- React 18+
- @simple-presence/core 