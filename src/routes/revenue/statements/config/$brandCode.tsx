import { createFileRoute } from '@tanstack/react-router';
import { BrandConfigPage } from '@/features/statements/components/BrandConfigPage';

/**
 * Edit Brand Config Route (F54 — FE-5)
 */
export const Route = createFileRoute('/revenue/statements/config/$brandCode')({
  component: EditBrandPage,
});

function EditBrandPage() {
  const { brandCode } = Route.useParams();
  return <BrandConfigPage brandCode={brandCode} />;
}
