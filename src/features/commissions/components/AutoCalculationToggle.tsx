/**
 * AutoCalculationToggle.tsx
 *
 * Self-contained toggle component for brand auto-calculation config (FES-06).
 * Designed to be imported by F54 Statements brand config:
 *
 * ```tsx
 * <AutoCalculationToggle brandId={brand.id} brandName={brand.name} />
 * ```
 */

import { useState, useCallback } from 'react';
import {
  Switch,
  ConfirmDialog,
  Skeleton,
  Spinner,
  toast,
  Label,
} from '@hnc-partners/ui-components';
import {
  useBrandCommissionConfig,
  useToggleAutoCalculation,
} from '../api/useBrandCommissionConfig';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AutoCalculationToggleProps {
  /** Brand UUID */
  brandId: string;
  /** Human-readable brand name for confirmation dialog */
  brandName?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format an ISO timestamp for display, or show "Never" for null. */
function formatTimestamp(value: string | null): string {
  if (!value) return 'Never';
  const date = new Date(value);
  if (isNaN(date.getTime())) return 'Never';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AutoCalculationToggle({
  brandId,
  brandName,
}: AutoCalculationToggleProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    data: config,
    isLoading,
    isError,
    error,
    refetch,
  } = useBrandCommissionConfig(brandId);

  const toggle = useToggleAutoCalculation();

  const displayName = brandName || brandId;
  const isEnabled = config?.autoCalculateCommission ?? false;

  // Called when the user flips the switch
  const handleToggleChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        // Enable → show confirmation dialog first
        setShowConfirm(true);
      } else {
        // Disable → no confirmation needed
        toggle.mutate(
          { brandId, autoCalculateCommission: false },
          {
            onSuccess: () => {
              toast.success('Auto-calculation disabled');
            },
            onError: (err) => {
              toast.error(
                `Failed to disable auto-calculation: ${err instanceof Error ? err.message : 'Unknown error'}`
              );
            },
          }
        );
      }
    },
    [brandId, toggle]
  );

  // Called when the user confirms enabling auto-calculation
  const handleConfirmEnable = useCallback(() => {
    setShowConfirm(false);
    toggle.mutate(
      { brandId, autoCalculateCommission: true },
      {
        onSuccess: () => {
          toast.success('Auto-calculation enabled');
        },
        onError: (err) => {
          toast.error(
            `Failed to enable auto-calculation: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        },
      }
    );
  }, [brandId, toggle]);

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-4 w-36" />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
        <p className="text-sm font-medium text-destructive">
          Failed to load auto-calculation config
        </p>
        <p className="text-xs text-destructive/80 mt-1">
          {error instanceof Error ? error.message : 'Please try again.'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-xs font-medium text-destructive underline underline-offset-2 hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Header + toggle row */}
      <div className="flex items-center justify-between gap-4">
        <Label
          htmlFor={`auto-calc-toggle-${brandId}`}
          className="text-sm font-medium text-foreground cursor-pointer"
        >
          Auto-Calculate Commissions
        </Label>
        <div className="flex items-center gap-2">
          {toggle.isPending && <Spinner size="sm" />}
          <Switch
            id={`auto-calc-toggle-${brandId}`}
            checked={isEnabled}
            onCheckedChange={handleToggleChange}
            disabled={toggle.isPending}
            aria-label="Toggle auto-calculation"
          />
        </div>
      </div>

      {/* Last auto-calculated timestamp */}
      <p className="text-xs text-muted-foreground">
        Last auto-calculated:{' '}
        <span className="font-medium">
          {formatTimestamp(config?.lastAutoCalculatedAt ?? null)}
        </span>
      </p>

      {/* Confirmation dialog for enabling */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmEnable}
        title={`Enable auto-calculation for ${displayName}?`}
        message="Commission results will be automatically calculated when new import batches are processed."
        confirmText="Enable"
        isLoading={toggle.isPending}
      />
    </div>
  );
}
