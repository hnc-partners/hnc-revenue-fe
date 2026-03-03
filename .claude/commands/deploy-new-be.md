---
description: Initial deployment of a new backend service (includes routing setup)
---

Deploy a NEW backend service for the first time, including routing configuration.

**Service**: $ARGUMENTS (e.g., "players", "notifications")

## Pre-Flight Checks

1. Service directory exists: `services/{service}/`
2. Port allocated in `infrastructure/port-registry.md`
3. NOT already running: `podman ps | grep hnc-ms-{service}`

If already deployed → redirect to `/redeploy-be {service}`.

## Execution

### Step 1: Deploy Container

Run the redeploy script (handles build, docker-compose, health check):
```bash
/hnc/infra/scripts/redeploy-be.sh {service}
```

### Step 2: Add Traefik Routing

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

### Step 3: External Routing (DISPATCH REQUIRED)

**Dispatch to atlas (infra-sage)** with prompt:
```
New backend service needs external routing:
- Service: {service}
- Internal: http://192.168.137.80:{port}
- External: hncms-{service}.scarif-0.duckdns.org
Need: NPM proxy host + Pi-hole DNS entry
```

### Step 4: Update Docs

- `infrastructure/port-registry.md`: Status → "Active"
- `infrastructure/service-registry.yaml`: Add entry

## Output

```
┌─ NEW BE DEPLOYED ────────────────────────────────────────────────────────────────┐
│ Service: {service} | Port: {port} | External: PENDING (atlas dispatch)           │
└──────────────────────────────────────────────────────────────────────────────────┘
```
