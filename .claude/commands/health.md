---
description: Check health of microservices
---

Check health status of HNC microservices.

If "$ARGUMENTS" is provided, check that specific service.
Otherwise, check all running services.

Steps:
1. List running containers: podman ps --filter "name=hnc-ms"
2. For each service, curl the /health endpoint
3. Report status (healthy/unhealthy/not running)

Health endpoint pattern: http://localhost:<port>/health
