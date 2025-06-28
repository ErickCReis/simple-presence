# @simple-presence/core

A lightweight JavaScript component for tracking user presence on any website.

## Features

- Real-time user presence tracking
- Automatic away detection based on page visibility
- Page change detection (SPA navigation support)
- Activity monitoring with heartbeat
- Debounced API calls to prevent spam
- TypeScript support

## Installation

```bash
npm install @simple-presence/core
```

## Quick Start

```html
<script src="https://unpkg.com/@simple-presence/core/dist/index.js"></script>
<script>
  const presence = SimplePresence.initPresence({
    appKey: "your-app-key",
    userId: "user-123",
    apiUrl: "https://api.simplepresence.com",
  });
</script>
```

## Usage with ES Modules

```javascript
import { initPresence } from "@simple-presence/core";

const presence = initPresence({
  appKey: "your-app-key",
  userId: "user-123",
  apiUrl: "https://api.simplepresence.com",
  heartbeatInterval: 30000, // 30 seconds
  debounceDelay: 1000, // 1 second
});

// Get current status
console.log("Current status:", presence.getStatus()); // "online" | "away" | "offline"
console.log("Current page:", presence.getPage());
console.log("Session ID:", presence.getSessionId());

// Clean up when done
presence.destroy();
```

## Configuration

| Option              | Type   | Default                          | Description                         |
| ------------------- | ------ | -------------------------------- | ----------------------------------- |
| `appKey`            | string | -                                | Your app's unique key               |
| `userId`            | string | -                                | Unique identifier for the user      |
| `apiUrl`            | string | `http://localhost:3000`          | API endpoint URL                    |
| `heartbeatInterval` | number | `30000`                          | How often to send heartbeat (ms)    |
| `debounceDelay`     | number | `1000`                           | Delay before sending API calls (ms) |

## API Structure

The library sends presence updates to your API endpoint with the following structure:

```json
{
  "input": {
    "userId": "user-123",
    "sessionId": "session_1234567890_abc123",
    "page": "/dashboard",
    "status": "online"
  }
}
```

### Headers
- `Content-Type: application/json`
- `X-App-Key: your-app-key`

## Status Types

- `online`: User is actively using the page
- `away`: User has switched to another tab/window (page is hidden)
- `offline`: User has been inactive for extended period (not implemented in current version)

## Features

### Automatic Status Detection
- **Page Visibility**: Automatically switches to "away" when user switches tabs/windows
- **Page Navigation**: Detects SPA navigation and resets status to "online"
- **Heartbeat**: Regular presence updates to keep session alive

### SPA Navigation Support
The library automatically detects page changes in Single Page Applications by:
- Listening to `popstate` events (browser back/forward)
- Intercepting `pushState` and `replaceState` calls
- Updating presence when navigation occurs

### Debounced API Calls
All presence updates are debounced to prevent excessive API calls when multiple events occur in quick succession.

## API Methods

### `getStatus()`
Returns the current user status: `"online" | "away" | "offline"`

### `getPage()`
Returns the current page path.

### `getSessionId()`
Returns the unique session identifier.

### `destroy()`
Cleans up event listeners, timers, and sends a final presence update.

## Development

The library is built with TypeScript and provides full type definitions.

```typescript
import { initPresence, PresenceConfig, SimplePresence } from "@simple-presence/core";

const config: PresenceConfig = {
  appKey: "your-app-key",
  userId: "user-123",
};

const presence: SimplePresence = initPresence(config);
```

## License

MIT
