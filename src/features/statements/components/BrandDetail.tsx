/**
 * BrandDetail.tsx
 *
 * FE-2: Brand detail panel showing brand info, run history, period timeline,
 * and context-dependent actions. Navigated to from brand cards on the dashboard.
 *
 * Route: /revenue/statements/:brandCode
 */

import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
} from 'lucide-react';
import { Button, Skeleton, Badge } from '@hnc-partners/ui-components';
import { useBrandConfig } from '../api';
import { AcquisitionModeBadge } from './AcquisitionModeBadge';
import { BrandStatusIndicator } from './BrandStatusIndicator';
import { RunHistory } from './RunHistory';
import { PeriodTimeline } from './PeriodTimeline';
import { BrandActions } from './BrandActions';
import { BrandConfigDialog } from './forms/BrandConfigDialog';
import type { RMBrandConfigWithActivity, BrandHealth } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(isoString: string | null): string {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function describeCron(cron: string | null): string {
  if (!cron) return 'No schedule';
  // Simple description for common patterns
  const parts = cron.split(' ');
  if (parts.length === 5) {
    const [min, hour, dom, , dow] = parts;
    if (dom === '*' && dow === '*') return `Daily at ${hour}:${min.padStart(2, '0')}`;
    if (dom === '*' && dow !== '*') return `Weekly (day ${dow}) at ${hour}:${min.padStart(2, '0')}`;
    if (dom !== '*') return `Monthly (day ${dom}) at ${hour}:${min.padStart(2, '0')}`;
  }
  return cron;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Brand Info Header Section
// ---------------------------------------------------------------------------

function BrandInfoHeader({ brand }: { brand: RMBrandConfigWithActivity }) {
  // Derive a reasonable health from recent runs (since this type doesn't have health)
  const derivedHealth: BrandHealth = (() => {
    if (!brand.enabled) return 'unknown';
    if (brand.paused) return 'unknown';
    if (brand.recentRuns.length === 0) return 'unknown';
    const lastStatus = brand.recentRuns[0]?.status;
    if (lastStatus === 'success') return 'healthy';
    if (lastStatus === 'partial') return 'warning';
    if (lastStatus === 'failed') return 'critical';
    return 'unknown';
  })();

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Top row: name + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-medium text-foreground truncate">
            {brand.brandName}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {brand.brandCode}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {brand.paused && (
            <Badge variant="warning" className="text-xs">Paused</Badge>
          )}
          {!brand.enabled && (
            <Badge variant="secondary" className="text-xs">Disabled</Badge>
          )}
          {brand.enabled && !brand.paused && (
            <Badge variant="success" className="text-xs">Active</Badge>
          )}
          <BrandStatusIndicator health={derivedHealth} showLabel />
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-2">
        <AcquisitionModeBadge mode={brand.acquisitionMode} />
        <Badge variant="outline" className="text-xs gap-1">
          {brand.granularity.charAt(0).toUpperCase() + brand.granularity.slice(1)}
        </Badge>
        <Badge variant="outline" className="text-xs gap-1">
          {brand.currencyCode}
        </Badge>
      </div>

      {/* Schedule info */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Schedule:</span>
          <span className="text-foreground font-medium truncate">
            {describeCron(brand.scheduleCron)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Updated:</span>
          <span className="text-foreground font-medium truncate">
            {formatDate(brand.updatedAt)}
          </span>
        </div>
      </div>

      {/* File types */}
      {brand.requiredFileTypes.length > 0 && (
        <div className="text-xs">
          <span className="text-muted-foreground">Required files: </span>
          <span className="text-foreground">
            {brand.requiredFileTypes.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main BrandDetail Component
// ---------------------------------------------------------------------------

interface BrandDetailProps {
  brandCode: string;
}

export function BrandDetail({ brandCode }: BrandDetailProps) {
  const { data: brand, isLoading, error, refetch } = useBrandConfig(brandCode);
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-6">
          <DetailSkeleton />
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/revenue/statements">
              <Button variant="ghost" size="icon" aria-label="Back to dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-foreground">Brand Detail</h1>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 pb-6">
          <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
            <div className="rounded-full bg-destructive/10 p-3 mb-4">
              <Calendar className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              Something went wrong
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Could not load brand data for "{brandCode}". Please try again.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header with back button */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/revenue/statements">
            <Button variant="ghost" size="icon" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-foreground truncate">
            {brand.brandName}
          </h1>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1 space-y-6">
        {/* Brand info header */}
        <BrandInfoHeader brand={brand} />

        {/* Actions bar */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">Actions</h3>
          <BrandActions brand={brand} onEditConfig={() => setIsEditOpen(true)} />
        </div>

        {/* Period timeline */}
        {brand.recentRuns.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Period Coverage</h3>
            <div className="rounded-lg border border-border bg-card p-4">
              <PeriodTimeline runs={brand.recentRuns} />
            </div>
          </div>
        )}

        {/* Run history */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">Run History</h3>
          <RunHistory brandCode={brandCode} />
        </div>
      </div>

      {/* Edit config dialog */}
      {isEditOpen && (
        <BrandConfigDialog
          key={brandCode}
          isOpen
          onClose={() => setIsEditOpen(false)}
          brandCode={brandCode}
        />
      )}
    </div>
  );
}
