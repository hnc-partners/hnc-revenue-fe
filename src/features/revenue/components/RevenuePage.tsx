/**
 * RevenuePage.tsx
 *
 * The main exposed MF component for Revenue.
 * Shell loads this via Module Federation.
 *
 * Uses the shell's TanStack Router context for URL-based tab routing.
 * Exposed components MUST NOT create their own router instance (M08/M09),
 * but CAN use useRouterState/useNavigate from the shell's router context.
 *
 * Dual export pattern (REQUIRED for MF lazy loading):
 * - Named export (primary)
 * - Default export (required for MF lazy loading)
 */

import { useCallback, useMemo } from 'react';
import { useRouterState, useNavigate } from '@tanstack/react-router';
import { RevenueLayout } from './RevenueLayout';
import { BrandDashboard } from '@/features/statements';
import { ImportsPlaceholder } from './imports/ImportsPlaceholder';
import {
  CommissionResultsPage,
  CommissionSummaryPage,
  ValidationOverviewPage,
  ValidationDetailPage,
} from '@/features/commissions';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@hnc-partners/ui-components';

/** Commission sub-tabs */
const COMMISSION_SUB_TABS = [
  { id: 'results', label: 'Results', path: '/revenue/commissions/results' },
  { id: 'summary', label: 'Summaries', path: '/revenue/commissions/summary' },
  { id: 'validation', label: 'Validation', path: '/revenue/commissions/validation' },
] as const;

/** Commission sub-tab layout for MF mode */
function CommissionsContent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  // Derive sub-tab and batchId from current URL
  const { subTab, batchId } = useMemo(() => {
    if (pathname.includes('/validation/')) {
      const match = pathname.match(/\/validation\/([^/]+)/);
      return { subTab: 'validation', batchId: match?.[1] };
    }
    if (pathname.includes('/validation')) return { subTab: 'validation', batchId: undefined };
    if (pathname.includes('/summary')) return { subTab: 'summary', batchId: undefined };
    return { subTab: 'results', batchId: undefined };
  }, [pathname]);

  const handleSubTabChange = useCallback((tabId: string) => {
    const tab = COMMISSION_SUB_TABS.find((t) => t.id === tabId);
    if (tab) {
      navigate({ to: tab.path });
    }
  }, [navigate]);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab navigation */}
      <div className="border-b border-border bg-background/50 px-4 sm:px-6 lg:px-8">
        <Tabs value={subTab} onValueChange={handleSubTabChange}>
          <TabsList className="h-10 bg-transparent p-0 w-full justify-start gap-0">
            {COMMISSION_SUB_TABS.map((tab) => (
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

      {/* Sub-tab content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {subTab === 'results' && <CommissionResultsPage />}
        {subTab === 'summary' && <CommissionSummaryPage />}
        {subTab === 'validation' && batchId && <ValidationDetailPage batchId={batchId} />}
        {subTab === 'validation' && !batchId && <ValidationOverviewPage />}
      </div>
    </div>
  );
}

export function RevenuePage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  // Derive active primary tab from URL
  const activeTab = useMemo(() => {
    if (pathname.includes('/revenue/commissions')) return 'commissions';
    if (pathname.includes('/revenue/imports')) return 'imports';
    return 'statements';
  }, [pathname]);

  const handleTabChange = useCallback((tab: string) => {
    const paths: Record<string, string> = {
      statements: '/revenue/statements',
      imports: '/revenue/imports',
      commissions: '/revenue/commissions/results',
    };
    navigate({ to: paths[tab] || '/revenue/statements' });
  }, [navigate]);

  return (
    <RevenueLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === 'statements' && <BrandDashboard />}
      {activeTab === 'imports' && <ImportsPlaceholder />}
      {activeTab === 'commissions' && <CommissionsContent />}
    </RevenueLayout>
  );
}

export default RevenuePage;
