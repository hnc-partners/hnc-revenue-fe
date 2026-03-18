import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * Commissions Index Route
 *
 * Redirects /revenue/commissions/ to /revenue/commissions/results
 */
export const Route = createFileRoute('/revenue/commissions/')({
  beforeLoad: () => {
    throw redirect({ to: '/revenue/commissions/results' });
  },
});
