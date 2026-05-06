# RC1 Plan: Simple Presence

## Summary

- Ship the first public release candidate as a small, solid `0.1.x` beta with two public packages, one hosted web dashboard, and one hosted API.
- Treat type safety as a hard requirement, not a best-effort goal. The central architectural change is to remove all cross-app relative type imports and replace them with a private workspace contracts package.
- Keep the RC intentionally narrow: real-time presence tracking, authenticated dashboard, app creation/list/detail, and a stable SDK surface. Do not expand to heartbeat/offline/page tracking for this RC.
- Use `simple-presence.erickr.dev` for the web app and `api.simple-presence.erickr.dev` for API/auth/WebSocket traffic.
- Use production-only CI deploys for the apps, and a controlled RC publish workflow for the SDK packages.

## RC Definition

- Public packages:
  - `@simple-presence/core`
  - `@simple-presence/react`
- Internal shared package:
  - `@simple-presence/contracts`
  - `private: true`
  - never published to npm in RC1
- Hosted surfaces:
  - Web app at `https://simple-presence.erickr.dev`
  - API and WebSocket service at `https://api.simple-presence.erickr.dev`
- Release channel:
  - fixed-version RC release for both public packages
  - first target version: `0.1.0-rc.1`
  - publish with npm dist-tag `rc`, not `latest`

## In Scope

- Stabilize the monorepo install/build/typecheck flow.
- Upgrade and normalize dependencies/tooling to a deterministic RC baseline.
- Extract server/client shared contracts into a private workspace package.
- Remove all direct type imports from `apps/server` into `apps/web` and `packages/*`.
- Harden the server, web app, and SDKs enough for a public RC.
- Add CI, production deploy automation, and controlled package publishing.
- Rewrite docs so every README matches the actual shipped behavior.
- Add a minimum test matrix covering types, contracts, server logic, and publish artifacts.

## Out of Scope

- Offline detection, heartbeat, SPA route tracking, and inactivity analytics promised in the old SDK README.
- PR preview environments for this RC.
- A public `@simple-presence/contracts` package.
- Billing, quotas, pricing enforcement, or paid plans.
- Social auth providers.
- OpenAPI-first public API SDK generation.
- Large UI redesigns beyond fixing broken or misleading flows.

## Chosen Type-Sharing Architecture

- Create `packages/contracts` as the single source of truth for wire contracts and shared DTO schemas.
- Use oRPC contract-first patterns there, not server-runtime types.
- Put these items in `packages/contracts`:
  - shared Zod 4 schemas
  - HTTP RPC contracts for dashboard/admin operations
  - WebSocket RPC contracts for presence operations
  - JSON-safe DTO types for all cross-boundary data
- Keep server context, auth middleware, database code, and handler logic out of `packages/contracts`.
- In `apps/server`, implement contracts with oRPC server-side handlers.
- In `apps/web`, type the client from the shared contract package.
- In `@simple-presence/core`, use contract-derived types only and avoid any runtime dependency on `apps/server`.
- Do not use generated `.d.ts` artifacts from the server as the type-sharing mechanism.
- Do not keep the current relative imports from `apps/server/src/**`; those are explicitly banned after RC1.

## Why This Architecture

- It preserves end-to-end type safety while restoring package isolation.
- It makes the SDKs publishable because they no longer depend on app-source internals.
- It supports future codegen or public-contract publication later without locking RC1 into that surface now.
- It aligns with oRPC’s official contract-first and contract implementation model rather than a monorepo-only shortcut.

## Type-Sharing Options Explored

- Chosen:
  - private `packages/contracts` with oRPC contract-first definitions and shared DTO schemas
- Rejected:
  - direct imports from `apps/server`
  - reason: breaks publishability, ties clients to server file layout, and leaks server internals
- Rejected:
  - generated declaration-only package from server output
  - reason: declarations drift more easily, runtime contracts remain implicit, and WebSocket/iterator types become harder to reason about
- Rejected for RC1:
  - public `@simple-presence/contracts`
  - reason: expands the external API surface before the protocol is stable enough

## Data Contract Rules

- All shared RPC and WebSocket DTOs must be JSON-safe.
- Do not expose `Date` instances in public contracts.
- Convert all timestamps crossing process or network boundaries to ISO 8601 strings.
- Keep internal database model shapes separate from public DTO shapes.
- Keep contract names stable and explicit:
  - app DTOs
  - create/update/delete inputs
  - watch payload DTOs
  - presence update inputs
- Do not expose database-only fields unless the web app or SDK actually needs them.

## Workstream 1: Repo and Tooling Baseline

- Normalize Bun to `1.3.11` across root config, local docs, and GitHub Actions.
- Keep Bun workspaces as the repo package manager.
- Remove unstable version indirection such as `rolldown-vite@latest` overrides from the root config.
- Unify TypeScript on a stable 5.9.x line for RC1.
- Unify Zod on version 4 across the repo so contracts come from one schema system.
- Split mutating and non-mutating root scripts.
- Replace the current root `check` script with a real CI-safe command set:
  - `lint`
  - `format`
  - `format:check`
  - `typecheck`
  - `test`
  - `build`
  - `release:check`
- Add `preinstall` protection so the repo clearly expects Bun.
- Stop server typecheck from emitting tracked or untracked build artifacts.
- Add missing ignore entries for generated server output if any build step still writes to `dist`.

## Workstream 2: Contracts Package

- Add `packages/contracts/package.json` with:
  - `name: @simple-presence/contracts`
  - `private: true`
  - `type: module`
  - explicit `exports`
- Add `packages/contracts/src/index.ts`.
- Add separate modules for:
  - dashboard/admin HTTP contract
  - presence WebSocket contract
  - shared schemas and DTOs
- Define contract DTOs for:
  - `AppSummary`
  - `AppDetail`
  - `CreateAppInput`
  - `UpdateAppInput`
  - `DeleteAppInput`
  - `WatchAppInput`
  - `WatchAppPayload`
  - `WatchTagStat`
  - `PresenceEvent`
  - `PresenceUpdateInput`
  - `PresenceCountUpdate`
- Keep contract outputs explicit with `.output(...)` so inference does not depend on handler bodies.
- Use Zod 4 schemas from this package for both runtime validation and shared types.
- Export only contract-safe types and schemas from `packages/contracts`.

## Workstream 3: Server Refactor and Hardening

- Refactor `apps/server` so all router input/output schemas come from `packages/contracts`.
- Replace inline schema definitions in server router files with imports from the contracts package.
- Implement the HTTP contract in the server router layer.
- Implement the presence WebSocket contract in the Durable Object layer.
- Remove `zod/v3` usage entirely.
- Map database records to DTOs explicitly before returning them from RPC handlers.
- Ensure app CRUD responses use contract DTOs with ISO timestamps.
- Fix presence event persistence:
  - generate a real per-WebSocket session id
  - persist connect/update/disconnect with that id
  - record durations on disconnect when possible
- Ensure tag/session cleanup is complete when connections close.
- Add a typed server-side error strategy:
  - use structured oRPC errors for auth/not-found/validation states
  - avoid raw `Error("App not found")` as the public contract shape
- Add a simple health endpoint such as `/health` in addition to the current root check.
- Keep email/password auth only for RC1.
- Configure Better Auth for the split-domain deployment:
  - base URL `https://api.simple-presence.erickr.dev`
  - trusted origin `https://simple-presence.erickr.dev`
  - cross-subdomain cookie configuration for the chosen domain layout
- Lock CORS to the web origin in production.
- Audit environment variables and document the minimum required production set.

## Workstream 4: Web App Refactor and Hardening

- Remove all imports from `../../../server/...` and `../../../../server/...`.
- Rebuild the web oRPC client typing from `@simple-presence/contracts`.
- Type the dashboard watch stream from the shared watch payload DTO, not `AppRouterOutputs`.
- Normalize all timestamp display logic to consume ISO strings, not `Date` objects.
- Harden auth flow:
  - no unauthenticated flash on dashboard routes
  - clear redirect behavior to sign-in
  - clear error display on auth failures
- Keep the current dashboard scope:
  - sign up
  - sign in
  - list apps
  - create app
  - delete app
  - view app details and live presence events
- Remove prototype shortcuts:
  - replace the hardcoded dashboard app key with a deliberate internal demo strategy or remove dashboard self-tracking from RC1
- Fix dead or misleading CTAs on the landing page.
- Add a minimal docs route or equivalent public documentation page for:
  - install
  - create app
  - use `@simple-presence/core`
  - use `@simple-presence/react`
  - override `apiUrl` for local/self-hosted usage
- Keep the app UI aligned with the existing visual language; do not redesign the product for RC1.

## Workstream 5: SDK Hardening

- Keep the public SDK scope small and documented.
- Preserve the current high-level API names unless a change is required for correctness:
  - `SimplePresence`
  - `initPresence`
  - `PresenceConfig`
  - `usePresenceCount`
- Default the SDK backend to `https://api.simple-presence.erickr.dev`.
- Keep `apiUrl` as an optional override for local development and self-hosting.
- Remove build-time dependence on server source files.
- Remove hardcoded build-time env replacement as the primary release mechanism for production API URLs.
- Replace it with a runtime default constant inside the SDK.
- Fix lifecycle and correctness issues in `@simple-presence/core`:
  - do not rely on a constructor fire-and-forget init without clear readiness handling
  - store and remove the exact same visibility handler reference
  - ensure cleanup is idempotent
  - handle WebSocket setup failure deterministically
  - make destroy behavior safe during partial initialization
- Decide bundle output for RC1:
  - ESM only
  - browser-targeted
  - bundled runtime with type declarations
- Keep `@simple-presence/react` as a thin wrapper over core.
- Keep React peer support at `>=18`.
- Do not expose low-level oRPC or server-router types from the public SDK packages.

## Workstream 6: Package Metadata and Publish Readiness

- Add or fix package metadata in both public packages:
  - `description`
  - `keywords`
  - `license: MIT`
  - `repository`
  - `homepage`
  - `bugs`
  - `files`
  - `sideEffects`
  - `engines`
  - `publishConfig.access`
- Verify export maps and declaration paths for both packages.
- Add package artifact validation:
  - `npm pack --dry-run`
  - `publint`
  - `arethetypeswrong`
- Add type-consumer tests for both packages.
- Ensure published tarballs do not contain workspace-only imports or unresolved contracts-package references.
- Ensure the public packages can be installed and typechecked in a fresh consumer project without the monorepo.

## Workstream 7: Deploy and Release Automation

- Add a PR/main CI workflow for validation only.
- Add a production deploy workflow for `main`.
- Add a separate SDK publish workflow for controlled RC releases.
- Model the deploy flow after the `avaliacao-corrida` Alchemy + GitHub Actions shape, but remove preview-environment logic for RC1.
- Model the SDK publish workflow after `glim-node` in spirit, but do not auto-bump and publish on every push to `main`.
- Use one CI workflow with these gates:
  - install
  - lint
  - typecheck
  - test
  - build
  - package validation
- Use one production deploy workflow on `main`:
  - run CI gates
  - deploy server
  - deploy web with `VITE_SERVER_URL=https://api.simple-presence.erickr.dev`
- Use one RC publish workflow:
  - trigger on tag or manual dispatch
  - verify the repo is already version-bumped in git
  - build only the public packages
  - run package validations
  - publish with npm dist-tag `rc`
  - create provenance
- Prefer npm Trusted Publishing via GitHub Actions OIDC.
- Keep `NPM_TOKEN` only as fallback if trusted publishing cannot be enabled before RC cut.

## Workstream 8: Alchemy and Cloudflare Production Topology

- Update `apps/server/alchemy.run.ts` to:
  - use a persistent Alchemy state store
  - deploy the Worker under production stage
  - bind custom domain `api.simple-presence.erickr.dev`
- Update `apps/web/alchemy.run.ts` to:
  - deploy the prerendered/static web output
  - bind custom domain `simple-presence.erickr.dev`
  - use production stage only
- Keep web and API as separate deploy targets for RC1.
- Standardize production env values:
  - `CORS_ORIGIN=https://simple-presence.erickr.dev`
  - `BETTER_AUTH_URL=https://api.simple-presence.erickr.dev`
  - `VITE_SERVER_URL=https://api.simple-presence.erickr.dev`
- Document required GitHub secrets:
  - `ALCHEMY_STATE_TOKEN`
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `BETTER_AUTH_SECRET`
  - any additional Alchemy/Cloudflare credentials actually required by the final deploy shape
- Add a deployment runbook for:
  - first DNS cutover
  - env setup
  - rollback to last known good deployment

## Workstream 9: Docs and Release Assets

- Rewrite the root README so it describes the real product and monorepo structure.
- Rewrite `packages/core/README.md` to match the actual RC API and behavior.
- Rewrite `packages/react/README.md` to match the actual hook signature and behavior.
- Add `LICENSE` with MIT text.
- Add `CHANGELOG.md` starting with `0.1.0-rc.1`.
- Add a short `RELEASING.md` or equivalent internal release doc describing:
  - version bump procedure
  - RC publish procedure
  - production deploy procedure
  - rollback procedure
- Remove statements in docs that promise unsupported features.

## Important Public API and Type Changes

- Public packages remain:
  - `@simple-presence/core`
  - `@simple-presence/react`
- New internal package:
  - `@simple-presence/contracts`
  - private only
- Public SDK API for RC1:
  - `PresenceConfig` requires `tag` and `appKey`
  - `apiUrl` stays optional and defaults to the hosted production API
  - `onCountChange` remains the primary callback in core
  - `usePresenceCount(tag, options)` remains the React entrypoint and returns a number
- Public wire-format rule:
  - any timestamp returned by the hosted API is an ISO string
- Public stability rule:
  - the RC does not expose raw server router types, raw Drizzle models, or internal Durable Object types
- Contract stability rule:
  - shared schemas live in the internal contracts package and are the sole authority for app/web/server wire compatibility

## Test Matrix

- Contract tests:
  - validate all shared schemas with representative good/bad payloads
  - verify HTTP DTO timestamp serialization
  - verify presence watch payload shape
- Server tests:
  - auth-required routes reject unauthenticated requests
  - app CRUD works for the owning user only
  - not-found and validation errors use stable typed responses
  - presence update changes live counts correctly
  - disconnect removes sessions and records a real event
- Durable Object tests:
  - connect/update/disconnect lifecycle
  - multiple sessions under one tag
  - multiple tags under one app key
  - last-updated behavior and event ordering
- Web tests:
  - sign up and sign in flow
  - create app flow
  - app detail page renders live tag/event tables
  - dashboard redirect behavior when signed out
- SDK tests:
  - `SimplePresence` connects and emits count changes
  - destroy is safe when called early and repeatedly
  - visibility changes trigger correct status updates
  - React hook mounts/unmounts cleanly
- Type tests:
  - consumer project using `@simple-presence/core`
  - consumer project using `@simple-presence/react`
  - no consumer type path resolves into `apps/server`
- Publish tests:
  - `npm pack --dry-run`
  - `publint`
  - `arethetypeswrong`
  - install tarball in a clean fixture and run typecheck
- CI acceptance:
  - all checks pass on a clean clone with only `bun install --frozen-lockfile`

## Release Gates

1. Tooling gate

- clean install works
- CI-safe scripts exist
- dependency versions are pinned and deterministic

2. Contract gate

- no package or app imports server source types directly
- contracts package is the only shared wire-contract source

3. Product gate

- sign in, create app, and live presence dashboard work against deployed prod
- SDK default backend points to `api.simple-presence.erickr.dev`

4. Publish gate

- both public packages pass artifact and type validation
- README examples compile against the shipped API
- packages publish under dist-tag `rc`

5. Deploy gate

- web is live at `simple-presence.erickr.dev`
- API and WebSocket service are live at `api.simple-presence.erickr.dev`
- auth works cross-subdomain

## Recommended Execution Order

1. Stabilize tooling, dependency versions, scripts, and ignores.
2. Add `packages/contracts` and migrate all shared schemas/contracts there.
3. Refactor server to implement contracts and return explicit DTOs.
4. Refactor web to consume contracts package and remove server-relative imports.
5. Refactor SDKs to remove server coupling and harden lifecycle behavior.
6. Rewrite docs and package metadata.
7. Add tests and package validation.
8. Add CI, prod deploy, and controlled RC publish workflows.
9. Cut `0.1.0-rc.1`, publish packages with dist-tag `rc`, then deploy prod.

## Assumptions and Defaults

- Release scope is `Packages + SaaS`.
- Release posture is `Public 0.x beta`.
- SDK scope is `small but solid`, not feature-complete relative to the abandoned README.
- Shared contracts remain internal for RC1.
- Package names stay under the `@simple-presence/*` scope.
- SDKs default to the hosted backend and allow `apiUrl` override.
- Deploys are production-only CI for RC1, with no PR previews.
- Domain topology is:
  - `simple-presence.erickr.dev` for web
  - `api.simple-presence.erickr.dev` for API/auth/WebSocket
- License is MIT.
- RC versioning is fixed across the two public SDK packages for `0.1.0-rc.x`.
- If trusted npm publishing cannot be enabled before release, fallback token-based publishing is acceptable for RC1.

## References

- oRPC contract-first and implementation model: https://orpc.dev/docs/contract-first/define-contract
- oRPC contract implementation: https://orpc.dev/docs/contract-first/implement-contract
- oRPC publish-client guidance: https://orpc.dev/docs/advanced/publish-client-to-npm
- oRPC testing and implementer guidance: https://orpc.dev/docs/advanced/testing-mocking
- Better Auth session management: https://better-auth.com/docs/concepts/session-management
- Server deploy reference repo: https://github.com/ErickCReis/avaliacao-corrida
- Library publish/tooling reference repo: https://github.com/ErickCReis/glim-node
