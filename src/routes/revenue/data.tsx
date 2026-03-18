import { createFileRoute } from '@tanstack/react-router';
import { RevenueBrowser } from '@/features/revenue-data';

/**
 * Revenue Data Route (FES-04)
 *
 * Revenue Browser — paginated table of revenue records with filters,
 * side panel for details, and by-player view.
 */
export const Route = createFileRoute('/revenue/data')({
  component: RevenueBrowser,
});
