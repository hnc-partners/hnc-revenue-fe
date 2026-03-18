import { createFileRoute } from '@tanstack/react-router';
import { CoverageReport } from '@/features/coverage';

/**
 * Revenue Coverage Route (FES-05)
 *
 * Coverage Report — matrix view of brand reporting coverage,
 * plus brand config management.
 */
export const Route = createFileRoute('/revenue/coverage')({
  component: CoverageReport,
});
