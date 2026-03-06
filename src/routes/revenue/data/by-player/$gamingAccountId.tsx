import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * Revenue By Player Route
 *
 * View revenue data for a specific gaming account (F30).
 */
export const Route = createFileRoute('/revenue/data/by-player/$gamingAccountId')({
  component: ByPlayerPage,
});

function ByPlayerPage() {
  const { gamingAccountId } = Route.useParams();
  return <PlaceholderPage title={`Revenue By Player — ${gamingAccountId}`} description="Player-specific revenue records — Coming soon" />;
}
