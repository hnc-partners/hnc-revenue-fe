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
 * Dual export pattern (REQUIRED for MF lazy loading):
 * - Named export (primary)
 * - Default export (required for MF lazy loading)
 */

import { useState } from 'react';
import { RevenueLayout } from './RevenueLayout';
import { BrandDashboard } from '@/features/statements';
import { ImportDashboard } from '@/features/imports';
import { CommissionResultsPage } from '@/features/commissions';
import { RevenueBrowser } from '@/features/revenue-data';
import { CoverageReport } from '@/features/coverage';

export function RevenuePage() {
  const [activeTab, setActiveTab] = useState('statements');

  return (
    <RevenueLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'statements' && <BrandDashboard />}
      {activeTab === 'imports' && <ImportDashboard />}
      {activeTab === 'commissions' && <CommissionResultsPage />}
      {activeTab === 'data' && <RevenueBrowser />}
      {activeTab === 'coverage' && <CoverageReport />}
    </RevenueLayout>
  );
}

export default RevenuePage;
