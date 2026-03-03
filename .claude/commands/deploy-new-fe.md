---
description: Initial deployment of a new frontend micro-frontend (includes routing setup)
---

Deploy a NEW frontend micro-frontend for the first time, including CI setup and routing.

> **CRITICAL (S-451)**: CI builds from GitHub, not local files. Always: `edit → commit → push → THEN deploy`. Local changes not committed will NOT be included in the deployment.

**Service**: $ARGUMENTS (e.g., "brands-fe", "contacts-fe")

## Pre-Flight Checks

1. Repo exists: `gh repo view hnc-partners/hnc-{service}`
2. Port allocated in `infrastructure/port-registry.md`
3. NOT already running: `podman ps | grep {container}`

If already deployed → redirect to `/redeploy-fe {service}`.

## Execution

### Step 1: Check/Setup CI

```bash
gh workflow list -R hnc-partners/hnc-{service}
```

If NO `docker-build.yml`:
```bash
# Copy from working repo
cp /hnc/frontend/labels/.github/workflows/docker-build.yml \
   /hnc/frontend/{service}/.github/workflows/
cd /hnc/frontend/{service}
git add .github/workflows/ && git commit -m "feat(ci): Add Docker build workflow" && git push
```

### Step 2: Verify MF Configuration

Before proceeding, verify the frontend has proper MF setup in `vite.config.ts`:

**Required plugins**:
- [ ] `@module-federation/vite` (NOT @originjs - breaks TanStack Router)
- [ ] `vite-plugin-css-injected-by-js` (bundles CSS into remoteEntry.js)

**Required config**:
- [ ] Conditional federation (production only): `...(isProduction ? [federation({...})] : [])`
- [ ] Base URL set: `base: isProduction ? 'https://hncms-{service}-fe.scarif-0.duckdns.org/' : '/'`
- [ ] Build settings: `cssCodeSplit: false`, `minify: isProduction`, `sourcemap: !isProduction`

**If missing**: Stop and update vite.config.ts first. See `new-frontend-guide.md` Step 6.

### Step 3: Build & Deploy

```bash
/hnc/infra/scripts/redeploy-fe.sh {service}
```

### Step 4: Update CORS on Backend Services

**CRITICAL**: The new FE will call backend APIs. Add the new FE's origin to CORS config of ALL backends it communicates with.

**Checklist** (check ALL that apply):
- [ ] `services/analytics/` - Most FEs call analytics for KPIs/metrics
- [ ] `services/auth/` - If FE uses authentication
- [ ] `services/labels/` - If FE uses labels
- [ ] `services/brands/` - If FE uses brands
- [ ] `services/contacts/` - If FE uses contacts
- [ ] `services/deals/` - If FE uses deals
- [ ] `services/gaming-accounts/` - If FE uses gaming accounts

**Required origins** (in each service's `.env` or CORS config):
```bash
# ALL three origins are required for proper MF operation
CORS_ORIGINS=https://hncms-shell.scarif-0.duckdns.org,https://hncms-{service}-fe.scarif-0.duckdns.org,http://localhost:5173
```

After updating, redeploy affected backends:
```bash
/redeploy-be analytics  # If analytics was updated
/redeploy-be auth       # If auth was updated
# etc.
```

### Step 5: Add Traefik Routing

Add to `infrastructure/docker/traefik/dynamic/services.yml`:
```yaml
http:
  routers:
    {service}:
      entryPoints: [web]
      rule: "Host(`hncms-{service}.scarif-0.duckdns.org`)"
      service: {service}
  services:
    {service}:
      loadBalancer:
        servers:
          - url: "http://127.0.0.1:{port}"
```

### Step 6: External Routing (DISPATCH REQUIRED)

**Dispatch to atlas (infra-sage)** with prompt:
```
New frontend service needs external routing:
- Service: {service}
- Internal: http://192.168.137.80:{port}
- External: hncms-{service}.scarif-0.duckdns.org
Need: NPM proxy host + Pi-hole DNS entry
```

### Step 7: Module Federation (if MF remote)

Update shell's `vite.config.ts` remotes, then:
```bash
/redeploy-fe shell
```

### Step 8: Update Docs

- `infrastructure/port-registry.md`: Status → "Active"
- `infrastructure/service-registry.yaml`: status → "active"

## Service Reference

| Service | Port | Container | CI Workflow |
|---------|------|-----------|-------------|
| shell | 4000 | hnc-shell | YES |
| labels-fe | 4001 | hnc-ms-labels-fe | YES |
| brands-fe | 4002 | hnc-ms-brands-fe | YES |
| contacts-fe | 4003 | hnc-ms-contacts-fe | YES |
| deals-fe | 4004 | hnc-ms-deals-fe | NO |
| auth-fe | 4005 | hnc-ms-auth-fe | YES |

## Output

```
┌─ NEW FE DEPLOYED ────────────────────────────────────────────────────────────────┐
│ Service: {service} | Port: {port} | CI: ✓ | External: PENDING (atlas dispatch)  │
└──────────────────────────────────────────────────────────────────────────────────┘
```
