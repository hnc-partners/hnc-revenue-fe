import { createFileRoute } from '@tanstack/react-router';
import { ImportWizard } from '@/features/imports/components/ImportWizard';

/**
 * New Import Route (F30 — FES-02)
 *
 * Multi-step import wizard: Create Batch -> Upload Files -> Process
 */
export const Route = createFileRoute('/revenue/imports/new')({
  component: ImportWizard,
});
