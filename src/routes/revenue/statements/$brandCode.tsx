import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

/**
 * Brand Detail Route
 *
 * Detailed view for a specific brand's statement configuration and runs (F54).
 */
export const Route = createFileRoute('/revenue/statements/$brandCode')({
  component: BrandDetailPage,
});

function BrandDetailPage() {
  const { brandCode } = Route.useParams();
  return <PlaceholderPage title={`Brand Detail — ${brandCode}`} description="Brand statement configuration, runs, and upload — Coming soon" />;
}
