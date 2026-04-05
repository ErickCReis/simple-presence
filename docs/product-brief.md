## Simple Presence — Product Brief

### Main context
- **What**: SDK + hosted backend for real-time user presence (who is online, per tag/page), built on Cloudflare Durable Objects and exposed via a tiny client (`@simple-presence/core`) and a React hook (`@simple-presence/react`).
- **Who**: Frontend developers and small teams who want presence features without building infra (dashboards, blogs/docs, SaaS apps, communities, live apps).
- **Why**: Add presence in minutes with a reliable serverless backend, without standing up websockets, state fan-out, and metering.
- **How (architecture)**:
  - Backend: Hono + oRPC + Cloudflare Durable Objects (per-app DO, tag-scoped session sets, event log via Drizzle durable-sqlite).
  - Frontend: TanStack Start + React, dashboard for app management and live analytics.
  - Packages: `@simple-presence/core` (browser SDK over websocket + oRPC), `@simple-presence/react` (hook), `@simple-presence/config` (plan limits).

### Current status
- **Implemented**
  - App management (create/list/update/delete) with auth (email+password via Better Auth).
  - Presence DO: connects websocket per appKey, tracks sessions per `tag`, publishes live counts, writes timeseries `presence_event` records, and exposes `getStats()`/`getEvents()` for the dashboard.
  - Free plan enforcement: limits on apps/user, tags/app, concurrent connections/app.
  - Dashboard: create apps, copy public keys, view live tag counts and recent events.
  - Client libraries: core SDK (websocket + visibility-based status) and React `usePresenceCount`.
- **Gaps / inconsistencies**
  - Core README mentions heartbeat, page navigation, debounce, `userId`, and `offline` that are not implemented in current SDK; visibility change is implemented.
  - Pricing copy mismatch: landing card says “2 Applications”, config allows 3 apps.
  - No billing/subscription system; paid plans are not implemented (copy says “coming soon”).
  - Aggregated analytics table exists but not surfaced beyond basic counts; no retention/DAU/MAU or tag-level trends UI.
  - No rate limiting/abuse protection beyond free plan limits and appKey lookup.
  - Observability/monitoring not wired (no alerting on DO failures, no Sentry/Logs dashboard).

### Improvements (near-term)
- **SDK**
  - Add heartbeat ping + inactivity timeout to derive `offline` after X seconds without visibility/activity.
  - Add SPA navigation detection (popstate + pushState/replaceState) and debounce presence updates.
  - Expose `sessionId` and optional `userId` (without PII) to enrich `presence_event`.
  - Robust reconnect/backoff + initial count sync on reconnect.
- **Server / DO**
  - Periodic cleanup of stale sessions (defensive against unclosed sockets).
  - Surface per-tag peak concurrency and simple aggregates (store/update `presence_tag`; scheduled compaction).
  - Enforce event write quotas per plan (events/month) in addition to concurrency limits.
- **Product / UX**
  - Align copy: Free plan = 3 apps, 10 tags/app, 100 concurrent connections.
  - Add “Install” page per app with copy-paste snippets for vanilla JS and React.
  - Add small embeddable widget example (“N users online”).
- **Docs & DX**
  - Update `@simple-presence/core` README to match implemented API; separate “Planned” vs “Available now”.
  - Provide examples repo: Next.js/TanStack/Vue vanilla.
- **Security/operability**
  - Add Sentry (client + worker), structured logs, health checks, and rate limits per IP/app.

### Roadmap
- **v0.1 (Week 1)**: Copy alignment, SDK/docs accuracy, basic heartbeat + offline, stale session cleanup, install snippets, demo page.
- **v0.2 (Week 2)**: Paid plans MVP (Stripe), plan/limits in DB, server checks use plan-based limits, pricing page, upgrade flow.
- **v0.3 (Weeks 3–4)**: Aggregated analytics (per tag/app), peaks and trends, export CSV, public embeddable online-count widget.
- **v0.4 (Month 2)**: SDK quality (navigation detection, debounce, reconnect), examples repo, guides, monitoring + alerts.
- **v0.5 (Month 3)**: Team features (collab cursors API primitives), Webhooks, EU region, usage-based metering.

### Quick wins (1–2 days)
- Fix landing free-plan numbers to match config (3 apps).
- Update core/React READMEs to reflect currently shipped API and add concise install snippets.
- Add per-app “Install” page with ready-to-copy code (vanilla/React) and live test widget.
- Show live “current online” count for demo app on landing hero; add social proof.
- Add basic rate limiting per IP/appKey on `/presence/:appKey` and minimal abuse detection.

### Better ways to start making money
- **Launch a simple paid plan now**
  - Plans: Free (existing limits), Pro ($9/mo: 10 apps, 100 tags, 1,000 concurrent), Growth ($29/mo: 25 apps, 250 tags, 5,000 concurrent), Business (contact, SSO/regions).
  - Meters: concurrent connections, tags/app, and events/month; enforce at DO and write layer.
- **Stripe MVP (1 week)**
  - Add `plans`, `subscriptions` tables; attach plan to user; middleware reads plan and passes limits to DO.
  - Billing portal + webhooks (subscription updated/canceled) to flip plan and limits.
  - Pricing page + upgrade CTA in dashboard when nearing limits.
- **Faster cash options (no-code)**
  - Early adopter lifetime deal (Gumroad/Stripe) with manual plan flagging.
  - Agency bundle (unlimited apps up to X concurrency) as annual license.
- **Distribution**
  - Publish to npm with concise README; GH README with demo GIF.
  - Ship templates (Next/TanStack) with a “one-liner presence” integration.



