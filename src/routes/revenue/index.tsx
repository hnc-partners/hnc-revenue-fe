import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * Revenue Index Route
 *
 * Redirects /revenue/ to the default tab (Statements).
 */
export const Route = createFileRoute('/revenue/')({
  beforeLoad: () => {
    throw redirect({ to: '/revenue/statements' });
  },
  component: () => null,
});
