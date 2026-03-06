import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * Gap Detection Route
 *
 * View and manage detected gaps in statement data (F54).
 */
export const Route = createFileRoute('/revenue/statements/gaps')({
  component: () => <PlaceholderPage title="Gap Detection" description="Identify and resolve missing statement periods — Coming soon" />,
});
