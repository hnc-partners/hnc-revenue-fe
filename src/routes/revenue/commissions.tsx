import { createFileRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@hnc-partners/ui-components';

/**
 * Commissions Layout Route (F21)
 *
 * Parent layout for commission-related sub-routes.
 * Provides secondary tab navigation: Results | Summaries | Validation
 */
export const Route = createFileRoute('/revenue/commissions')({
  component: CommissionsLayout,
});

/** Sub-tab configuration */
const SUB_TABS = [
  { id: 'results', label: 'Results', path: '/revenue/commissions/results' },
  { id: 'summary', label: 'Summaries', path: '/revenue/commissions/summary' },
  { id: 'validation', label: 'Validation', path: '/revenue/commissions/validation' },
] as const;

function CommissionsLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract active sub-tab from path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeSubTab = pathParts[2] || 'results';

  const handleTabChange = (tabId: string) => {
    const tab = SUB_TABS.find((t) => t.id === tabId);
    if (tab) {
      navigate({ to: tab.path });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab navigation */}
      <div className="border-b border-border bg-background/50 px-4 sm:px-6 lg:px-8">
        <Tabs value={activeSubTab} onValueChange={handleTabChange}>
          <TabsList className="h-10 bg-transparent p-0 w-full justify-start gap-0">
            {SUB_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 text-sm font-medium text-muted-foreground transition-none data-[state=active]:border-mf-accent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Sub-route content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
