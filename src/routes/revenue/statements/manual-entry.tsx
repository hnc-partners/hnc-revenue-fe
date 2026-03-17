import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ManualEntryPage } from '@/features/statements/components/manual-entry/ManualEntryPage';

/**
 * Manual Entry Route (F54 — FE-3)
 *
 * Form for manual statement entry.
 * Accepts ?brandCode=X to pre-select a brand.
 */

const manualEntrySearchSchema = z.object({
  brandCode: z.string().optional(),
});

export const Route = createFileRoute('/revenue/statements/manual-entry')({
  component: ManualEntryRoute,
  validateSearch: manualEntrySearchSchema,
});

function ManualEntryRoute() {
  const { brandCode } = Route.useSearch();

  return <ManualEntryPage initialBrandCode={brandCode} />;
}
