/**
 * RevenueLayout.tsx
 *
 * Main layout component for the Revenue section.
 * Provides tab navigation that wraps all revenue-related pages.
 * Each tab manages its own inline header with title and action buttons.
 */

import { ReactNode, useEffect } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@hnc-partners/ui-components';

interface RevenueLayoutProps {
  /** The currently active tab identifier */
  activeTab: string;
  /** Callback when a tab is selected */
  onTabChange: (tab: string) => void;
  /** Child content to render in the tab panel area */
  children: ReactNode;
}

/** Tab configuration for the revenue section */
const TABS = [
  { id: 'statements', label: 'Statements', subLabel: 'Revenue statement management (F54)' },
  { id: 'imports', label: 'Imports', subLabel: 'Revenue data imports (F30)' },
  { id: 'commissions', label: 'Commissions', subLabel: 'Commission calculations (F21)' },
  { id: 'data', label: 'Data', subLabel: 'Revenue data browser (FES-04)' },
  { id: 'coverage', label: 'Coverage', subLabel: 'Coverage report (FES-05)' },
] as const;

export function RevenueLayout({ activeTab, onTabChange, children }: RevenueLayoutProps) {
  // Update document title based on active tab
  useEffect(() => {
    const currentTab = TABS.find(tab => tab.id === activeTab);
    const tabLabel = currentTab?.label || 'Revenue';
    document.title = `Revenue - ${tabLabel} | HNC`;
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b border-border bg-background px-6">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="h-12 bg-transparent p-0 w-full justify-start gap-0">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 text-sm font-medium text-muted-foreground transition-none data-[state=active]:border-mf-accent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                title={tab.subLabel}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
