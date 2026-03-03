---
description: Run FE consistency audit on a micro-frontend (PLAN-032)
---

Audit a V3 micro-frontend for compliance with FE standards (PLAN-032, PLAN-020).

**Micro-frontend**: $ARGUMENTS (required - e.g., "labels", "contacts", "brands")

If no MF specified, list available micro-frontends and ask which to audit.

## Execution

**IMPORTANT**: This is hnc-fe persona work. When dispatching via Task tool, **MUST use `model: "opus"`**.

1. Validate MF exists at `/hnc/frontend/$ARGUMENTS/`
2. Dispatch to sub-agent with `model: "opus"`:
   - Load the audit skill: `/hnc/dev/skills/audit/fe-audit.md`
   - Execute checks per skill definition
3. Display the audit report with scores and findings

## Valid Micro-Frontends

- labels (hnc-labels-fe)
- brands (hnc-brands-fe)
- contacts (hnc-contacts-fe)
- gaming-accounts (hnc-gaming-accounts-fe)
- shell (hnc-shell)
- auth (hnc-auth-fe)

## Output

Display a markdown report with:
- Overall score and status (PASS / NEEDS_WORK / CRITICAL_GAPS)
- Category breakdown (Structure, Component Patterns, Design System, Accessibility, TypeScript, Build, MF)
- All findings with severity, location, and fix suggestions
- Documented variations (if any)

## Options

- `/fe-audit labels` - Audit labels micro-frontend
- `/fe-audit labels --save` - Audit and save report to `/hnc/dev/output/audits/`
- `/fe-audit all` - Audit all micro-frontends sequentially

## Thresholds

- **100%**: PASS - Ready for production
- **80-99%**: NEEDS_WORK - Minor gaps (acceptable at FE_IN_PROGRESS)
- **<80%**: CRITICAL_GAPS - Must fix (blocks FE_IN_PROGRESS exit)

## Stage Gates

- **FE_IN_PROGRESS exit**: Score >= 80%
- **FE_REVIEW exit**: Score = 100%

## Reference

- Skill: `/hnc/dev/skills/audit/fe-audit.md`
- Standards: PLAN-032 (Pipeline Workflow Enforcement), PLAN-020 (Design System)
- Variation Registry: `/hnc/dev/sidecars/hnc-fe/variation-registry.md`
- UX Checklist: `/hnc/dev/sidecars/hnc-fe/ux-compliance-checklist.md`
- Design System: `/hnc/dev/sidecars/hnc-fe/v3-design-system.md`
