import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * Statement Configuration Route
 *
 * Configure brand reporting settings and scheduler (F54).
 */
export const Route = createFileRoute('/revenue/statements/config')({
  component: () => <PlaceholderPage title="Statement Configuration" description="Brand reporting configuration and service scheduler — Coming soon" />,
});
