import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * Revenue Index Route
 *
 * Redirects /revenue/ to /revenue/statements (default tab).
 */
export const Route = createFileRoute('/revenue/')({
  beforeLoad: () => {
    throw redirect({ to: '/revenue/statements/' });
  },
  component: () => null,
});
