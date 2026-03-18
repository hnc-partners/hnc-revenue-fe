/**
 * RecalculateButton.tsx
 *
 * Self-contained recalculation trigger component (FES-05).
 * Renders a button that opens a confirmation dialog, triggers recalculation,
 * and shows delta summary on success.
 *
 * Designed for use in the F30 Imports batch detail view:
 * ```tsx
 * <RecalculateButton batchId={batch.id} batchLabel={batch.name} />
 * ```
 */

import { useState, useCallback } from 'react';
import {
  Button,
  ConfirmDialog,
  Spinner,
  toast,
} from '@hnc-partners/ui-components';
import { RefreshCcw } from 'lucide-react';
import type { RecalculationResult } from '../types';
import { useRecalculate } from '../api/useRecalculate';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RecalculateButtonProps {
  /** Batch ID to recalculate */
  batchId: string;
  /** Optional human-readable batch identifier for display */
  batchLabel?: string;
  /** Callback fired after successful recalculation */
  onRecalculated?: (result: RecalculationResult) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a decimal string as currency-style display */
function formatAmount(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecalculateButton({
  batchId,
  batchLabel,
  onRecalculated,
}: RecalculateButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastResult, setLastResult] = useState<RecalculationResult | null>(
    null
  );

  const recalculate = useRecalculate();

  const displayName = batchLabel || batchId;

  const handleConfirm = useCallback(() => {
    setShowConfirm(false);
    setLastResult(null);

    recalculate.mutate(batchId, {
      onSuccess: (result) => {
        setLastResult(result);
        toast.success('Recalculation completed successfully');
        onRecalculated?.(result);
      },
      onError: (error) => {
        toast.error(
          `Recalculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      },
    });
  }, [batchId, recalculate, onRecalculated]);

  return (
    <div className="space-y-3">
      {/* Trigger button */}
      <Button
        variant="outline"
        onClick={() => setShowConfirm(true)}
        disabled={recalculate.isPending}
      >
        {recalculate.isPending ? (
          <>
            <Spinner size="sm" className="mr-2" />
            Recalculating...
          </>
        ) : (
          <>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Recalculate Commissions
          </>
        )}
      </Button>

      {/* Confirmation dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Recalculate Commissions"
        message={`This will replace existing commission results for batch ${displayName}. Continue?`}
        confirmText="Recalculate"
        onConfirm={handleConfirm}
      />

      {/* Delta summary after successful recalculation */}
      {lastResult && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">
            Recalculation Complete
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <span className="text-muted-foreground">Previous total:</span>
            <span className="font-mono tabular-nums text-right">
              ${formatAmount(lastResult.previous_total)}
            </span>

            <span className="text-muted-foreground">New total:</span>
            <span className="font-mono tabular-nums text-right">
              ${formatAmount(lastResult.new_total)}
            </span>

            <span className="text-muted-foreground">Records changed:</span>
            <span className="font-mono tabular-nums text-right">
              {lastResult.changed_count}
            </span>

            <span className="text-muted-foreground">Records unchanged:</span>
            <span className="font-mono tabular-nums text-right">
              {lastResult.unchanged_count}
            </span>
          </div>
        </div>
      )}

      {/* Error state (inline, below button) */}
      {recalculate.isError && !recalculate.isPending && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">
            Recalculation failed.{' '}
            {recalculate.error instanceof Error
              ? recalculate.error.message
              : 'Please try again.'}
          </p>
        </div>
      )}
    </div>
  );
}
