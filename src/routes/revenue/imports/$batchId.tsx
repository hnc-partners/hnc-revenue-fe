import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * Batch Detail Route
 *
 * Detailed view for a specific import batch (F30).
 */
export const Route = createFileRoute('/revenue/imports/$batchId')({
  component: BatchDetailPage,
});

function BatchDetailPage() {
  const { batchId } = Route.useParams();
  return <PlaceholderPage title={`Batch Detail — ${batchId}`} description="Batch processing status, logs, and revenue records — Coming soon" />;
}
