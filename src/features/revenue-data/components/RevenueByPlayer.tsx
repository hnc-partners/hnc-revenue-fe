/**
 * RevenueByPlayer.tsx
 *
 * Shows all revenue periods for a single player, sorted DESC.
 * Includes a summary row with totals and a "Back to all" button.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Skeleton,
} from '@hnc-partners/ui-components';
import {
  ArrowLeft,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRevenueByPlayer } from '../api';
import type {
  PlayerRevenue,
  ByPlayerQueryParams,
} from '../types';
import { getShareTypeLabel } from '../types';

interface RevenueByPlayerProps {
  /** The gaming account ID to show revenue for */
  gamingAccountId: string;
  /** Callback to go back to the all-records view */
  onBack: () => void;
  /** Callback when a row is clicked */
  onRowClick: (record: PlayerRevenue) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function formatAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? Number(amount) : amount;
  if (isNaN(num)) return String(amount);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Collect all unique share type codes from records.
 */
function collectShareTypes(records: PlayerRevenue[]): string[] {
  const codes = new Set<string>();
  for (const r of records) {
    for (const a of r.amounts) {
      codes.add(a.shareTypeCode);
    }
  }
  return Array.from(codes).sort();
}

/**
 * Calculate totals across all records.
 */
function calcTotals(records: PlayerRevenue[], shareTypes: string[]) {
  const amountTotals: Record<string, number> = {};
  let commissionTotal = 0;

  for (const code of shareTypes) {
    amountTotals[code] = 0;
  }

  for (const r of records) {
    for (const a of r.amounts) {
      amountTotals[a.shareTypeCode] =
        (amountTotals[a.shareTypeCode] || 0) + Number(a.amount);
    }
    if (r.commission != null) {
      commissionTotal += Number(r.commission);
    }
  }

  return { amountTotals, commissionTotal };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 50;

export function RevenueByPlayer({
  gamingAccountId,
  onBack,
  onRowClick,
}: RevenueByPlayerProps) {
  const [params, setParams] = useState<ByPlayerQueryParams>({
    page: 1,
    limit: DEFAULT_LIMIT,
  });

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useRevenueByPlayer(gamingAccountId, params);

  const records = useMemo(() => response?.data ?? [], [response?.data]);
  const meta = response?.meta;
  const shareTypes = useMemo(() => collectShareTypes(records), [records]);
  const totals = useMemo(
    () => calcTotals(records, shareTypes),
    [records, shareTypes]
  );

  // First record for player header info
  const firstRecord = records[0];

  const handlePageChange = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  // Build columns dynamically based on share types present
  const columns: ColumnDef<PlayerRevenue>[] = useMemo(() => {
    const cols: ColumnDef<PlayerRevenue>[] = [
      {
        id: 'period',
        header: 'Period',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(row.original.periodStart)} - {formatDate(row.original.periodEnd)}
          </span>
        ),
      },
    ];

    // Dynamic amount columns
    for (const code of shareTypes) {
      cols.push({
        id: `amount_${code}`,
        header: () => (
          <div className="text-right">{getShareTypeLabel(code)}</div>
        ),
        cell: ({ row }) => {
          const amt = row.original.amounts.find(
            (a) => a.shareTypeCode === code
          );
          if (!amt) return <div className="text-right text-muted-foreground">-</div>;
          const num = Number(amt.amount);
          return (
            <div
              className={cn(
                'text-right font-mono tabular-nums text-sm',
                num < 0 && 'text-destructive'
              )}
            >
              {formatAmount(amt.amount)}
            </div>
          );
        },
      });
    }

    // Commission column
    cols.push({
      accessorKey: 'commission',
      header: () => <div className="text-right">Commission</div>,
      cell: ({ row }) => {
        const val = row.original.commission;
        if (val == null) return <div className="text-right text-muted-foreground">-</div>;
        const num = Number(val);
        return (
          <div
            className={cn(
              'text-right font-mono tabular-nums text-sm',
              num < 0 && 'text-destructive'
            )}
          >
            {formatAmount(val)}
          </div>
        );
      },
    });

    return cols;
  }, [shareTypes]);

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: meta?.totalPages ?? 1,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 px-4 sm:px-6 lg:px-8 pt-6" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        role="alert"
      >
        <div className="rounded-full bg-destructive/10 p-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          Something went wrong
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          Could not load player revenue. Please try again.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Back to all
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;
  const currentPage = params.page ?? 1;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to all
          </Button>
          {firstRecord && (
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {firstRecord.nickname || firstRecord.brandPlayerId}
              </h1>
              <p className="text-sm text-muted-foreground">
                {firstRecord.brandName} &middot; {total} period{total !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              No revenue records
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              No revenue data found for this player.
            </p>
            <Button variant="outline" onClick={onBack}>
              Back to all
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary row */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">
                Totals across all periods
              </h3>
              <div className="flex flex-wrap gap-4">
                {shareTypes.map((code) => {
                  const val = totals.amountTotals[code] ?? 0;
                  return (
                    <div key={code} className="text-center">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {getShareTypeLabel(code)}
                      </p>
                      <p
                        className={cn(
                          'font-mono tabular-nums text-sm font-medium',
                          val < 0 && 'text-destructive'
                        )}
                      >
                        {formatAmount(val)}
                      </p>
                    </div>
                  );
                })}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Commission
                  </p>
                  <p
                    className={cn(
                      'font-mono tabular-nums text-sm font-medium',
                      totals.commissionTotal < 0 && 'text-destructive'
                    )}
                  >
                    {formatAmount(totals.commissionTotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="text-xs font-medium uppercase tracking-wider"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => onRowClick(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {total} record{total !== 1 ? 's' : ''}
                  <span>
                    {' '}&middot; Page {currentPage} of {totalPages}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous page</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next page</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
