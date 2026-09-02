# GitHub Actions secret hygiene

This repo is **public**. Any `workflow_run` job runs in the base-repo context and
receives the default `GITHUB_TOKEN` (and repository secrets when configured). Treat
PR head branch names and fork commits as **untrusted input**.

## High-risk patterns (blocked)

| Pattern | Risk | Mitigation in this repo |
|---------|------|-------------------------|
| `workflow_run` after PR CI, then `${{ github.event.workflow_run.head_branch }}` inside `run:` | Shell injection → token / secret theft | Pass via `env:` + strict regex; never `${{ }}` into the script body |
| `workflow_run` autofix that `pip install -e .` from the PR ref | Malicious package code runs with write token | Install from `main`, copy trusted scripts to `/tmp`, then check out the PR SHA |
| `workflow_run` without a same-repo gate | Public **fork** PRs trigger privileged jobs | Require `head_repository.full_name == github.repository` |
| Logging full API keys | Key leak via Actions logs | Never log secrets; use fingerprints only |
| `${{ github.event.inputs.* }}` inside `run:` (string dispatch inputs) | Shell injection → secret theft if a write token can dispatch | Pass all inputs via `env:` + allowlists; never `${{ }}` into the script body |

## Current workflow posture

Bartley workflows today are low-privilege and secret-free:

| Workflow | Triggers | Permissions | Secrets |
|----------|----------|-------------|---------|
| `ci.yml` | PR / push to `main` | `contents: read` | none |
| `deploy-pages.yml` | push to `main`, manual | `contents: read`, `pages: write`, `id-token: write` | none (OIDC) |
| `refresh-data.yml` | weekly schedule, manual | `contents: write`, `pull-requests: write` | none |
| `gha-secret-hygiene.yml` | schedule, PR/push on workflow changes | `contents: read`, `actions: read`, `pull-requests: read` | none |

The site uses only the public DfE Explore Education Statistics API — no API keys are
required for local dev or CI.

## Automated daily check

`gha-secret-hygiene.yml` runs:

1. **Daily** (~06:20 UTC via GitHub `schedule`)
2. **On PRs / pushes** that touch `.github/workflows/**` or the scanner itself
3. **Manual** `workflow_dispatch` with optional `force=true`

The daily job **skips** when no PRs were merged to `main` and no commits touched
`.github/workflows/` in the last **36 hours** (override with `force`). That keeps
noise low while still catching workflow changes introduced by merges.

Local / CI commands:

```bash
npm run security:gha-hygiene
python3 scripts/gha_secret_hygiene_cli.py check
python3 scripts/gha_secret_hygiene_cli.py schedule-gate --force
pytest -q scripts/test_gha_secret_hygiene.py
```

## If repository secrets are added later

Before introducing secrets (SMTP, API keys, dispatch PATs):

1. Keep secret-bearing jobs on `push` to `main` or trusted `workflow_dispatch` only.
2. Never interpolate `${{ github.event.* }}` untrusted fields directly into `run:` scripts.
3. Gate any future `workflow_run` jobs with `head_repository.full_name == github.repository`.
4. Prefer branch protection on `main` so a stolen Actions token cannot silently plant
   a secret-exfiltrating workflow.

## Related

- [value_investor gha-secret-hygiene](https://github.com/jamiefuller320/value_investor/blob/main/docs/ops/gha-secret-hygiene.md) — original pattern this scanner was ported from
