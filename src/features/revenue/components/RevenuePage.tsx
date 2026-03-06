/**
 * RevenuePage.tsx
 *
 * Main page component for Revenue — MF entry point.
 * Manages internal tab state and renders the appropriate tab content.
 * Used when revenue-fe is loaded as a micro-frontend in the shell.
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
