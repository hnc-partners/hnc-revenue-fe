import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * Imports Index Route — Batch List
 *
 * List of all revenue import batches (F30).
 */
export const Route = createFileRoute('/revenue/imports/')({
  component: () => <PlaceholderPage title="Imports — Batch List" description="View and manage revenue import batches — Coming soon" />,
});
