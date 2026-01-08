# HNC Frontend Template

A starter template for HNC micro-frontends with authentication, routing, and shared UI components.

## Features

- React 19 + TypeScript
- TanStack Router for file-based routing
- TanStack Query for data fetching
- Tailwind CSS with HNC design tokens
- Authentication context with protected routes
- Shared UI components from `@hnc-partners/ui-components`

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint

## Project Structure

```
src/
├── main.tsx              # Application entry point
├── App.tsx               # Root component with router
├── index.css             # Global styles + Tailwind
├── routes/               # Route components
│   ├── __root.tsx        # Root layout
│   ├── index.tsx         # Home/dashboard
│   └── login.tsx         # Login page
├── components/           # Shared components
│   ├── AppHeader.tsx     # Application header
│   ├── Layout.tsx        # Page layout
│   └── ProtectedRoute.tsx
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication state
├── hooks/                # Custom hooks
│   └── useAuth.ts        # Auth hook
├── lib/                  # Utilities
│   └── api.ts            # API client
└── types/                # TypeScript types
    └── auth.ts           # Auth types
```

## Authentication

The template includes a stub authentication system that stores user state in localStorage. To integrate with a real auth API:

1. Update `src/lib/api.ts` with your API client configuration
2. Update `src/contexts/AuthContext.tsx` to call real auth endpoints
3. Update `src/types/auth.ts` if your user model differs

## Styling

This template uses Tailwind CSS with HNC design tokens:

- **Primary color**: Emerald (#10b981)
- **Font**: Inter
- **Dark mode**: Supported via `.dark` class

The CSS variables are defined in `src/index.css` and match the `@hnc-partners/ui-components` package.

## Creating New Routes

Add new route files in `src/routes/`. The file name becomes the route path:

- `src/routes/about.tsx` -> `/about`
- `src/routes/users/index.tsx` -> `/users`
- `src/routes/users/$id.tsx` -> `/users/:id`

## Protected Routes

Wrap routes that require authentication with `ProtectedRoute`:

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

## License

Private - HNC Partners
