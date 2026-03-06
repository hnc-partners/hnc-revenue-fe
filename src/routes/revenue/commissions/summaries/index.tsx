import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * Commission Summaries Route
 *
 * Aggregated commission summaries (F21).
 */
export const Route = createFileRoute('/revenue/commissions/summaries/')({
  component: () => <PlaceholderPage title="Commission Summaries" description="Aggregated commission summaries — Coming soon" />,
});
