import { createFileRoute } from '@tanstack/react-router';
import { BatchDetail } from '@/features/imports/components/BatchDetail';

/**
 * Batch Detail Route (F30 — FES-03)
 *
 * Import batch detail view with tabs: Files, Processing Results, Audit Log.
 * Route: /revenue/imports/:batchId
 */
export const Route = createFileRoute('/revenue/imports/$batchId')({
  component: BatchDetailRoute,
});

function BatchDetailRoute() {
  const { batchId } = Route.useParams();

  return <BatchDetail batchId={batchId} />;
}
