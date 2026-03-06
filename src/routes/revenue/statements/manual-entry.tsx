import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * Manual Entry Route
 *
 * Create and manage manual statement entries (F54).
 */
export const Route = createFileRoute('/revenue/statements/manual-entry')({
  component: () => <PlaceholderPage title="Manual Entry" description="Create and submit manual statement entries — Coming soon" />,
});
