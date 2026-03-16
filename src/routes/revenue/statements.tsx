import { createFileRoute } from '@tanstack/react-router';

/**
 * Statements Tab Route (F54)
 *
 * Route for the Revenue Statements tab.
 * Placeholder — real content will be implemented in subsequent stories.
 */
export const Route = createFileRoute('/revenue/statements')({
  component: StatementsTab,
});

function StatementsTab() {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Statements</h1>
        </div>
      </div>
      <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          <p className="text-sm">Statement management will be implemented here (F54).</p>
        </div>
      </div>
    </div>
  );
}
