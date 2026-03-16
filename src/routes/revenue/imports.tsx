import { createFileRoute } from '@tanstack/react-router';

/**
 * Imports Tab Route (F30)
 *
 * Route for the Revenue Imports tab.
 * Placeholder — will be implemented in a future feature.
 */
export const Route = createFileRoute('/revenue/imports')({
  component: ImportsTab,
});

function ImportsTab() {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Imports</h1>
        </div>
      </div>
      <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          <p className="text-sm">Import management will be implemented here (F30).</p>
        </div>
      </div>
    </div>
  );
}
