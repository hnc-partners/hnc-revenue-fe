/**
 * RevenueDetailPanel.tsx
 *
 * Slide-in side panel for revenue record details.
 * Shows amounts, extras JSONB, link to source batch, and player info.
 */

import { X, ExternalLink, User, DollarSign, FileText } from 'lucide-react';
import { useSafeNavigate } from '@/lib/use-safe-navigate';
import { Button } from '@hnc-partners/ui-components';
import { cn } from '@/lib/utils';
import type { PlayerRevenue } from '../types';
import { getShareTypeLabel } from '../types';
import { ExtrasViewer } from './ExtrasViewer';

interface RevenueDetailPanelProps {
  /** The revenue record to display */
  record: PlayerRevenue;
  /** Callback to close the panel */
  onClose: () => void;
  /** Callback to view all records for this player */
  onViewPlayer: (gamingAccountId: string) => void;
}

/**
 * Format a date string to a short readable format.
 */
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a decimal amount string with proper number formatting.
 */
function formatAmount(amount: string): string {
  const num = Number(amount);
  if (isNaN(num)) return amount;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function RevenueDetailPanel({
  record,
  onClose,
  onViewPlayer,
}: RevenueDetailPanelProps) {
  const navigate = useSafeNavigate();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">
            {record.nickname || record.brandPlayerId}
          </h2>
          <p className="text-xs text-muted-foreground">
            {record.brandName} &middot; {formatDate(record.periodStart)} - {formatDate(record.periodEnd)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="flex-shrink-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close panel</span>
        </Button>
      </div>

      {/* Content (scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Player Info */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Player Info</h3>
          </div>
          <div className="space-y-2">
            <DetailRow label="Nickname" value={record.nickname || '-'} />
            <DetailRow label="Brand Player ID" value={record.brandPlayerId} mono />
            {record.agentCode && (
              <DetailRow label="Agent Code" value={record.agentCode} mono />
            )}
            <DetailRow label="Brand" value={record.brandName} />
          </div>
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onViewPlayer(record.gamingAccountId)}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              View all periods for this player
            </Button>
          </div>
        </section>

        {/* Amounts */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Amounts</h3>
          </div>
          {record.amounts.length > 0 ? (
            <div className="space-y-2">
              {record.amounts.map((amt) => {
                const numVal = Number(amt.amount);
                const isNegative = !isNaN(numVal) && numVal < 0;
                return (
                  <div
                    key={amt.id}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                  >
                    <span className="text-sm text-muted-foreground">
                      {getShareTypeLabel(amt.shareTypeCode)}
                    </span>
                    <span
                      className={cn(
                        'font-mono tabular-nums text-sm font-medium',
                        isNegative && 'text-destructive'
                      )}
                    >
                      {formatAmount(amt.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No amounts recorded</p>
          )}

          {/* Commission */}
          {record.commission != null && (
            <div className="mt-3 flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span className="text-sm font-medium">Commission (Brand)</span>
              <span
                className={cn(
                  'font-mono tabular-nums text-sm font-medium',
                  Number(record.commission) < 0 && 'text-destructive'
                )}
              >
                {formatAmount(record.commission)}
              </span>
            </div>
          )}
        </section>

        {/* Source Batch Link */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Source</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() =>
              navigate({
                to: '/revenue/imports/$batchId',
                params: { batchId: record.batchId },
              })
            }
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            View source batch
          </Button>
          <div className="mt-2">
            <DetailRow label="Batch ID" value={record.batchId} mono />
            <DetailRow label="Created" value={formatDate(record.createdAt)} />
          </div>
        </section>

        {/* Extras JSONB */}
        {record.extras && Object.keys(record.extras).length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Extra Data</h3>
            </div>
            <div className="rounded-md border border-border p-3 bg-muted/30">
              <ExtrasViewer extras={record.extras} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          'text-foreground truncate max-w-[200px] text-right',
          mono && 'font-mono text-xs'
        )}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
