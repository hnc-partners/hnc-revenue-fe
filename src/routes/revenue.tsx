import { createFileRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { RevenueLayout } from '@/features/revenue/components/RevenueLayout';

/**
 * Revenue Parent Route
 *
 * This route serves as the parent layout for all revenue-related pages.
 * It renders the RevenueLayout with tab navigation and an Outlet for child routes.
 */
export const Route = createFileRoute('/revenue')({
  component: RevenueRouteComponent,
});

function RevenueRouteComponent() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract the active tab from the current path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeTab = pathParts[1] || 'statements';

  const handleTabChange = (tab: string) => {
    navigate({ to: `/revenue/${tab}` });
  };

  return (
    <RevenueLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <Outlet />
    </RevenueLayout>
  );
}
