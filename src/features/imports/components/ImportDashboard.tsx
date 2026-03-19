/**
 * ImportDashboard.tsx
 *
 * Main page component for the Import Dashboard (F30).
 * Renders filters, paginated table of import batches, and purge action.
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@hnc-partners/ui-components';
import { toast } from 'sonner';
import {
  Plus,
  Upload,
  AlertTriangle,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { useImportBatches, usePurgeBatch, useBrandConfigs } from '../api';
import { BatchStatusBadge } from './BatchStatusBadge';
import { BatchDetail } from './BatchDetail';
import { ImportWizard } from './ImportWizard';
import type {
  ImportBatch,
  ImportBatchFilters,
  ImportBatchStatus,
  PaginatedMeta,
} from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 50;

const STATUS_OPTIONS: { value: ImportBatchStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'validating', label: 'Validating' },
  { value: 'processing', label: 'Processing' },
  { value: 'processed', label: 'Processed' },
  { value: 'failed', label: 'Failed' },
  { value: 'rolled_back', label: 'Rolled Back' },
];

// ---------------------------------------------------------------------------
// Helper functions
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

function formatPeriod(start: string, end: string): string {
  return `${formatDate(start)} - ${formatDate(end)}`;
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

function EmptyState({ onNewImport }: { onNewImport: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Upload className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-1">
        No imports yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        Click New Import to get started.
      </p>
      <Button onClick={onNewImport}>
        <Plus className="h-4 w-4 mr-2" />
        New Import
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Purge Confirmation Dialog
// ---------------------------------------------------------------------------

interface PurgeDialogProps {
  batch: ImportBatch | null;
  onClose: () => void;
}

function PurgeDialog({ batch, onClose }: PurgeDialogProps) {
  const purge = usePurgeBatch();

  const handlePurge = () => {
    if (!batch) return;
    purge.mutate(batch.id, {
      onSuccess: () => {
        toast.success('Batch purged successfully.');
        onClose();
      },
      onError: () => {
        toast.error('Failed to purge batch. Please try again.');
      },
    });
  };

  return (
    <Dialog open={!!batch} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Purge Import Batch</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently purge this rolled-back batch?
            This action cannot be undone.
          </p>
          {batch && (
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <p>
                <span className="font-medium">Brand:</span> {batch.brandName}
              </p>
              <p>
                <span className="font-medium">Period:</span>{' '}
                {formatPeriod(batch.periodStart, batch.periodEnd)}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={purge.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handlePurge}
              disabled={purge.isPending}
            >
              {purge.isPending ? 'Purging...' : 'Purge'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Filters Component
// ---------------------------------------------------------------------------

interface ImportFiltersProps {
  filters: ImportBatchFilters;
  onFiltersChange: (filters: ImportBatchFilters) => void;
}

function ImportFilters({ filters, onFiltersChange }: ImportFiltersProps) {
  const { data: brands } = useBrandConfigs();

  const updateFilter = useCallback(
    (key: keyof ImportBatchFilters, value: string | ImportBatchStatus[] | undefined) => {
      onFiltersChange({
        ...filters,
        [key]: value || undefined,
        // Reset page when filters change
        page: key !== 'page' ? 1 : filters.page,
      });
    },
    [filters, onFiltersChange]
  );

  const hasActiveFilters =
    filters.brandId ||
    (filters.status && filters.status.length > 0) ||
    filters.periodStart ||
    filters.periodEnd;

  const clearFilters = useCallback(() => {
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  }, [filters.limit, onFiltersChange]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Brand filter */}
      <Select
        value={filters.brandId ?? ''}
        onValueChange={(val) =>
          updateFilter('brandId', val === 'all' ? undefined : val)
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

      {/* Status filter */}
      <Select
        value={filters.status?.[0] ?? ''}
        onValueChange={(val) =>
          updateFilter('status', val === 'all' ? undefined : [val as ImportBatchStatus])
        }
      >
        <SelectTrigger className="h-8 w-[150px] rounded-md text-sm">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Period date range */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          type="date"
          value={filters.periodStart ?? ''}
          onChange={(e) => updateFilter('periodStart', e.target.value)}
          className="h-8 w-[140px] text-sm rounded-md"
          aria-label="Period start date"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <Input
          type="date"
          value={filters.periodEnd ?? ''}
          onChange={(e) => updateFilter('periodEnd', e.target.value)}
          className="h-8 w-[140px] text-sm rounded-md"
          aria-label="Period end date"
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
// Table Component
// ---------------------------------------------------------------------------

interface ImportBatchesTableProps {
  data: ImportBatch[];
  meta: PaginatedMeta | undefined;
  currentPage: number;
  onPageChange: (page: number) => void;
  onRowClick: (batch: ImportBatch) => void;
  onPurge: (batch: ImportBatch) => void;
}

function ImportBatchesTable({
  data,
  meta,
  currentPage,
  onPageChange,
  onRowClick,
  onPurge,
}: ImportBatchesTableProps) {
  const columns: ColumnDef<ImportBatch>[] = useMemo(
    () => [
      {
        accessorKey: 'brandName',
        header: 'Brand',
        cell: ({ row }) => (
          <span className="font-medium text-sm">{row.original.brandName}</span>
        ),
      },
      {
        id: 'period',
        header: 'Period',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatPeriod(row.original.periodStart, row.original.periodEnd)}
          </span>
        ),
      },
      {
        accessorKey: 'granularity',
        header: 'Granularity',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs capitalize">
            {row.original.granularity}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <BatchStatusBadge status={row.original.status} />
        ),
      },
      {
        accessorKey: 'fileCount',
        header: () => <div className="text-right">Files</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums text-sm">
            {row.original.fileCount}
          </div>
        ),
      },
      {
        accessorKey: 'rowCount',
        header: () => <div className="text-right">Records</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums text-sm">
            {row.original.rowCount != null ? row.original.rowCount.toLocaleString() : '—'}
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right"><span className="sr-only">Actions</span></div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            {row.original.status === 'rolled_back' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onPurge(row.original);
                }}
                title="Purge batch"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ),
        size: 60,
      },
    ],
    [onPurge]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: meta?.totalPages ?? 1,
  });

  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

  // Page numbers for display
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

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
                  No import batches found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total} batch{total !== 1 ? 'es' : ''}
          {totalPages > 1 && (
            <span>
              {' '}
              &middot; Page {currentPage} of {totalPages}
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
            {pageNumbers.map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="h-8 w-8 p-0"
              >
                {pageNum}
              </Button>
            ))}
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

type ImportsView =
  | { type: 'list' }
  | { type: 'detail'; batchId: string }
  | { type: 'wizard' };

export function ImportDashboard() {
  const [view, setView] = useState<ImportsView>({ type: 'list' });

  const [filters, setFilters] = useState<ImportBatchFilters>({
    page: 1,
    limit: DEFAULT_LIMIT,
  });

  const [purgeBatch, setPurgeBatch] = useState<ImportBatch | null>(null);

  // Memoize query filters to prevent unnecessary re-renders
  const queryFilters = useMemo(() => filters, [filters]);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useImportBatches(queryFilters);

  const handleFiltersChange = useCallback((newFilters: ImportBatchFilters) => {
    setFilters(newFilters);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleRowClick = useCallback(
    (batch: ImportBatch) => {
      setView({ type: 'detail', batchId: batch.id });
    },
    []
  );

  const handleBack = useCallback(() => setView({ type: 'list' }), []);
  const handleNewImport = useCallback(() => setView({ type: 'wizard' }), []);

  // Sub-views
  if (view.type === 'detail') {
    return <BatchDetail batchId={view.batchId} onBack={handleBack} />;
  }
  if (view.type === 'wizard') {
    return <ImportWizard onBack={handleBack} />;
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-foreground">Imports</h1>
          <Button onClick={handleNewImport}>
            <Plus className="h-4 w-4 mr-2" />
            New Import
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <ImportFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
        {isLoading ? (
          <PageSkeleton />
        ) : error ? (
          <ErrorState
            message="Could not load import batches. Please try again."
            onRetry={() => refetch()}
          />
        ) : !response?.data || response.data.length === 0 ? (
          <EmptyState onNewImport={handleNewImport} />
        ) : (
          <ImportBatchesTable
            data={response.data}
            meta={response.meta}
            currentPage={filters.page ?? 1}
            onPageChange={handlePageChange}
            onRowClick={handleRowClick}
            onPurge={setPurgeBatch}
          />
        )}
      </div>

      {/* Purge confirmation dialog */}
      <PurgeDialog batch={purgeBatch} onClose={() => setPurgeBatch(null)} />
    </div>
  );
}
