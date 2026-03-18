import { createFileRoute } from '@tanstack/react-router';
import { ValidationDetailPage } from '@/features/commissions/components/ValidationDetailPage';

/**
 * Validation Detail Sub-Route (FES-04)
 *
 * Per-batch validation drill-down showing discrepancy table.
 * Route: /revenue/commissions/validation/:batchId
 */
export const Route = createFileRoute(
  '/revenue/commissions/validation_/$batchId'
)({
  component: ValidationDetailRoute,
});

function ValidationDetailRoute() {
  const { batchId } = Route.useParams();

  return <ValidationDetailPage batchId={batchId} />;
}
