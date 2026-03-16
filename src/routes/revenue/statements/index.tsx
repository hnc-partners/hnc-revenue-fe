import { createFileRoute } from '@tanstack/react-router';
import { BrandDashboard } from '@/features/statements';

/**
 * Statements Index Route (F54 — FE-1)
 *
 * Brand dashboard showing all brands with statement acquisition status.
 */
export const Route = createFileRoute('/revenue/statements/')({
  component: BrandDashboard,
});
