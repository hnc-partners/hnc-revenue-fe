# HNC Revenue Frontend

Micro-frontend for revenue management - statements, imports, and commissions.

## Quick Reference

| Aspect | Value |
|--------|-------|
| **Type** | MF Remote |
| **Dev Port** | 5177 |
| **Accent Color** | Emerald (HSL 152 60% 40%, dark: 152 60% 52%) |
| **Backend API** | https://hncms-report-management.scarif-0.duckdns.org |
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
| `VITE_REPORT_MANAGEMENT_API_URL` | Report Management backend URL (production) | API config |

**Note**: In dev mode, Vite proxies are used instead of direct API URLs.

## Project Structure

```
src/
  App.tsx                 # Root app component (null stub for MF compat)
  main.tsx                # Entry point (mock auth, QueryClient)
  index.css               # Tailwind components + utilities + sort arrow styling
  routeTree.gen.ts        # TanStack Router manually maintained route tree
  vite-env.d.ts           # Vite env type declarations
  features/
    revenue/
      components/
        RevenuePage.tsx    # Exposed MF component
        RevenueLayout.tsx  # Tab layout wrapper
  lib/
    utils.ts              # cn() helper
  routes/
    __root.tsx             # Root route
    index.tsx              # Index route (redirect to /revenue/statements)
    revenue.tsx            # Revenue layout route
    revenue/
      index.tsx            # Revenue index (redirect to statements)
      statements.tsx       # Statements tab (F54)
      imports.tsx           # Imports tab (F30)
      commissions.tsx      # Commissions tab (F21)
```

## Tab Structure

| Tab | Route | Feature | Status |
|-----|-------|---------|--------|
| **Statements** | `/revenue/statements` | F54 | Default tab, placeholder |
| **Imports** | `/revenue/imports` | F30 | Placeholder |
| **Commissions** | `/revenue/commissions` | F21 | Placeholder |

## Feature Mapping

- **F54**: Statement Management (primary feature for this MF)
- **F30**: Revenue Data Imports (future)
- **F21**: Commission Calculations (future)

## API Service

- **Primary**: `report-management` — used for F54 statements
- **Production URL**: `https://hncms-report-management.scarif-0.duckdns.org`

## Key Patterns

- **Tables**: Uses @tanstack/react-table for data tables
- **Forms**: Uses react-hook-form + @hookform/resolvers + zod
- **Tabbed layout**: Statements/Imports/Commissions as nested routes
- **API client**: @hnc-partners/api-client + @hnc-partners/shared-types

## Agents

| Agent | When to Invoke |
|-------|----------------|
| **hnc-fe** | React patterns, component questions |
| **fe-master** | Feature coordination |
| **hnc-be** | Report Management API contract |

## Notes

- Part of HNC V3 micro-frontend architecture
- Runs inside hnc-shell in production
- Tailwind config is ESM (`tailwind.config.js`) with mf-accent mapped to `hsl(var(--mf-accent))`
- CSS uses only `@tailwind components` and `@tailwind utilities` (no `@tailwind base` - shell owns base)
- Does NOT use TanStackRouterVite plugin in vite.config.ts (routeTree.gen.ts is manually maintained)
- See `sidecars/hnc-fe/styling-guide.md` for MF CSS patterns
