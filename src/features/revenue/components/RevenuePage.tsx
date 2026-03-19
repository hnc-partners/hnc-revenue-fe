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
import { RevenueLayout } from './RevenueLayout';
import { BrandDashboard } from '@/features/statements';
import { ImportDashboard } from '@/features/imports';
import { CommissionResultsPage } from '@/features/commissions';
import { RevenueBrowser } from '@/features/revenue-data';
import { CoverageReport } from '@/features/coverage';

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
        <TabErrorBoundary tabName="Commissions">
          <CommissionResultsPage />
        </TabErrorBoundary>
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
