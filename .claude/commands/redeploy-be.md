---
description: Rebuild and redeploy a backend service
---

Rebuild and redeploy a backend microservice from the monorepo.

**Service**: $ARGUMENTS (e.g., "labels", "auth", "contacts")

## Execution Steps

### 1. Validate Service

Parse `$ARGUMENTS` to get service name. Valid services:
- labels (port 3000)
- auth (port 3001)
- contacts (port 3002)
- gaming-accounts (port 3003)
- brands (port 3004)
- deals (port 3005)
- analytics (port 3009)

If service is empty or invalid, show usage and stop.

### 2. Run Redeploy Script

Execute the redeploy script:

```bash
/hnc/infra/scripts/redeploy-be.sh {service}
```

### 3. Report Result

**On Success**: Show deployment summary with container status and URL.

**On Failure**: Show error, suggest checking logs with `podman logs hnc-ms-{service}`.

## Output Format

```
┌─ BE REDEPLOY ────────────────────────────────────────────────────────────────────┐
│ Service: {service}                                                                │
│ Status: SUCCESS | FAILED                                                          │
│ Container: hnc-ms-{service}                                                       │
│ URL: https://hncms-{service}.scarif-0.duckdns.org                                │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Notes

- This skill rebuilds from source in the monorepo (services/{service}/)
- Uses docker-compose for container orchestration
- Health check verifies /health endpoint responds
- No atlas dispatch needed - routing already configured
