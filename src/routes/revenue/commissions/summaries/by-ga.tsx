import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * Summaries By Gaming Account Route
 *
 * Commission summaries grouped by gaming account (F21).
 */
export const Route = createFileRoute('/revenue/commissions/summaries/by-ga')({
  component: () => <PlaceholderPage title="Summaries By Gaming Account" description="Commission summaries grouped by gaming account — Coming soon" />,
});
