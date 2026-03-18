/**
 * CommissionResultsTable.tsx
 *
 * Data table for commission results with server-side pagination.
 * Uses TanStack Table for column definitions and rendering.
 * Click row to expand and show detail panel.
 */

import { useState, useMemo } from 'react';
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
  Badge,
  Button,
} from '@hnc-partners/ui-components';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommissionResult, PaginatedMeta } from '../types';
import {
  formatCurrency,
  formatPercent,
  formatDateShort,
  shareCategoryBadgeConfig,
  dealTypeLabel,
} from './commission-helpers';
import { CommissionResultDetail } from './CommissionResultDetail';

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const columns: ColumnDef<CommissionResult>[] = [
  {
    accessorKey: 'gaming_account_name',
    header: 'Gaming Account',
    cell: ({ row }) => (
      <span className="font-medium text-sm">{row.original.gaming_account_name}</span>
    ),
  },
  {
    accessorKey: 'contact_name',
    header: 'Contact',
    cell: ({ row }) => (
      <span className="text-sm">{row.original.contact_name}</span>
    ),
  },
  {
    accessorKey: 'share_category_code',
    header: 'Category',
    cell: ({ row }) => {
      const config = shareCategoryBadgeConfig(row.original.share_category_code);
      return (
        <Badge variant="outline" className={cn('text-xs', config.className)}>
          {row.original.share_category_name}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'share_type',
    header: 'Share Type',
    cell: ({ row }) => (
      <span className="text-sm font-mono">{row.original.share_type}</span>
    ),
  },
  {
    accessorKey: 'deal_type',
    header: 'Deal Type',
    cell: ({ row }) => (
      <span className="text-sm">{dealTypeLabel(row.original.deal_type)}</span>
    ),
  },
  {
    accessorKey: 'direction',
    header: 'Direction',
    cell: ({ row }) => (
      <Badge
        variant={row.original.direction === 'incoming' ? 'info' : 'warning'}
        className="text-xs"
      >
        {row.original.direction}
      </Badge>
    ),
  },
  {
    accessorKey: 'share_pct_applied',
    header: () => <div className="text-right">Share %</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums text-sm">
        {formatPercent(row.original.share_pct_applied)}
      </div>
    ),
  },
  {
    accessorKey: 'revenue_amount',
    header: () => <div className="text-right">Revenue</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums text-sm">
        {formatCurrency(row.original.revenue_amount, row.original.currency)}
      </div>
    ),
  },
  {
    accessorKey: 'commission_amount',
    header: () => <div className="text-right">Commission</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums text-sm font-medium">
        {formatCurrency(row.original.commission_amount, row.original.currency)}
      </div>
    ),
  },
  {
    id: 'period',
    header: 'Period',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDateShort(row.original.period_start)} -{' '}
        {formatDateShort(row.original.period_end)}
      </span>
    ),
  },
  {
    id: 'expand',
    header: '',
    cell: () => (
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    ),
    size: 40,
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CommissionResultsTableProps {
  data: CommissionResult[];
  meta: PaginatedMeta | undefined;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommissionResultsTable({
  data,
  meta,
  currentPage,
  onPageChange,
}: CommissionResultsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
                <TableRowWithExpand
                  key={row.id}
                  row={row}
                  isExpanded={expandedId === row.original.id}
                  onToggle={() =>
                    setExpandedId(
                      expandedId === row.original.id ? null : row.original.id
                    )
                  }
                  columnsCount={columns.length}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No commission results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row with expand support
// ---------------------------------------------------------------------------

interface TableRowWithExpandProps {
  row: ReturnType<ReturnType<typeof useReactTable<CommissionResult>>['getRowModel']>['rows'][0];
  isExpanded: boolean;
  onToggle: () => void;
  columnsCount: number;
}

function TableRowWithExpand({
  row,
  isExpanded,
  onToggle,
  columnsCount,
}: TableRowWithExpandProps) {
  return (
    <>
      <TableRow
        className={cn(
          'cursor-pointer hover:bg-muted/50 transition-colors',
          isExpanded && 'bg-muted/30'
        )}
        onClick={onToggle}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={columnsCount} className="p-0">
            <CommissionResultDetail
              result={row.original}
              onClose={onToggle}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
