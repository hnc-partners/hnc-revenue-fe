/**
 * RevenuePage.tsx
 *
 * The main exposed MF component for Revenue.
 * Shell loads this via Module Federation.
 *
 * Uses React state for tab management (no private router).
 * The shell provides RouterProvider — exposed components MUST NOT
 * create their own router instance (M08/M09 compliance).
 *
 * Components that use TanStack Router hooks (useSearch, useNavigate) are
 * wrapped in TabErrorBoundary for graceful degradation when router context
 * is unavailable (MF mode vs standalone routing mode).
 *
 * Dual export pattern (REQUIRED for MF lazy loading):
 * - Named export (primary)
 * - Default export (required for MF lazy loading)
 */

import { Component, useState, type ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@hnc-partners/ui-components';
import { RevenueLayout } from './RevenueLayout';
import { BrandDashboard } from '@/features/statements';
import { ImportDashboard } from '@/features/imports';
import {
  CommissionResultsPage,
  CommissionSummaryPage,
  ValidationOverviewPage,
  ValidationDetailPage,
} from '@/features/commissions';
import { RevenueBrowser } from '@/features/revenue-data';
import { CoverageReport } from '@/features/coverage';

/** Sub-tab configuration for Commissions */
const COMMISSION_SUB_TABS = [
  { id: 'results', label: 'Results' },
  { id: 'summaries', label: 'Summaries' },
  { id: 'validation', label: 'Validation' },
] as const;

type CommissionSubTab = (typeof COMMISSION_SUB_TABS)[number]['id'];

/** Error boundary that shows a fallback message when a tab component fails to render */
class TabErrorBoundary extends Component<
  { children: ReactNode; tabName: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">{this.props.tabName}</h3>
            <p className="text-sm text-muted-foreground">
              Something went wrong loading this tab. Try refreshing the page.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function RevenuePage() {
  const [activeTab, setActiveTab] = useState('statements');
  const [commissionSubTab, setCommissionSubTab] =
    useState<CommissionSubTab>('results');
  // State for validation drill-down (overview -> detail)
  const [validationBatchId, setValidationBatchId] = useState<string | null>(
    null
  );

  const handleCommissionSubTabChange = (value: string) => {
    setCommissionSubTab(value as CommissionSubTab);
    // Reset validation detail when switching sub-tabs
    setValidationBatchId(null);
  };

  return (
    <RevenueLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'statements' && (
        <TabErrorBoundary tabName="Statements">
          <BrandDashboard />
        </TabErrorBoundary>
      )}
      {activeTab === 'imports' && (
        <TabErrorBoundary tabName="Imports">
          <ImportDashboard />
        </TabErrorBoundary>
      )}
      {activeTab === 'commissions' && (
        <div className="flex flex-col h-full">
          {/* Commission sub-tab navigation */}
          <div className="border-b border-border bg-background/50 px-4 sm:px-6 lg:px-8">
            <Tabs
              value={commissionSubTab}
              onValueChange={handleCommissionSubTabChange}
            >
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

          {/* Commission sub-tab content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {commissionSubTab === 'results' && (
              <TabErrorBoundary tabName="Commission Results">
                <CommissionResultsPage />
              </TabErrorBoundary>
            )}
            {commissionSubTab === 'summaries' && (
              <TabErrorBoundary tabName="Commission Summaries">
                <CommissionSummaryPage />
              </TabErrorBoundary>
            )}
            {commissionSubTab === 'validation' && (
              <TabErrorBoundary tabName="Commission Validation">
                {validationBatchId ? (
                  <ValidationDetailPage
                    batchId={validationBatchId}
                    onBack={() => setValidationBatchId(null)}
                  />
                ) : (
                  <ValidationOverviewPage
                    onBatchSelect={setValidationBatchId}
                  />
                )}
              </TabErrorBoundary>
            )}
          </div>
        </div>
      )}
      {activeTab === 'data' && (
        <TabErrorBoundary tabName="Data">
          <RevenueBrowser />
        </TabErrorBoundary>
      )}
      {activeTab === 'coverage' && (
        <TabErrorBoundary tabName="Coverage">
          <CoverageReport />
        </TabErrorBoundary>
      )}
    </RevenueLayout>
  );
}

export default RevenuePage;
