import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * Summaries By Brand Route
 *
 * Commission summaries grouped by brand (F21).
 */
export const Route = createFileRoute('/revenue/commissions/summaries/by-brand')({
  component: () => <PlaceholderPage title="Summaries By Brand" description="Commission summaries grouped by brand — Coming soon" />,
});
