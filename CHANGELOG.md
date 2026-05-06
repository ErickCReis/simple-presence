# Changelog

## 0.3.0

### Features

- **Count history** — The Durable Object now samples tag counts every 10 seconds and stores them in a `count_snapshot` table (retained for 30 minutes). Clients can fetch snapshots via the new `history` RPC endpoint. Ideal for sparkline charts.
- **Peak tracking** — All-time peak concurrent users per tag is tracked in the `presenceTag` table, updated on every presence change and during alarm cycles. Exposed via the new `stats` RPC endpoint.
- **`@simple-presence/solid-js`** — New SolidJS package with `createPresenceCount` (lean, count-only signal) and `createPresence` (count + history + peak signals with automatic polling).
- **`usePresence` React hook** — New hook in `@simple-presence/react` that returns `{ count, history, peak, peakAt, refresh }` for full presence state including history and peak stats.
- **Core SDK methods** — `SimplePresence.getHistory()` and `SimplePresence.getStats()` added to `@simple-presence/core` for fetching history snapshots and peak data over the existing WebSocket connection.

### New types

- `CountSnapshot` — `{ timestamp: string; sessions: number; online: number; away: number }`
- `TagPeak` — `{ peak: number; peakAt: string | null }`

### Server

- New `count_snapshot` table with `(tag, sessions, online, away, timestamp)` and composite index.
- DO alarm-based sampling: starts on first connection, stops when no connections remain.
- `presenceTag` table (existing schema) now wired up for peak tracking via `upsertPeak`.
- New presence contract endpoints: `history({ tag })` and `stats({ tag })`.

## 0.2.1

Patch release with minor fixes.

## 0.1.0-rc.1

Initial release candidate.

### Features

- Real-time user presence tracking via WebSocket
- `@simple-presence/core` - Framework-agnostic presence client
- `@simple-presence/react` - React hooks for presence tracking
- Hosted backend at `simple-presence.erickr.dev`
- Dashboard at `simple-presence.erickr.dev`

### SDK API

- `SimplePresence` class with `tag`, `appKey`, and optional `apiUrl`
- `initPresence()` async factory function
- `usePresenceCount(tag, options)` React hook
- `onCountChange` callback for live count updates
- Automatic visibility-based status (`online` / `away`)
- Default backend: `wss://simple-presence.erickr.dev/api/presence`
