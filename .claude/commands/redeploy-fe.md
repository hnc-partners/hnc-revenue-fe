---
description: Rebuild and redeploy a frontend micro-frontend
---

Trigger CI build and redeploy a frontend micro-frontend from GHCR.

> **CRITICAL (S-451)**: CI builds from GitHub, not local files. Always: `edit → commit → push → THEN redeploy`. Local changes not committed will NOT be included. The `--skip-build` flag skips CI entirely (emergency only).

**Service**: $ARGUMENTS (e.g., "labels-fe", "shell", "brands-fe")

## Execution Steps

### 1. Validate Service

Parse `$ARGUMENTS` to get service name and options. Valid services:
- shell (port 4000) - App shell / Module Federation host
- labels-fe (port 4001)
- brands-fe (port 4002)
- contacts-fe (port 4003)
- deals-fe (port 4004)
- auth-fe (port 4005)

Options:
- `--skip-build` - Skip CI, just pull latest image and redeploy

If service is empty or invalid, show usage and stop.

### 2. Check CI Workflow Exists

For services WITHOUT GitHub Actions (deals-fe):
- Warn: "This service has no CI workflow. Use --skip-build or set up CI first."
- If --skip-build not provided, stop and explain.

### 3. Run Redeploy Script

Execute the redeploy script:

```bash
/hnc/infra/scripts/redeploy-fe.sh {service} [--skip-build]
```

### 4. Report Result

**On Success**: Show deployment summary with container status and URL.

**On Failure**: Show error, suggest checking:
- CI logs: `gh run view -R hnc-partners/hnc-{service}`
- Container logs: `podman logs hnc-ms-{service}`

## Output Format

```
┌─ FE REDEPLOY ────────────────────────────────────────────────────────────────────┐
│ Service: {service}                                                                │
│ Status: SUCCESS | FAILED                                                          │
│ CI Build: PASSED | SKIPPED                                                        │
│ Container: {container-name}                                                       │
│ URL: https://hncms-{service}.scarif-0.duckdns.org                                │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## CI Status by Service

| Service | Port | CI Workflow | GHCR Image |
|---------|------|-------------|------------|
| shell | 4000 | YES | YES |
| labels-fe | 4001 | YES | YES |
| brands-fe | 4002 | YES | YES |
| contacts-fe | 4003 | YES | YES |
| deals-fe | 4004 | NO | NO |
| auth-fe | 4005 | YES | YES |

## Notes

- Frontend builds happen in GitHub Actions (separate repos)
- Script waits for CI completion before pulling image
- Uses GHCR (ghcr.io/hnc-partners/...) for container images
- No atlas dispatch needed - routing already configured

### Post-Redeploy Verification

After redeploying an MF remote:
1. Verify `remoteEntry.js` loads: `curl -I https://hncms-{service}.scarif-0.duckdns.org/remoteEntry.js`
2. Check shell loads the remote (no console errors)
3. Verify CSS loads (styling appears correctly)

### Troubleshooting MF Load Failures

If `remoteEntry.js` returns 200 but shell shows CORS errors or the MF fails to load:

1. **Check CORS headers**:
   ```bash
   curl -I https://hncms-{service}.scarif-0.duckdns.org/remoteEntry.js | grep -i access-control
   ```

2. **Update backend CORS**: Add the shell origin to CORS config of backend services the MF communicates with. Missing CORS causes 401/403 errors that look like auth failures.

3. **Reference**: See `/deploy-new-fe` Step 4 for full CORS configuration pattern.
