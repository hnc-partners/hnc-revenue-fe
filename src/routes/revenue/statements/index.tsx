import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * Statements Index Route — Brand Dashboard
 *
 * Overview of all brand statements (F54).
 */
export const Route = createFileRoute('/revenue/statements/')({
  component: () => <PlaceholderPage title="Statements — Brand Dashboard" description="Overview of brand statement status and automation — Coming soon" />,
});
