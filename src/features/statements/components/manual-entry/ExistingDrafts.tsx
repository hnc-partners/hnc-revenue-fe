/**
 * ExistingDrafts.tsx
 *
 * Shows existing manual entry batches for a brand.
 * Helps operators see draft/submitted/processed/failed entries.
 */

import { Badge } from '@hnc-partners/ui-components';
import { FileText } from 'lucide-react';
import type { RMManualEntryBatch, RMBatchStatus } from '../../types/manual-entry';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function statusVariant(
  status: RMBatchStatus
): 'default' | 'warning' | 'success' | 'destructive' | 'info' {
  switch (status) {
    case 'draft':
      return 'warning';
    case 'submitted':
      return 'info';
    case 'processed':
      return 'success';
    case 'failed':
      return 'destructive';
    default:
      return 'default';
  }
}

function statusLabel(status: RMBatchStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ExistingDraftsProps {
  batches: RMManualEntryBatch[];
}

export function ExistingDrafts({ batches }: ExistingDraftsProps) {
  if (batches.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium text-foreground">
          Existing Entries
        </h2>
        <Badge variant="outline" className="text-xs">
          {batches.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {batches.map((batch) => (
          <div
            key={batch.id}
            className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {formatDate(batch.periodStart)} — {formatDate(batch.periodEnd)}
                </span>
                <Badge
                  variant={statusVariant(batch.status)}
                  className="text-xs"
                >
                  {statusLabel(batch.status)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {batch.lineCount} line{batch.lineCount !== 1 ? 's' : ''}
                {batch.submittedAt && ` — Submitted ${formatDate(batch.submittedAt)}`}
                {batch.errorMessage && (
                  <span className="text-destructive ml-2">
                    {batch.errorMessage}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
