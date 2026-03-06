import { createFileRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { RevenueLayout } from '@/features/revenue/components/RevenueLayout';

/**
 * Revenue Parent Route
 *
 * This route serves as the parent layout for all revenue-related pages.
 * It renders the RevenueLayout with tab navigation and an Outlet for child routes.
 * Three top-level tabs: Statements (F54), Imports (F30), Commissions (F21).
 */
export const Route = createFileRoute('/revenue')({
  component: RevenueRouteComponent,
});

function RevenueRouteComponent() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract the active tab from the current path
  // /revenue/statements -> 'statements'
  // /revenue/imports -> 'imports'
  // /revenue/commissions -> 'commissions'
  // /revenue/data -> maps to 'imports' tab
  // /revenue/coverage -> maps to 'imports' tab
  const pathParts = location.pathname.split('/').filter(Boolean);
  const subPath = pathParts[1] || 'statements';

  // Map sub-routes to tabs
  const tabMapping: Record<string, string> = {
    statements: 'statements',
    imports: 'imports',
    data: 'imports',
    coverage: 'imports',
    commissions: 'commissions',
  };
  const activeTab = tabMapping[subPath] || 'statements';

  const handleTabChange = (tab: string) => {
    navigate({ to: `/revenue/${tab}` });
  };

  return (
    <RevenueLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <Outlet />
    </RevenueLayout>
  );
}
