import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * Revenue Data Browser Route
 *
 * Browse imported revenue data (F30).
 */
export const Route = createFileRoute('/revenue/data/')({
  component: () => <PlaceholderPage title="Revenue Browser" description="Browse and search imported revenue data — Coming soon" />,
});
