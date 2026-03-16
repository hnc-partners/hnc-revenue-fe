import { createFileRoute, Outlet } from '@tanstack/react-router';

/**
 * Statements Layout Route (F54)
 *
 * Parent layout for statement-related routes.
 * Renders an Outlet so child routes (index, $brandCode) can render within.
 */
export const Route = createFileRoute('/revenue/statements')({
  component: StatementsLayout,
});

function StatementsLayout() {
  return <Outlet />;
}
