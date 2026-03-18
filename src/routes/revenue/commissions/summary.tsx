import { createFileRoute } from '@tanstack/react-router';
import { CommissionSummaryPage } from '@/features/commissions';

/**
 * Commission Summary Sub-Route (FES-02)
 *
 * Renders the Commission Summary Dashboard as a sub-tab under Commissions.
 */
export const Route = createFileRoute('/revenue/commissions/summary')({
  component: CommissionSummaryPage,
});
