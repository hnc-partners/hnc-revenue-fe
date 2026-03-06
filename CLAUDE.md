# HNC Revenue Frontend

Multi-feature micro-frontend for revenue management — statements, imports, and commissions.

## Quick Reference

| Aspect | Value |
|--------|-------|
| **Type** | MF Remote |
| **Dev Port** | 5177 |
| **Accent Color** | TBD (assigned during shell integration) |
| **Backend APIs** | revenue (3106) + report-management (3107) |
| **MF Plugin** | @module-federation/vite |
| **MF Name** | `revenue` |

## Module Federation

### Exposed Modules

```typescript
// vite.config.ts exposes:
exposes: {
  './App': './src/App.tsx',
  './RevenuePage': './src/features/revenue/components/RevenuePage.tsx',
}
```

### MF Config

- **Name**: `revenue`
- **Filename**: `remoteEntry.js`
- **Base URL (prod)**: `https://hncms-revenue-fe.scarif-0.duckdns.org/`
- **Shared**: react, react-dom, @tanstack/react-query, @hnc-partners/auth-context (all singletons)
- **Federation only in production** - dev mode runs standalone

### CSS Injection

Uses `vite-plugin-css-injected-by-js` to bundle CSS into remoteEntry.js for MF compatibility.

## Dual-Service Architecture

This MF is unique — it talks to TWO backend services:

| Service | Proxy Path | Features |
|---------|-----------|----------|
| revenue (3106) | `/revenue-api` | F30 (Imports), F21 (Commissions) |
| report-management (3107) | `/report-management-api` | F54 (Statements) |

## Accent Color (MF Identity)

Shell provides `--mf-accent` via `[data-mf="revenue"]` scoped CSS vars. The tailwind config maps this to `mf-accent` utility classes.

Use `text-mf-accent`, `bg-mf-accent/10` - NOT hardcoded Tailwind colors.

No `:root` CSS vars in this MF - shell owns all theme variables (PLAN-050).

## Commands

```bash
pnpm dev          # Start dev server (port 5177)
pnpm build        # Build for production
pnpm typecheck    # TypeScript checking
pnpm lint         # ESLint checking
```

## Environment Variables

| Variable | Description | Used In |
|----------|-------------|---------|
| `VITE_MOCK_AUTH` | Enable mock auth for standalone dev (`true`/`false`) | `src/main.tsx` |
| `VITE_AUTH_URL` | Auth API endpoint for token refresh | `src/main.tsx` |
| `VITE_REVENUE_API_URL` | Revenue backend URL (production) | `src/features/revenue/api/config.ts` |
| `VITE_REPORT_MANAGEMENT_API_URL` | Report Management backend URL (production) | `src/features/revenue/api/config.ts` |

**Note**: In dev mode, Vite proxies are used instead of direct API URLs (`/revenue-api`, `/report-management-api`).

## Project Structure

```
src/
  App.tsx                 # Root app component (MF compatibility)
  main.tsx                # Entry point (mock auth, QueryClient)
  index.css               # Tailwind components + utilities
  routeTree.gen.ts        # TanStack Router generated tree
  vite-env.d.ts           # Vite env type declarations
  features/
    revenue/
      api/
        config.ts          # API URL configuration (dual-service)
        apiFetch.ts        # Fetch wrapper with auth
        index.ts           # API barrel export
      components/
        PlaceholderPage.tsx # Reusable placeholder component
        RevenueLayout.tsx   # Tab layout wrapper (3 tabs)
        RevenuePage.tsx     # Exposed MF component
        statements/         # F54 placeholder components
        imports/            # F30 placeholder components
        commissions/        # F21 placeholder components
  lib/                     # Shared utilities
  routes/
    __root.tsx             # Root route
    index.tsx              # Index redirect
    revenue.tsx            # Revenue layout route (tab navigation)
    revenue/
      index.tsx            # Revenue index redirect
      coverage.tsx         # Coverage report
      statements/          # F54 routes
      imports/             # F30 routes
      data/                # Revenue data browser routes
      commissions/         # F21 routes
```

## Feature Mapping

| Tab | Feature | Backend Service |
|-----|---------|----------------|
| Statements | F54 (Statement Automation) | report-management |
| Imports | F30 (Revenue Import) | revenue |
| Commissions | F21 (Commission Calculation) | revenue |

## Key Patterns

- **Tabbed layout**: Statements/Imports/Commissions as top-level tabs
- **Dual-service**: Fetches from revenue AND report-management APIs
- **Nested routes**: Sub-routes within each tab (e.g., statements/gaps, commissions/summaries/by-brand)
- **Placeholder scaffold**: All routes render placeholder cards — feature implementation follows

## Agents

| Agent | When to Invoke |
|-------|----------------|
| **hnc-fe** | React patterns, component questions |
| **fe-master** | Feature coordination |
| **hnc-be** | Revenue or Report Management API contract |

## Notes

- Part of HNC V3 micro-frontend architecture
- Runs inside hnc-shell in production
- Tailwind config is ESM (`tailwind.config.js`) with mf-accent mapped to `hsl(var(--mf-accent))`
- CSS uses only `@tailwind components` and `@tailwind utilities` (no `@tailwind base` - shell owns base)
- Dev proxy routes: `/revenue-api`, `/report-management-api`
- Does NOT use TanStackRouterVite plugin in vite.config.ts (routeTree.gen.ts is manually maintained)
- See `sidecars/hnc-fe/styling-guide.md` for MF CSS patterns
