import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * Validation Overview Route
 *
 * Commission validation overview and warnings (F21).
 */
export const Route = createFileRoute('/revenue/commissions/validation')({
  component: () => <PlaceholderPage title="Validation Overview" description="Commission validation checks and warnings — Coming soon" />,
});
