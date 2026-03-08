# NPM Publishing Setup

This package publishes via GitHub Actions using a **granular access token** (`NPM_TOKEN`) stored as a GitHub Actions secret. Provenance (`--provenance`) is also generated via OIDC.

## How It Works

Publishing is triggered by pushing a `v*` git tag. It can also be triggered manually via **Actions → Publish to NPM → Run workflow**.

The workflow:

1. Builds and type-checks the package
2. Publishes with `--provenance --access public` using `NODE_AUTH_TOKEN`

## NPM_TOKEN Setup

The `NPM_TOKEN` secret in GitHub must be a **granular access token** from npmjs.com:

1. npmjs.com → avatar → **Access Tokens** → **Generate New Token** → **Granular Access Token**
2. Scope: `@chess-openings` org (or specifically `@chess-openings/eco.json`)
3. Permission: **Read and write** (publish)
4. Leave **"Require 2FA"** unchecked — required for automation
5. Set expiry to **90 days** (maximum allowed) — **set a calendar reminder to renew before expiry**
6. Save the token to GitHub repo → **Settings** → **Secrets and variables** → **Actions** → `NPM_TOKEN`

## Trusted Publisher Configuration (for provenance only)

On [npmjs.com](https://www.npmjs.com/package/@chess-openings/eco.json) → **Settings**:

| Field                | Value          |
| -------------------- | -------------- |
| Publisher            | GitHub Actions |
| Organization or user | `JeffML`       |
| Repository           | `eco.json`     |
| Workflow filename    | `publish.yml`  |
| Environment          | _(blank)_      |

**Note**: The trusted publisher config is for provenance attestation only. Actual publish authorization uses `NPM_TOKEN`. Both are required.

## Troubleshooting

**E404 Not Found** — Usually an auth failure disguised as a 404. **First thing to try: regenerate the `NPM_TOKEN` granular access token** (it expires every 90 days) and update the GitHub secret. If that doesn't fix it, check that the token has publish access to `@chess-openings`.

**E401 Unauthorized / ENEEDAUTH** — Token is expired or missing. Regenerate `NPM_TOKEN` (see NPM_TOKEN Setup above) and update the GitHub secret.

**EOTP (one-time password required)** — The token type requires 2FA. Create a new granular access token without the 2FA requirement (see NPM_TOKEN Setup above).

**Version unchanged / publish skipped** — The workflow only publishes when `package.json` version differs from the published npm version. Bump the version before triggering.

**Workflow not triggered** — Publishing only fires on `v*` tag pushes. Use `workflow_dispatch` for a manual trigger.

**"Run workflow" button missing** — The workflow file has a syntax error on the default branch. Validate the YAML and push a fix.

## Releasing a New Version

```bash
npm version patch   # or minor / major — bumps package.json and commits
git push --follow-tags  # pushes commit + tag, triggers workflow automatically
```

The workflow fires on the `v*` tag push and publishes to npm. No manual trigger needed.

Optionally create a GitHub Release for the tag with release notes.
