import { createFileRoute } from '@tanstack/react-router';
import { CommissionResultsPage } from '@/features/commissions';

/**
 * Commission Results Sub-Route (FES-01)
 *
 * Renders the Commission Results view as a sub-tab under Commissions.
 */
export const Route = createFileRoute('/revenue/commissions/results')({
  component: CommissionResultsPage,
});
