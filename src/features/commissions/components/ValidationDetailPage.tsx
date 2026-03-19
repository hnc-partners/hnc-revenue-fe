/**
 * ValidationDetailPage.tsx
 *
 * Per-batch validation detail view (FES-04).
 * Shows discrepancy table with filter tabs and "Run Validation" button.
 * Navigated to from ValidationOverviewPage via /validation/:batchId.
 */

import { useState, useMemo, useCallback } from 'react';
import { useSafeNavigate } from '@/lib/use-safe-navigate';
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
  Skeleton,
  Button,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  Spinner,
} from '@hnc-partners/ui-components';
import { AlertTriangle, ArrowLeft, Play, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useValidationDetail, useRunValidation } from '../api';
import { MatchRateBadge } from './MatchRateBadge';
import type { ValidationDetail, ValidationStatus } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'matched', label: 'Matched' },
  { id: 'mismatched', label: 'Mismatched' },
  { id: 'missing', label: 'Missing' },
  { id: 'skipped', label: 'Skipped' },
] as const;

type StatusTabId = (typeof STATUS_TABS)[number]['id'];

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

function getColumns(): ColumnDef<ValidationDetail>[] {
  return [
    {
      accessorKey: 'gaming_account_name',
      header: 'Gaming Account',
      cell: ({ row }) => (
        <span className="font-medium text-sm">
          {row.original.gaming_account_name}
        </span>
      ),
    },
    {
      accessorKey: 'calculated_amount',
      header: () => <div className="text-right">Calculated Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono tabular-nums text-sm">
          {formatAmount(row.original.calculated_amount)}
        </div>
      ),
    },
    {
      accessorKey: 'reported_amount',
      header: () => <div className="text-right">Reported Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono tabular-nums text-sm">
          {formatAmount(row.original.reported_amount)}
        </div>
      ),
    },
    {
      accessorKey: 'difference',
      header: () => <div className="text-right">Difference</div>,
      cell: ({ row }) => {
        const diff = parseFloat(row.original.difference);
        return (
          <div
            className={cn(
              'text-right font-mono tabular-nums text-sm',
              diff > 0 && 'text-destructive',
              diff < 0 && 'text-success',
              (diff === 0 || isNaN(diff)) && 'text-muted-foreground'
            )}
          >
            {formatDifference(row.original.difference)}
          </div>
        );
      },
    },
    {
      accessorKey: 'pct_difference',
      header: () => <div className="text-right">% Difference</div>,
      cell: ({ row }) => {
        const pct = parseFloat(row.original.pct_difference);
        return (
          <div
            className={cn(
              'text-right font-mono tabular-nums text-sm',
              pct > 0 && 'text-destructive',
              pct < 0 && 'text-success',
              (pct === 0 || isNaN(pct)) && 'text-muted-foreground'
            )}
          >
            {formatPctDifference(row.original.pct_difference)}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAmount(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDifference(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)}`;
}

function formatPctDifference(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(2)}%`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: ValidationStatus }) {
  const config: Record<
    ValidationStatus,
    { variant: 'outline'; className: string; label: string }
  > = {
    matched: {
      variant: 'outline',
      className: 'bg-success/20 text-success border-success/30',
      label: 'Matched',
    },
    mismatched: {
      variant: 'outline',
      className: 'bg-destructive/20 text-destructive border-destructive/30',
      label: 'Mismatched',
    },
    missing: {
      variant: 'outline',
      className: 'bg-warning/20 text-warning border-warning/30',
      label: 'Missing',
    },
    skipped: {
      variant: 'outline',
      className: 'bg-muted text-muted-foreground border-border',
      label: 'Skipped',
    },
  };

  const cfg = config[status];
  return (
    <Badge variant={cfg.variant} className={cn('text-xs', cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-9 w-[400px]" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
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
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}

function AllSkippedEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        <Info className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">
        No Brand-Reported Data Available
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        All records in this batch were skipped because no brand-reported data is
        available for comparison. This is informational and does not indicate an
        error.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ValidationDetailPageProps {
  batchId: string;
  /** Optional callback for back button — used in MF mode where router navigation is unavailable */
  onBack?: () => void;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ValidationDetailPage({ batchId, onBack }: ValidationDetailPageProps) {
  const navigate = useSafeNavigate();
  const [activeTab, setActiveTab] = useState<StatusTabId>('all');

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useValidationDetail(batchId);

  const runValidation = useRunValidation(batchId);

  const columns = useMemo(() => getColumns(), []);

  // Filter data based on active tab
  const filteredData = useMemo(() => {
    if (!response?.data) return [];
    if (activeTab === 'all') return response.data;
    return response.data.filter((row) => row.status === activeTab);
  }, [response?.data, activeTab]);

  // Check if all records are skipped
  const allSkipped = useMemo(() => {
    if (!response?.data || response.data.length === 0) return false;
    return response.data.every((row) => row.status === 'skipped');
  }, [response?.data]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigate({ to: '/revenue/commissions/validation' });
    }
  }, [navigate, onBack]);

  const handleRunValidation = useCallback(() => {
    runValidation.mutate();
  }, [runValidation]);

  // Count per status for tab badges
  const statusCounts = useMemo(() => {
    if (!response?.data) return { all: 0, matched: 0, mismatched: 0, missing: 0, skipped: 0 };
    const counts = { all: response.data.length, matched: 0, mismatched: 0, missing: 0, skipped: 0 };
    for (const row of response.data) {
      counts[row.status]++;
    }
    return counts;
  }, [response?.data]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to overview</span>
            </Button>
            <h1 className="text-xl font-semibold text-foreground">
              Validation Detail
            </h1>
            {response?.summary && (
              <MatchRateBadge matchRate={response.summary.match_rate} />
            )}
          </div>
          <Button
            onClick={handleRunValidation}
            disabled={runValidation.isPending}
          >
            {runValidation.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Validation
              </>
            )}
          </Button>
        </div>

        {/* Filter tabs */}
        {!isLoading && !error && response?.data && response.data.length > 0 && (
          <div className="mb-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as StatusTabId)}
            >
              <TabsList className="h-9 bg-muted/50 p-1">
                {STATUS_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    {tab.label}
                    <span className="ml-1.5 text-muted-foreground">
                      {statusCounts[tab.id]}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
        {isLoading ? (
          <PageSkeleton />
        ) : error ? (
          <ErrorState
            message="Could not load validation detail. Please try again."
            onRetry={() => refetch()}
          />
        ) : allSkipped ? (
          <AllSkippedEmptyState />
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No records match the selected filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
                      <TableRow key={row.id}>
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
                        No validation records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Row count */}
            <div className="text-sm text-muted-foreground">
              {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
              {activeTab !== 'all' && (
                <span>
                  {' '}
                  (filtered from {response?.data?.length ?? 0} total)
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
