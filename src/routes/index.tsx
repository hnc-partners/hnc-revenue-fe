import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * Index Route
 *
 * Redirects root path to the default Revenue tab (Statements).
 */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/revenue/statements' });
  },
  component: () => null,
});
