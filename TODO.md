## Simple Presence – Prioritized TODO

A consolidated, prioritized list of problems and improvements across server, web, and packages.

### Top priority (Critical – fix first)

- [ ] Standardize Zod version and imports across the repo
  - Replace all `zod/v3` and `zod/v4` imports with `import { z } from "zod"`.
  - Ensure a single zod dependency (prefer v4) in all `package.json` where used.
  - Files:
    - `apps/server/src/routers/apps.ts`
    - `apps/web/src/routes/_login/sign-in.tsx`
    - `apps/web/src/routes/_login/sign-up.tsx`

- [ ] Fix WebSocket URL normalization in `@simple-presence/core`
  - If `apiUrl` begins with `http://` or `https://`, transform to `ws://` or `wss://` before connecting.
  - File: `packages/core/src/index.ts`

- [ ] Publish updated counts on disconnects in Presence DO
  - After `removeSession(ws)`, compute affected tag count and publish via the router publisher.
  - Files: `apps/server/src/durable-objects/presence/index.ts`, `apps/server/src/durable-objects/presence/router.ts`

- [ ] Replace hardcoded `sessionId` with real per-connection IDs in DO logs
  - Generate and store a unique `sessionId` per WebSocket; use it on connect/update/disconnect inserts.
  - File: `apps/server/src/durable-objects/presence/index.ts`

- [ ] Fix event listener cleanup in `@simple-presence/core`
  - Store the bound `visibilitychange` handler reference and remove that exact reference in `destroy()`.
  - File: `packages/core/src/index.ts`

- [ ] Add cancellation to `appsRouter.watch` polling loop
  - Break loop when `signal.aborted`; wire `AbortSignal` from the procedure handler.
  - File: `apps/server/src/routers/apps.ts`

- [ ] Remove hardcoded public app keys from the web app
  - Use environment variables for demo, or fetch the current user’s apps and select one in UI.
  - Files: `apps/web/src/routes/dashboard/route.tsx`, `apps/web/src/routes/_landing/-components/hero-demo.tsx`

### High priority (Important)

- [ ] Use proper fetch signature for Durable Object
  - Change `async fetch(request: Request)` (even if unused) for broader compatibility.
  - File: `apps/server/src/durable-objects/presence/index.ts`

- [ ] Decouple web from server source types
  - Create a shared API types package (e.g., `packages/api`) exporting router types and shared DTOs.
  - Update web imports to consume published types instead of `../../../../server/src/...`.
  - Files: `apps/web/src/lib/orpc.ts`, `apps/web/src/routes/dashboard/$appId.tsx`

- [ ] Make production Drizzle config portable
  - Replace user-specific path lookup with env-driven credentials (e.g., `CLOUDFLARE_ACCOUNT_ID`, `DB_ID`, `CLOUDFLARE_API_TOKEN`).
  - File: `apps/server/drizzle-prod.config.ts`

- [ ] Replace dashboard static totals with live data
  - Consume `apps.watch` to compute totals (e.g., sum of tag sessions, events length) and display instead of `0`.
  - File: `apps/web/src/routes/dashboard/index.tsx`

- [ ] Document and/or remove `presenceTag` table
  - Either implement aggregation updates and UI usage, or remove to avoid confusion.
  - File: `apps/server/src/durable-objects/presence/db/schema.ts`

### Medium priority (Robustness, Security, DX)

- [ ] Add reconnect with backoff and optional heartbeat/keepalive to `@simple-presence/core`
  - Reconnect on close/error with exponential backoff; optionally send periodic ping.
  - File: `packages/core/src/index.ts`

- [ ] Enforce allowed origins and handshake rules on presence connections
  - Validate origin/app key on `/presence/:appKey` and optionally block untrusted origins per app settings.
  - Files: `apps/server/src/index.ts`, `apps/server/src/app.ts`

- [ ] Use `X-App-Key` consistently or remove from CORS allowlist
  - If used for authentication, validate it on the DO entry; otherwise remove from allowed headers.
  - Files: `apps/server/src/app.ts`, `apps/server/src/index.ts`

- [ ] Improve observability
  - Add structured logs for WS lifecycle, publish attempts, reconnection attempts, and error paths.
  - Files: DO and server router handlers.

- [ ] Update READMEs to match actual API
  - `packages/core` README mentions `userId`, `heartbeatInterval`, `debounceDelay` that don’t exist; align docs to implemented API and options.
  - `packages/react` README usage should reflect actual hook signature with `tag`, `appKey`, and optional `apiUrl` object.

### Low priority (Polish and cleanup)

- [ ] Gate devtools in production builds
  - Hide React Query/TanStack Router devtools when `NODE_ENV==='production'`.
  - File: `apps/web/src/routes/__root.tsx`

- [ ] Remove unused constants
  - If `apps/server/src/lib/constant.ts` is unused, delete it or document usage.

- [ ] Align React peer/dev dependency versions
  - Ensure `packages/react` peers are compatible with React 19 and repo’s versions.

### Future enhancements (Nice-to-have)

- [ ] Replace server-side polling with push
  - Consider a push-based bridge from DO to server to web for `apps.watch`, removing the 1s polling loop.

- [ ] Aggregate analytics
  - Periodically compute and store peaks/aggregates into `presenceTag`; expose an analytics API and UI.

### Tooling and CI

- [ ] Add workspace-wide typecheck and CI
  - Scripts: `bun run -w typecheck`, `biome check`, and CI workflow to run on PRs.

- [ ] Add server build script
  - Ensure server can be typechecked/built locally; add to root `build` or separate `server:build` script.

### Notes

- After critical edits, run local builds for all workspaces and validate:
  - `bun run dev` in server and web
  - Presence demo on landing and dashboard
  - Auth flows (sign-in/sign-up) and ORPC calls
