import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * Coverage Report Route
 *
 * Revenue coverage analysis and configuration (F30).
 */
export const Route = createFileRoute('/revenue/coverage')({
  component: () => <PlaceholderPage title="Coverage Report" description="Revenue coverage analysis and configuration — Coming soon" />,
});
