# Release Guide

## Version Bump

1. Update version in `packages/core/package.json`, `packages/react/package.json`, and `packages/solid-js/package.json` to the target (e.g. `0.3.0`).
2. Update `CHANGELOG.md` with the new version entry.
3. Commit: `git commit -am "chore: bump to 0.3.0"`
4. Tag: `git tag v0.3.0`
5. Push: `git push origin main --tags`

## RC Publish

1. Go to **Actions > Publish RC** in GitHub.
2. Enter the version (e.g. `0.3.0-rc.1`).
3. Run the workflow. It will:
   - Verify versions match across packages.
   - Build and validate packages.
   - Publish to npm with `rc` dist-tag and provenance.

## Production Deploy

Merges to `main` automatically trigger the **Deploy** workflow which:

1. Runs CI gates (lint, build).
2. Deploys the server to Cloudflare Workers via Alchemy.
3. Deploys the web app to Cloudflare via Alchemy.

## Rollback

### Server rollback

Re-deploy a previous commit:

```bash
git checkout <last-good-sha>
cd apps/server && bun run deploy
```

### Web rollback

Re-deploy a previous commit:

```bash
git checkout <last-good-sha>
cd apps/web && bun run build && bun run deploy
```

### npm rollback

Deprecate a bad release and point the `rc` tag to the previous version:

```bash
npm dist-tag add @simple-presence/core@<previous-version> rc
npm dist-tag add @simple-presence/react@<previous-version> rc
npm dist-tag add @simple-presence/solid-js@<previous-version> rc
```

## Required GitHub Secrets

| Secret                  | Purpose                                    |
| ----------------------- | ------------------------------------------ |
| `ALCHEMY_STATE_TOKEN`   | Alchemy state encryption                   |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API access                      |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account                         |
| `BETTER_AUTH_SECRET`    | Auth encryption key                        |
| `NPM_TOKEN`             | npm publish (fallback if OIDC unavailable) |

## Production Environment

| Variable          | Value                                |
| ----------------- | ------------------------------------ |
| `CORS_ORIGIN`     | `https://simple-presence.erickr.dev` |
| `BETTER_AUTH_URL` | `https://simple-presence.erickr.dev` |
| `VITE_SERVER_URL` | `https://simple-presence.erickr.dev` |

## Published Packages

| Package                     | npm                                                                  |
| --------------------------- | -------------------------------------------------------------------- |
| `@simple-presence/core`     | [npmjs.com](https://www.npmjs.com/package/@simple-presence/core)     |
| `@simple-presence/react`    | [npmjs.com](https://www.npmjs.com/package/@simple-presence/react)    |
| `@simple-presence/solid-js` | [npmjs.com](https://www.npmjs.com/package/@simple-presence/solid-js) |
