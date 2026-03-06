import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * Commissions Index Route — Results
 *
 * Commission calculation results (F21).
 */
export const Route = createFileRoute('/revenue/commissions/')({
  component: () => <PlaceholderPage title="Commission Results" description="View commission calculation results — Coming soon" />,
});
