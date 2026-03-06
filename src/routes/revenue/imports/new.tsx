import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * New Import Route — Import Wizard
 *
 * Create a new revenue import batch (F30).
 */
export const Route = createFileRoute('/revenue/imports/new')({
  component: () => <PlaceholderPage title="New Import" description="Import wizard for creating new revenue batches — Coming soon" />,
});
