import { createFileRoute } from '@tanstack/react-router';
import { ValidationOverviewPage } from '@/features/commissions/components/ValidationOverviewPage';

/**
 * Commission Validation Sub-Route (FES-04)
 *
 * Landing page showing validation overview per brand.
 * Click a row to drill down to per-batch detail.
 */
export const Route = createFileRoute('/revenue/commissions/validation')({
  component: ValidationOverviewPage,
});
