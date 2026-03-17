import { createFileRoute } from '@tanstack/react-router';
import { GapsPage } from '@/features/statements/components/GapsPage';

/**
 * Statement Gaps Route (F54 — FE-4)
 *
 * Matrix visualization showing missing statement periods across brands.
 */
export const Route = createFileRoute('/revenue/statements/gaps')({
  component: GapsPage,
});
