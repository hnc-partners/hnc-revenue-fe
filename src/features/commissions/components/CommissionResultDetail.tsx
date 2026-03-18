/**
 * CommissionResultDetail.tsx
 *
 * Expanded detail view for a single commission result.
 * Shows full result information and audit trail (supersession chain).
 */

import { Badge, Skeleton, Button } from '@hnc-partners/ui-components';
import { ChevronUp, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCommissionResult } from '../api';
import type { CommissionResult, CommissionResultDetail as DetailType } from '../types';
import {
  formatCurrency,
  formatPercent,
  formatPeriod,
  shareCategoryBadgeConfig,
  dealTypeLabel,
} from './commission-helpers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CommissionResultDetailProps {
  result: CommissionResult;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground text-right max-w-[60%]">
        {children}
      </span>
    </div>
  );
}

function SupersessionChain({ detail }: { detail: DetailType }) {
  const chain = detail.supersession_chain;
  if (!chain || chain.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
        Supersession History
      </h4>
      <div className="space-y-2">
        {chain.map((entry, i) => (
          <div
            key={entry.id}
            className={cn(
              'rounded-md border border-border p-2 text-sm',
              entry.status === 'active' ? 'bg-success/5' : 'bg-muted/50'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">
                {entry.id.slice(0, 8)}...
              </span>
              <Badge
                variant={entry.status === 'active' ? 'success' : 'secondary'}
              >
                {entry.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleDateString()}
              </span>
              <span className="font-mono tabular-nums text-sm">
                {formatCurrency(entry.commission_amount, detail.currency)}
              </span>
            </div>
            {entry.superseded_by_id && i < chain.length - 1 && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <ArrowRight className="h-3 w-3" />
                <span>Superseded by {entry.superseded_by_id.slice(0, 8)}...</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CommissionResultDetail({
  result,
  onClose,
}: CommissionResultDetailProps) {
  const { data: detail, isLoading } = useCommissionResult(result.id, {
    enabled: true,
  });

  const categoryConfig = shareCategoryBadgeConfig(result.share_category_code);

  return (
    <div className="border-t border-border bg-muted/30 px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">Result Detail</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <ChevronUp className="h-4 w-4" />
          <span className="sr-only">Close detail</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
          {/* Left column */}
          <div>
            <DetailRow label="Gaming Account">
              {result.gaming_account_name}
            </DetailRow>
            <DetailRow label="Contact">{result.contact_name}</DetailRow>
            <DetailRow label="Deal">{result.deal_name}</DetailRow>
            <DetailRow label="Deal Type">
              {dealTypeLabel(result.deal_type)}
            </DetailRow>
            <DetailRow label="Direction">
              <Badge variant="outline" className="text-xs">
                {result.direction}
              </Badge>
            </DetailRow>
            <DetailRow label="Share Category">
              <Badge
                variant="outline"
                className={cn('text-xs', categoryConfig.className)}
              >
                {result.share_category_name}
              </Badge>
            </DetailRow>
            <DetailRow label="Share Type">{result.share_type}</DetailRow>
          </div>

          {/* Right column */}
          <div>
            <DetailRow label="Share %">
              {formatPercent(result.share_pct_applied)}
            </DetailRow>
            <DetailRow label="Revenue">
              <span className="font-mono tabular-nums">
                {formatCurrency(result.revenue_amount, result.currency)}
              </span>
            </DetailRow>
            <DetailRow label="Commission">
              <span className="font-mono tabular-nums font-medium">
                {formatCurrency(result.commission_amount, result.currency)}
              </span>
            </DetailRow>
            <DetailRow label="Period">
              {formatPeriod(result.period_start, result.period_end)}
            </DetailRow>
            <DetailRow label="Batch">
              <span className="font-mono text-xs">
                {result.batch_id.slice(0, 8)}...
              </span>
            </DetailRow>
            <DetailRow label="Status">
              <Badge
                variant={
                  result.status === 'active' ? 'success' : 'secondary'
                }
              >
                {result.status}
              </Badge>
            </DetailRow>
          </div>
        </div>
      )}

      {/* Supersession info */}
      {result.superseded_by_id && (
        <div className="mt-3 rounded-md bg-warning/10 p-2 text-sm text-warning">
          Superseded by result {result.superseded_by_id.slice(0, 8)}...
          {result.recalculation_id && (
            <span className="ml-1">
              (recalculation {result.recalculation_id.slice(0, 8)}...)
            </span>
          )}
        </div>
      )}

      {/* Audit trail from detail endpoint */}
      {detail && <SupersessionChain detail={detail} />}
    </div>
  );
}
