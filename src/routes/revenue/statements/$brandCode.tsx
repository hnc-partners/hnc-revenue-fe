import { createFileRoute } from '@tanstack/react-router';
import { BrandDetail } from '@/features/statements/components/BrandDetail';

/**
 * Brand Detail Route (F54 — FE-2)
 *
 * Brand detail view with info header, run history, period timeline,
 * and context-dependent actions.
 */
export const Route = createFileRoute('/revenue/statements/$brandCode')({
  component: BrandDetailPage,
});

function BrandDetailPage() {
  const { brandCode } = Route.useParams();

  return <BrandDetail brandCode={brandCode} />;
}
