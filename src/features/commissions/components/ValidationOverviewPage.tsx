/**
 * ValidationOverviewPage.tsx
 *
 * Landing page for Commission Validation (FES-04).
 * DataTable showing latest validation results per brand.
 * Click a row to navigate to per-batch validation detail.
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
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
} from '@hnc-partners/ui-components';
import {
  AlertTriangle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useValidationOverview } from '../api';
import { MatchRateBadge } from './MatchRateBadge';
import type { ValidationOverview, PaginatedMeta } from '../types';

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const columns: ColumnDef<ValidationOverview>[] = [
  {
    accessorKey: 'brand_name',
    header: 'Brand Name',
    cell: ({ row }) => (
      <span className="font-medium text-sm">{row.original.brand_name}</span>
    ),
  },
  {
    accessorKey: 'validated_at',
    header: 'Last Validated',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDateTime(row.original.validated_at)}
      </span>
    ),
  },
  {
    accessorKey: 'matched',
    header: () => <div className="text-right">Matched</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums text-sm">
        {row.original.matched}
      </div>
    ),
  },
  {
    accessorKey: 'mismatched',
    header: () => <div className="text-right">Mismatched</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums text-sm">
        {row.original.mismatched}
      </div>
    ),
  },
  {
    accessorKey: 'missing',
    header: () => <div className="text-right">Missing</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums text-sm">
        {row.original.missing}
      </div>
    ),
  },
  {
    accessorKey: 'skipped',
    header: () => <div className="text-right">Skipped</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums text-sm">
        {row.original.skipped}
      </div>
    ),
  },
  {
    accessorKey: 'match_rate',
    header: () => <div className="text-right">Match Rate</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <MatchRateBadge matchRate={row.original.match_rate} />
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ShieldCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-1">
        No Validation Results
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        No validation data found. Run a validation on a commission batch to see
        results here.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

interface PaginationProps {
  meta: PaginatedMeta | undefined;
  currentPage: number;
  onPageChange: (page: number) => void;
}

function Pagination({ meta, currentPage, onPageChange }: PaginationProps) {
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

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
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        {total} result{total !== 1 ? 's' : ''}
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
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 25;

export function ValidationOverviewPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: response, isLoading, error, refetch } = useValidationOverview({
    page,
    limit: DEFAULT_LIMIT,
  });

  const table = useReactTable({
    data: response?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: response?.meta?.totalPages ?? 1,
  });

  const handleRowClick = useCallback(
    (row: ValidationOverview) => {
      navigate({
        to: '/revenue/commissions/validation/$batchId',
        params: { batchId: row.batch_id },
      });
    },
    [navigate]
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-foreground">
            Cross-Validation
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
        {isLoading ? (
          <PageSkeleton />
        ) : error ? (
          <ErrorState
            message="Could not load validation overview. Please try again."
            onRetry={() => refetch()}
          />
        ) : !response?.data || response.data.length === 0 ? (
          <EmptyState />
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
                      <TableRow
                        key={row.id}
                        className={cn(
                          'cursor-pointer hover:bg-muted/50 transition-colors'
                        )}
                        onClick={() => handleRowClick(row.original)}
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
                        No validation results found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <Pagination
              meta={response?.meta}
              currentPage={page}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
