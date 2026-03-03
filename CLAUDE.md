# HNC Frontend Template

Starter template for HNC micro-frontends. Clone this repo and customize for your specific service.

## Quick Reference

| Aspect | Value |
|--------|-------|
| **Type** | MF Remote Template |
| **Runtime** | Vite 6 + React 19 + TypeScript |
| **Framework** | React + TypeScript + TanStack |
| **Dev Port** | 5173 (default Vite - reassign per port-registry.md) |
| **Accent Color** | Placeholder - customize per service |
| **API Backend** | Configure via VITE_API_TARGET |
| **MF Plugin** | @module-federation/vite ^1.3.0 |

## Structure

```
src/
├── main.tsx              # Application entry point
├── App.tsx               # Root component with router
├── index.css             # Tailwind components + utilities (no :root, no @tailwind base)
├── routes/               # TanStack Router file-based routes
│   ├── __root.tsx        # Root layout
│   ├── index.tsx         # Dashboard/home
│   └── login.tsx         # Login page
├── components/           # Shared components (app-level)
│   ├── AppHeader.tsx     # Application header
│   ├── Layout.tsx        # Page layout
│   └── ProtectedRoute.tsx
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication state
├── hooks/                # Custom hooks
│   └── useAuth.ts        # Auth hook
├── lib/                  # Utilities
│   ├── api.ts            # API client
│   └── utils.ts          # Utility functions (cn helper)
└── types/                # TypeScript types
    └── auth.ts           # Auth types
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Routing** | TanStack Router ^1.157.15 (file-based) |
| **Data Fetching** | TanStack Query ^5.62.16 |
| **Forms** | React Hook Form ^7.71.1 + Zod ^3.24.1 + @hookform/resolvers ^5.2.2 |
| **Styling** | Tailwind CSS ^3.4.17 + tailwindcss-animate ^1.0.7 |
| **UI Components** | @hnc-partners/ui-components ^0.2.36 |
| **MF Federation** | @module-federation/vite ^1.3.0 |
| **CSS Bundling** | vite-plugin-css-injected-by-js (remotes only) |
| **Build** | Vite ^6.0.6 + TypeScript ^5.7.2 |

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm typecheck    # TypeScript type checking
pnpm lint         # ESLint
```

## Module Federation

### MF Config (in vite.config.ts)

- **Name**: `SERVICE_NAME` (replace with your MF name)
- **Filename**: `remoteEntry.js`
- **Base URL (prod)**: `https://hncms-SERVICE_NAME-fe.scarif-0.duckdns.org/`
- **Shared**: react, react-dom, @tanstack/react-query, @hnc-partners/auth-context (all singletons)
- **Federation only in production** - dev mode runs standalone

### CSS Injection

Uses `vite-plugin-css-injected-by-js` to bundle CSS into remoteEntry.js for MF compatibility.

## Customizing for Your Service

When using this template for a new frontend:

1. **Update package.json**: Change `name` to `@hnc-partners/{service}-fe`
2. **Update vite.config.ts**: Replace `SERVICE_NAME` with your MF name, set correct port
3. **Set accent color**: Shell provides `--mf-accent` via `[data-mf="your-service"]` -- no :root CSS needed
4. **Configure API**: Set `VITE_API_TARGET` in `.env.example` and `.env.local`
5. **Update this CLAUDE.md**: Replace template descriptions with service-specific info
6. **Add feature folders**: Create `src/features/{your-feature}/` for domain logic
7. **Expose MF components**: Add to `exposes` in vite.config.ts federation config

## Accent Color (MF Identity)

Shell provides `--mf-accent` via `[data-mf="your-service"]` scoped CSS vars in `shell/src/index.css`. This MF does NOT define `:root` CSS variables (PLAN-050).

Use `text-mf-accent`, `bg-mf-accent/10` -- NOT hardcoded Tailwind colors.

### Accent Colors by Service

| Service | Color | Hex |
|---------|-------|-----|
| Labels | Steel Blue | #456882 |
| Brands | Violet | #8b5cf6 |
| Contacts | Teal | #14b8a6 |
| Deals | Amber | #f59e0b |
| Gaming Accounts | Indigo | #6366f1 |
| Auth | Steel Blue | #456882 |

## Tailwind Config (PLAN-049 Standard)

The `tailwind.config.js` follows the PLAN-049 standard:

- **ESM format** (`export default`)
- **tailwindcss-animate** plugin (required for shadcn/ui animations)
- **@hnc-partners/ui-components** in content paths (required for class scanning)
- **mf-accent** color token mapped to `hsl(var(--mf-accent))`
- **shadow-panel** custom shadow via `var(--shadow-panel)`
- **HNC semantic tokens**: brand, success, warning, info (all via CSS vars)
- **No :root CSS** in this MF -- shell owns all theme variables (PLAN-050)

### CSS Rules for MFs

- `index.css` uses ONLY `@tailwind components` and `@tailwind utilities`
- NO `@tailwind base` -- shell owns base styles
- NO `:root` CSS variables -- shell owns all theme vars

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_TARGET` | Proxy target for `/api` (defaults to deployed URL) |
| `VITE_AUTH_URL` | Auth service URL for token refresh |
| `VITE_APP_NAME` | Application display name |
| `VITE_MOCK_AUTH` | Enable mock auth for standalone dev (`true`/`false`) |

## API Integration

### Query Pattern

```tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => api.get('/items').then(r => r.data),
  });
}
```

### Mutation Pattern

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post('/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
```

## UI Components

Import shared components from `@hnc-partners/ui-components`:

```tsx
import { Button, Card, Table } from '@hnc-partners/ui-components';
```

## Docker

Build and deploy:
```bash
podman build -t hnc-fe-{service}:latest .
podman run -d -p 8080:80 --name {service}-fe hnc-fe-{service}:latest
```

## Key Patterns

### Feature Folders (Recommended)

Organize by domain, not by type:
```
src/features/{service}/
├── api/{service}-api.ts
├── components/{Service}Page.tsx
├── hooks/use-{service}.ts
├── types/index.ts
└── index.ts
```

### Form Validation (React Hook Form + Zod)

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Required'),
});

function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });
  // ...
}
```

## Agents

| Agent | When to Invoke |
|-------|----------------|
| **hnc-fe** | React patterns, components, TanStack usage |
| **fe-master** | FE coordination, feature planning |
| **hnc-be** | API contract questions |
| **hnc-db** | Data model understanding |

## Development Notes

- **State**: Prefer TanStack Query for server state; use React state/context for UI state only
- **Forms**: Use React Hook Form + Zod for type-safe validation
- **Styling**: Use Tailwind utilities; avoid inline styles; use mf-accent for identity color
- **Testing**: Colocate tests with features (`*.test.tsx` next to components)
- **GitHub Packages**: Requires GITHUB_TOKEN for @hnc-partners/* packages (see README.md)
- **Standalone dev**: Shows 401s for API data (no shell auth context) -- expected for layout verification
