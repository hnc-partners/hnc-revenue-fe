---
description: Run BE consistency audit on a microservice
---

Audit a V3 microservice for compliance with BE Standards.

**Service**: $ARGUMENTS (required - e.g., "brands", "contacts", "deals")

If no service specified, list available services and ask which to audit.

## Execution

**IMPORTANT**: This is hnc-be persona work. When dispatching via Task tool, **MUST use `model: "opus"`**.

1. Validate service exists at `services/$ARGUMENTS/`
2. Dispatch to sub-agent with `model: "opus"`:
   - Load the audit workflow: `/hnc/dev/workflows/be-service-audit/workflow.md`
   - Execute the workflow step by step
3. Display the audit report with scores and findings

## Valid Services

- labels
- brands
- contacts
- deals
- gaming-accounts
- analytics
- auth

## Output

Display a markdown report with:
- Overall score and status (PASS / NEEDS_WORK / CRITICAL_GAPS)
- Category breakdown (Structure, API Contract, Prisma, Middleware, Health/Docs, Config, Responses)
- All findings with severity, location, and fix suggestions
- Documented variations (if any)

## Options

- `/be-audit brands` - Audit brands service
- `/be-audit brands --save` - Audit and save report to `/hnc/dev/output/audits/`
- `/be-audit all` - Audit all services sequentially

## Reference

- Workflow: `/hnc/dev/workflows/be-service-audit/workflow.md`
- Standards: `/hnc/dev/sidecars/shared/be-development-standards.md`
- Variation Registry: `/hnc/dev/sidecars/hnc-be/variation-registry.md`
