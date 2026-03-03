---
description: Commit, push, and redeploy FE/BE/both in one operation
triggers:
  - deploy all frontends
  - deploy all MFs
  - ship all FE
  - commit and deploy
  - push and redeploy
  - deploy everything
  - redeploy all
---

Unified workflow to commit changes, push to GitHub, and redeploy services.

**When to use this skill:**
- User asks to "deploy all frontends" or "deploy all MFs" → use `--all-fe`
- User asks to "commit and deploy" a service → use `/ship <service>`
- User asks to "push and redeploy" → this skill handles the full flow
- User mentions multiple services to deploy → consider `--all-fe` or `--all-be`

**Arguments**: $ARGUMENTS (e.g., "labels", "--all-fe", "contacts --both")

## Syntax

```
# Single service
/ship <service> [--be-only | --fe-only | --both] [--yes] [--dry-run]

# All active services with changes
/ship --all-fe [--yes] [--dry-run]
/ship --all-be [--yes] [--dry-run]
```

**Options:**
- `--all-fe`: Ship all active FE services that have uncommitted changes
- `--all-be`: Ship all active BE services that have uncommitted changes (TODO)
- `--be-only`: Deploy backend only (single service mode)
- `--fe-only`: Deploy frontend only (single service mode)
- `--both`: Deploy both BE and FE (default if service has both and both have changes)
- `--yes`: Skip confirmation prompt
- `--dry-run`: Show what would be done without executing

## Active Service Registry

Services are only deployed with `--all-fe` or `--all-be` if listed here:

**Active FE** (deployed and integrated):
- shell, labels, brands, contacts

**Inactive FE** (exist but not in --all-fe):
- auth-fe: exists but not integrated into shell yet
- deals-fe: not created

**Active BE** (deployed and running):
- labels, brands, contacts, auth, gaming-accounts, analytics

**Inactive BE**:
- deals: schema only, not deployed

## Service Registry

| Service | Has BE | Has FE | Default Mode |
|---------|--------|--------|--------------|
| labels | YES | YES | both |
| brands | YES | YES | both |
| contacts | YES | YES | both |
| auth | YES | YES | both |
| deals | YES | NO | be-only |
| gaming-accounts | YES | NO | be-only |
| analytics | YES | NO | be-only |
| shell | NO | YES | fe-only |

**Name normalization:** `labels-fe`, `hnc-labels-fe`, `labels` all resolve to `labels`.

## Execution Steps

### 1. Parse & Validate

Parse `$ARGUMENTS` to get service name and options.

Normalize service name:
- `labels-fe` → `labels`
- `hnc-labels-fe` → `labels`
- `shell` stays `shell`

Validate service exists in registry. If invalid, show usage and stop.

### 2. Detect Mode

If no mode flag provided:
1. Check for uncommitted changes in BE path (services/{service}/)
2. Check for uncommitted changes in FE path (/hnc/frontend/{service}/)
3. Auto-select mode based on what has changes

If no changes found at all, show error and stop.

### 3. Show Preview

Display changes summary:

```
┌─ SHIP: {service} ({mode}) ──────────────────────────────────────────────────────┐
│                                                                                  │
│  Backend (services/{service}/):                                                 │
│    M src/api/routes/index.ts                                                     │
│    M src/services/someService.ts                                                 │
│                                                                                  │
│  Frontend (/hnc/frontend/{service}/):                                       │
│    M src/components/SomeComponent.tsx                                            │
│                                                                                  │
│  Commits:                                                                        │
│    [monorepo] feat({service}): Update routes and service                        │
│    [hnc-{service}-fe] feat: Update SomeComponent                                │
│                                                                                  │
│  Deploy steps:                                                                   │
│    → Commit & push monorepo → Redeploy BE                                       │
│    → Commit & push FE repo → Wait CI → Redeploy FE                              │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 4. Execute

Run the ship script:

```bash
/hnc/infra/scripts/ship.sh {service} {options}
```

The script handles:
1. Commit with auto-generated message + Co-Authored-By
2. Push to GitHub
3. Redeploy BE (if applicable) - parallel with FE
4. Redeploy FE (if applicable) - waits for CI, pulls from GHCR
5. Health check verification

### 5. Report Result

**On Success:**
```
┌─ SHIP COMPLETE: {service} ──────────────────────────────────────────────────────┐
│  BE Commit: abc1234                                                              │
│  BE URL:    https://hncms-{service}.scarif-0.duckdns.org/health                 │
│  FE Commit: def5678                                                              │
│  FE URL:    https://hncms-{service}.scarif-0.duckdns.org                        │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**On Failure:**
- Show which step failed (commit, push, BE deploy, FE CI, FE deploy)
- Suggest recovery action

## Commit Message Format

Auto-generated using conventional commits:

**Backend**: `{type}({service}): {description}`
**Frontend**: `{type}: {description}`

Types detected from changes:
- `feat` - new files or features
- `fix` - files containing "fix" in path
- `style` - CSS/SCSS changes
- `docs` - documentation changes
- `refactor` - deletions only

## Parallelization

When mode is `--both`:
- BE and FE commits/pushes run **sequentially** (required order)
- BE redeploy and FE redeploy run **in parallel**
- FE redeploy internally waits for GitHub CI to complete

## Key Constraints

- **S-451**: FE CI builds from GitHub, NOT local files. Must commit+push BEFORE redeploy.
- Health check timeout: 30 attempts (30 seconds)
- FE requires GHCR authentication (handled by script)

## Who Can Invoke

- **hnc-master**: YES (per CLAUDE.md scripted skills exception)
- **fe-master**: YES (primary for FE work)
- **hnc-devops**: YES (deployment domain)

Other agents should delegate to hnc-master or fe-master.

## Examples

```bash
# Deploy both BE and FE for labels (auto-detect)
/ship labels

# Deploy only backend
/ship labels --be-only

# Deploy only frontend (explicit)
/ship contacts --fe-only

# Deploy shell (FE-only service)
/ship shell

# Skip confirmation
/ship auth --both --yes
```
