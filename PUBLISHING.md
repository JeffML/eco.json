# NPM Publishing Setup

This package uses GitHub Actions + npm OIDC Trusted Publishing (no stored NPM_TOKEN needed for auth).

## How It Works

Publishing is triggered automatically when `package.json`, `src/**`, or `methods/**` changes are pushed to `master`.  
It can also be triggered manually via **Actions → Publish to NPM → Run workflow**.

The workflow:
1. Builds and type-checks the package
2. Compares `package.json` version to the current npm version — skips publish if unchanged
3. Fetches a GitHub OIDC token (audience: `npmjs`) and uses it as `NODE_AUTH_TOKEN`
4. Publishes with `--provenance --access public`
5. Creates a git tag for the release

## npm Trusted Publisher Configuration

On [npmjs.com](https://www.npmjs.com/package/@chess-openings/eco.json) → **Settings**:

| Field | Value |
|---|---|
| Publisher | GitHub Actions |
| Organization or user | `JeffML` |
| Repository | `eco.json` |
| Workflow filename | `publish.yml` |
| Environment | *(blank)* |

**Critical**: The repository field must match the GitHub repo exactly (case-sensitive: `JeffML`, not `jeffml`).

## Troubleshooting

**E404 Not Found** — OIDC token mismatch. Verify the trusted publisher config above matches exactly.  
Confirm by checking the sigstore transparency log URL from the failed run: `Source Repository Owner URI` must be `https://github.com/JeffML`.

**EOTP (one-time password required)** — `NODE_AUTH_TOKEN` was set to a classic npm token. Remove it and let OIDC handle auth. The `setup-node` registry-url config alone is not enough — must explicitly fetch the OIDC token with audience `npmjs` (see publish step in `publish.yml`).

**Version unchanged / publish skipped** — The workflow only publishes when `package.json` version differs from the published npm version. Bump the version before triggering.

**Workflow not triggered on push** — Only runs when `package.json`, `src/**`, or `methods/**` changes. Pushing workflow file changes alone won't trigger it — use `workflow_dispatch` instead.

## Releasing a New Version

1. Bump version in `package.json`
2. Commit and push (triggers workflow automatically), or trigger manually via Actions tab
3. Create a GitHub Release with the matching tag and release notes
