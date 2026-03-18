import { createFileRoute, Outlet } from '@tanstack/react-router';

/**
 * Imports Layout Route (F30)
 *
 * Parent layout for import-related sub-routes.
 * Renders an Outlet so child routes (index, new, $batchId) can render within.
 */
export const Route = createFileRoute('/revenue/imports')({
  component: ImportsLayout,
});

function ImportsLayout() {
  return <Outlet />;
}
