import { createFileRoute } from '@tanstack/react-router';
import { BrandConfigPage } from '@/features/statements/components/BrandConfigPage';

/**
 * Create New Brand Config Route (F54 — FE-5)
 */
export const Route = createFileRoute('/revenue/statements/config/new')({
  component: NewBrandPage,
});

function NewBrandPage() {
  return <BrandConfigPage />;
}
