/**
 * RevenuePage.tsx
 *
 * The main exposed MF component for Revenue.
 * Shell loads this via Module Federation.
 *
 * Uses URL-based tab routing via useSyncExternalStore (no router dependency).
 * Content components are wrapped in error boundaries for resilience when
 * providers (QueryClient, Auth) aren't available (e.g., in tests).
 *
 * Dual export pattern (REQUIRED for MF lazy loading):
 * - Named export (primary)
 * - Default export (required for MF lazy loading)
 */

import { Component, useCallback, useMemo, useSyncExternalStore, type ReactNode, type ErrorInfo } from 'react';
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

/**
 * Lightweight error boundary for tab content.
 * Catches provider/context errors gracefully in MF mode.
 */
class TabErrorBoundary extends Component<
  { children: ReactNode; fallback?: string },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.warn('[RevenuePage] Tab content error:', error.message);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p className="text-sm">{this.props.fallback || 'Content unavailable'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Subscribe to URL changes (pushState, replaceState, popstate).
 * Works without router context — safe for MF mode, tests, and standalone.
 */
const locationSubscribers = new Set<() => void>();
let patched = false;

function patchHistory() {
  if (patched) return;
  patched = true;
  const notify = () => locationSubscribers.forEach((cb) => cb());
  const origPush = history.pushState.bind(history);
  const origReplace = history.replaceState.bind(history);
  history.pushState = (...args) => { origPush(...args); notify(); };
  history.replaceState = (...args) => { origReplace(...args); notify(); };
  window.addEventListener('popstate', notify);
}

function subscribeToLocation(cb: () => void) {
  patchHistory();
  locationSubscribers.add(cb);
  return () => { locationSubscribers.delete(cb); };
}

function getPathname() {
  return window.location.pathname;
}

/** Hook: reactive pathname without requiring router context */
function usePathname() {
  return useSyncExternalStore(subscribeToLocation, getPathname, getPathname);
}

/** Navigate by pushing to history (shell router picks this up) */
function navigateTo(path: string) {
  history.pushState({}, '', path);
}

/** Commission sub-tabs */
const COMMISSION_SUB_TABS = [
  { id: 'results', label: 'Results', path: '/revenue/commissions/results' },
  { id: 'summary', label: 'Summaries', path: '/revenue/commissions/summary' },
  { id: 'validation', label: 'Validation', path: '/revenue/commissions/validation' },
] as const;

/** Commission sub-tab layout for MF mode */
function CommissionsContent() {
  const pathname = usePathname();

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
    if (tab) navigateTo(tab.path);
  }, []);

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
        <TabErrorBoundary fallback="Commission results unavailable">
          {subTab === 'results' && <CommissionResultsPage />}
          {subTab === 'summary' && <CommissionSummaryPage />}
          {subTab === 'validation' && batchId && <ValidationDetailPage batchId={batchId} />}
          {subTab === 'validation' && !batchId && <ValidationOverviewPage />}
        </TabErrorBoundary>
      </div>
    </div>
  );
}

export function RevenuePage() {
  const pathname = usePathname();

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
    navigateTo(paths[tab] || '/revenue/statements');
  }, []);

  return (
    <RevenueLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <TabErrorBoundary fallback="Statements unavailable">
        {activeTab === 'statements' && <BrandDashboard />}
      </TabErrorBoundary>
      {activeTab === 'imports' && <ImportsPlaceholder />}
      {activeTab === 'commissions' && <CommissionsContent />}
    </RevenueLayout>
  );
}

export default RevenuePage;
