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
import { StatementsPlaceholder } from './statements/StatementsPlaceholder';
import { ImportsPlaceholder } from './imports/ImportsPlaceholder';
import { CommissionsPlaceholder } from './commissions/CommissionsPlaceholder';

export function RevenuePage() {
  const [activeTab, setActiveTab] = useState('statements');

  return (
    <RevenueLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'statements' && <StatementsPlaceholder />}
      {activeTab === 'imports' && <ImportsPlaceholder />}
      {activeTab === 'commissions' && <CommissionsPlaceholder />}
    </RevenueLayout>
  );
}

export default RevenuePage;
