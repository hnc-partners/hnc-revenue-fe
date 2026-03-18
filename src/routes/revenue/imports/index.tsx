import { createFileRoute } from '@tanstack/react-router';
import { ImportDashboard } from '@/features/imports';

/**
 * Import Dashboard Route (F30 — FES-01)
 *
 * Default view for the Imports tab.
 * Renders the paginated table of import batches.
 */
export const Route = createFileRoute('/revenue/imports/')({
  component: ImportDashboard,
});
