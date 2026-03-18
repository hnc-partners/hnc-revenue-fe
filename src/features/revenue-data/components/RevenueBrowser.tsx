/**
 * RevenueBrowser.tsx
 *
 * Main Revenue Browser page component (FES-04).
 * Paginated table of revenue records with filters, side panel, and by-player view.
 */

import { useState, useMemo, useCallback, useRef } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  SidePanelContainer,
  usePanelResize,
  PANEL_DEFAULTS,
} from '@hnc-partners/ui-components';
import {
  AlertTriangle,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRevenueRecords } from '../api';
import { useBrandConfigs } from '@/features/imports/api';
import { RevenueDetailPanel } from './RevenueDetailPanel';
import { RevenueByPlayer } from './RevenueByPlayer';
import type {
  PlayerRevenue,
  RevenueQueryParams,
  PaginatedMeta,
} from '../types';
import { getShareTypeLabel } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 50;

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
 * Collect all unique share type codes from current page of records.
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-[140px]" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-1">
        No revenue data
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        No revenue records found. Try adjusting your filters or import revenue data first.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

interface RevenueFiltersProps {
  params: RevenueQueryParams;
  onParamsChange: (params: RevenueQueryParams) => void;
}

function RevenueFilters({ params, onParamsChange }: RevenueFiltersProps) {
  const { data: brands } = useBrandConfigs();

  const updateParam = useCallback(
    (key: keyof RevenueQueryParams, value: string | undefined) => {
      onParamsChange({
        ...params,
        [key]: value || undefined,
        page: key !== 'page' ? 1 : params.page,
      });
    },
    [params, onParamsChange]
  );

  const hasActiveFilters =
    params.brandId ||
    params.batchId ||
    params.gamingAccountId ||
    params.periodStartGte ||
    params.periodStartLte;

  const clearFilters = useCallback(() => {
    onParamsChange({ page: 1, limit: params.limit });
  }, [params.limit, onParamsChange]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Brand filter */}
      <Select
        value={params.brandId ?? ''}
        onValueChange={(val) =>
          updateParam('brandId', val === 'all' ? undefined : val)
        }
      >
        <SelectTrigger className="h-8 w-[180px] rounded-md text-sm">
          <SelectValue placeholder="All Brands" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Brands</SelectItem>
          {brands?.map((brand) => (
            <SelectItem key={brand.brandId} value={brand.brandId}>
              {brand.brandName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Gaming Account search */}
      <div className="flex items-center gap-1">
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          type="text"
          placeholder="Gaming Account ID"
          value={params.gamingAccountId ?? ''}
          onChange={(e) => updateParam('gamingAccountId', e.target.value)}
          className="h-8 w-[200px] text-sm rounded-md"
          aria-label="Filter by gaming account ID"
        />
      </div>

      {/* Batch filter */}
      <Input
        type="text"
        placeholder="Batch ID"
        value={params.batchId ?? ''}
        onChange={(e) => updateParam('batchId', e.target.value)}
        className="h-8 w-[180px] text-sm rounded-md"
        aria-label="Filter by batch ID"
      />

      {/* Period date range */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          type="date"
          value={params.periodStartGte ?? ''}
          onChange={(e) => updateParam('periodStartGte', e.target.value)}
          className="h-8 w-[140px] text-sm rounded-md"
          aria-label="Period start from"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <Input
          type="date"
          value={params.periodStartLte ?? ''}
          onChange={(e) => updateParam('periodStartLte', e.target.value)}
          className="h-8 w-[140px] text-sm rounded-md"
          aria-label="Period start to"
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 text-sm text-muted-foreground"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue Table
// ---------------------------------------------------------------------------

interface RevenueTableProps {
  data: PlayerRevenue[];
  meta: PaginatedMeta | undefined;
  currentPage: number;
  onPageChange: (page: number) => void;
  onRowClick: (record: PlayerRevenue) => void;
  shareTypes: string[];
}

function RevenueTable({
  data,
  meta,
  currentPage,
  onPageChange,
  onRowClick,
  shareTypes,
}: RevenueTableProps) {
  const columns: ColumnDef<PlayerRevenue>[] = useMemo(() => {
    const cols: ColumnDef<PlayerRevenue>[] = [
      {
        accessorKey: 'brandPlayerId',
        header: 'Brand Player ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.brandPlayerId}</span>
        ),
      },
      {
        accessorKey: 'nickname',
        header: 'Nickname',
        cell: ({ row }) => (
          <span className="font-medium text-sm">
            {row.original.nickname || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'brandName',
        header: 'Brand',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.brandName}</span>
        ),
      },
      {
        id: 'period',
        header: 'Period',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(row.original.periodStart)} -{' '}
            {formatDate(row.original.periodEnd)}
          </span>
        ),
      },
    ];

    // Dynamic amount columns per share type
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
          if (!amt) {
            return <div className="text-right text-muted-foreground">-</div>;
          }
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
        if (val == null) {
          return <div className="text-right text-muted-foreground">-</div>;
        }
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

    // Created column
    cols.push({
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    });

    return cols;
  }, [shareTypes]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: meta?.totalPages ?? 1,
  });

  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

  return (
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
                  No revenue records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total} record{total !== 1 ? 's' : ''}
          {totalPages > 1 && (
            <span>
              {' '}&middot; Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function RevenueBrowser() {
  // Filter / pagination state
  const [params, setParams] = useState<RevenueQueryParams>({
    page: 1,
    limit: DEFAULT_LIMIT,
  });

  // Side panel state
  const [selectedRecord, setSelectedRecord] = useState<PlayerRevenue | null>(null);
  const [sidePanelWidth, setSidePanelWidth] = useState<number>(PANEL_DEFAULTS.defaultWidth);
  const { handleMouseDown, isResizing } = usePanelResize({
    setWidth: setSidePanelWidth,
    minWidth: PANEL_DEFAULTS.minWidth,
    maxWidth: PANEL_DEFAULTS.maxWidth,
  });

  // By-player view state
  const [byPlayerGamingAccountId, setByPlayerGamingAccountId] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  const queryParams = useMemo(() => params, [params]);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useRevenueRecords(queryParams);

  const records = useMemo(() => response?.data ?? [], [response?.data]);
  const shareTypes = useMemo(() => collectShareTypes(records), [records]);

  const handleParamsChange = useCallback((newParams: RevenueQueryParams) => {
    setParams(newParams);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  const handleRowClick = useCallback((record: PlayerRevenue) => {
    setSelectedRecord(record);
  }, []);

  const handleViewPlayer = useCallback((gamingAccountId: string) => {
    setSelectedRecord(null);
    setByPlayerGamingAccountId(gamingAccountId);
  }, []);

  const handleBackFromPlayer = useCallback(() => {
    setByPlayerGamingAccountId(null);
  }, []);

  // If by-player view is active, render that instead
  if (byPlayerGamingAccountId) {
    return (
      <RevenueByPlayer
        gamingAccountId={byPlayerGamingAccountId}
        onBack={handleBackFromPlayer}
        onRowClick={handleRowClick}
      />
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Content row — table + side panel side by side */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main content — shrinks when side panel opens */}
        <div
          ref={contentRef}
          className="flex-1 min-w-0 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 lg:px-8 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-semibold text-foreground">
                Revenue Data
              </h1>
            </div>

            {/* Filters */}
            <div className="mb-4">
              <RevenueFilters
                params={params}
                onParamsChange={handleParamsChange}
              />
            </div>
          </div>

          {/* Scrollable area — table */}
          <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
            {isLoading ? (
              <PageSkeleton />
            ) : error ? (
              <ErrorState
                message="Could not load revenue records. Please try again."
                onRetry={() => refetch()}
              />
            ) : records.length === 0 ? (
              <EmptyState />
            ) : (
              <RevenueTable
                data={records}
                meta={response?.meta}
                currentPage={params.page ?? 1}
                onPageChange={handlePageChange}
                onRowClick={handleRowClick}
                shareTypes={shareTypes}
              />
            )}
          </div>
        </div>

        {/* Side Panel — sibling to contentRef */}
        <SidePanelContainer
          isOpen={!!selectedRecord}
          width={sidePanelWidth}
          isResizing={isResizing}
          onResizeStart={handleMouseDown}
        >
          {selectedRecord && (
            <RevenueDetailPanel
              record={selectedRecord}
              onClose={() => setSelectedRecord(null)}
              onViewPlayer={handleViewPlayer}
            />
          )}
        </SidePanelContainer>
      </div>
    </div>
  );
}
