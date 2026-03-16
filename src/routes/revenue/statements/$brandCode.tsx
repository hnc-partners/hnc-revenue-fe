import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@hnc-partners/ui-components';

/**
 * Brand Detail Route (F54 — FE-2 placeholder)
 *
 * Placeholder page for brand statement detail view.
 * Will be implemented in FE-2.
 */
export const Route = createFileRoute('/revenue/statements/$brandCode')({
  component: BrandDetailPlaceholder,
});

function BrandDetailPlaceholder() {
  const { brandCode } = Route.useParams();

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/revenue/statements">
            <Button variant="ghost" size="icon" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-foreground">
            Brand Detail: {brandCode}
          </h1>
        </div>
      </div>
      <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          <p className="text-sm">
            Brand detail view will be implemented in FE-2.
          </p>
        </div>
      </div>
    </div>
  );
}
