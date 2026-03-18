/**
 * SummaryTable.tsx
 *
 * Reusable table for commission summaries that adapts columns per dimension.
 * Handles both server-side paginated data and client-side grouped data.
 */

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
} from '@hnc-partners/ui-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  SummaryDimension,
  CommissionSummary,
  CommissionSummaryByGA,
  CommissionSummaryByBrand,
  GroupedSummaryRow,
  PaginatedMeta,
} from '../types';
import { formatCurrency, formatPeriod } from './commission-helpers';

// ---------------------------------------------------------------------------
// Types for unified row data
// ---------------------------------------------------------------------------

/** Union type for all possible row shapes */
type SummaryRow =
  | CommissionSummary
  | CommissionSummaryByGA
  | CommissionSummaryByBrand
  | GroupedSummaryRow;

// ---------------------------------------------------------------------------
// Helper: Net commission color
// ---------------------------------------------------------------------------

function netCommissionColor(amount: number): string {
  if (amount > 0) return 'text-success';
  if (amount < 0) return 'text-destructive';
  return 'text-muted-foreground';
}

// ---------------------------------------------------------------------------
// Column factories per dimension
// ---------------------------------------------------------------------------

function contactColumns(onRowClick: (row: CommissionSummary) => void): ColumnDef<SummaryRow>[] {
  return [
    {
      accessorKey: 'contact_name',
      header: 'Contact Name',
      cell: ({ row }) => {
        const r = row.original as CommissionSummary;
        return (
          <button
            type="button"
            className="font-medium text-sm text-left hover:underline cursor-pointer"
            onClick={() => onRowClick(r)}
          >
            {r.contact_name}
          </button>
        );
      },
    },
    ...commonAmountColumns(),
  ];
}

function gaColumns(onRowClick: (row: CommissionSummaryByGA) => void): ColumnDef<SummaryRow>[] {
  return [
    {
      accessorKey: 'gaming_account_name',
      header: 'Gaming Account',
      cell: ({ row }) => {
        const r = row.original as CommissionSummaryByGA;
        return (
          <button
            type="button"
            className="font-medium text-sm text-left hover:underline cursor-pointer"
            onClick={() => onRowClick(r)}
          >
            {r.gaming_account_name}
          </button>
        );
      },
    },
    ...commonAmountColumns(),
  ];
}

function brandColumns(onRowClick: (row: CommissionSummaryByBrand) => void): ColumnDef<SummaryRow>[] {
  return [
    {
      accessorKey: 'brand_name',
      header: 'Brand',
      cell: ({ row }) => {
        const r = row.original as CommissionSummaryByBrand;
        return (
          <button
            type="button"
            className="font-medium text-sm text-left hover:underline cursor-pointer"
            onClick={() => onRowClick(r)}
          >
            {r.brand_name}
          </button>
        );
      },
    },
    ...commonAmountColumns(),
  ];
}

function categoryColumns(): ColumnDef<SummaryRow>[] {
  return [
    {
      accessorKey: 'label',
      header: 'Category',
      cell: ({ row }) => {
        const r = row.original as GroupedSummaryRow;
        return <span className="font-medium text-sm">{r.label}</span>;
      },
    },
    ...groupedAmountColumns(),
  ];
}

function dealTypeColumns(): ColumnDef<SummaryRow>[] {
  return [
    {
      accessorKey: 'label',
      header: 'Deal Type',
      cell: ({ row }) => {
        const r = row.original as GroupedSummaryRow;
        return <span className="font-medium text-sm">{r.label}</span>;
      },
    },
    ...groupedAmountColumns(),
  ];
}

/** Common columns for server-side dimensions (contact, ga, brand) */
function commonAmountColumns(): ColumnDef<SummaryRow>[] {
  return [
    {
      id: 'period',
      header: 'Period',
      cell: ({ row }) => {
        const r = row.original as CommissionSummary;
        return (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatPeriod(r.period_start, r.period_end)}
          </span>
        );
      },
    },
    {
      accessorKey: 'currency',
      header: 'Currency',
      cell: ({ row }) => {
        const r = row.original as CommissionSummary;
        return <span className="text-sm font-mono">{r.currency}</span>;
      },
    },
    {
      accessorKey: 'total_incoming',
      header: () => <div className="text-right">Total Incoming</div>,
      cell: ({ row }) => {
        const r = row.original as CommissionSummary;
        return (
          <div className="text-right font-mono tabular-nums text-sm">
            {formatCurrency(r.total_incoming, r.currency)}
          </div>
        );
      },
    },
    {
      accessorKey: 'total_outgoing',
      header: () => <div className="text-right">Total Outgoing</div>,
      cell: ({ row }) => {
        const r = row.original as CommissionSummary;
        return (
          <div className="text-right font-mono tabular-nums text-sm">
            {formatCurrency(r.total_outgoing, r.currency)}
          </div>
        );
      },
    },
    {
      accessorKey: 'net_commission',
      header: () => <div className="text-right">Net Commission</div>,
      cell: ({ row }) => {
        const r = row.original as CommissionSummary;
        const num = parseFloat(r.net_commission);
        return (
          <div
            className={cn(
              'text-right font-mono tabular-nums text-sm font-medium',
              netCommissionColor(num)
            )}
          >
            {formatCurrency(r.net_commission, r.currency)}
          </div>
        );
      },
    },
  ];
}

/** Amount columns for client-side grouped rows (category, deal_type) */
function groupedAmountColumns(): ColumnDef<SummaryRow>[] {
  return [
    {
      accessorKey: 'currency',
      header: 'Currency',
      cell: ({ row }) => {
        const r = row.original as GroupedSummaryRow;
        return <span className="text-sm font-mono">{r.currency}</span>;
      },
    },
    {
      id: 'period',
      header: 'Period',
      cell: ({ row }) => {
        const r = row.original as GroupedSummaryRow;
        return (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatPeriod(r.period_start, r.period_end)}
          </span>
        );
      },
    },
    {
      id: 'total_incoming',
      header: () => <div className="text-right">Total Incoming</div>,
      cell: ({ row }) => {
        const r = row.original as GroupedSummaryRow;
        return (
          <div className="text-right font-mono tabular-nums text-sm">
            {formatCurrency(String(r.total_incoming), r.currency)}
          </div>
        );
      },
    },
    {
      id: 'total_outgoing',
      header: () => <div className="text-right">Total Outgoing</div>,
      cell: ({ row }) => {
        const r = row.original as GroupedSummaryRow;
        return (
          <div className="text-right font-mono tabular-nums text-sm">
            {formatCurrency(String(r.total_outgoing), r.currency)}
          </div>
        );
      },
    },
    {
      id: 'net_commission',
      header: () => <div className="text-right">Net Commission</div>,
      cell: ({ row }) => {
        const r = row.original as GroupedSummaryRow;
        return (
          <div
            className={cn(
              'text-right font-mono tabular-nums text-sm font-medium',
              netCommissionColor(r.net_commission)
            )}
          >
            {formatCurrency(String(r.net_commission), r.currency)}
          </div>
        );
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SummaryTableProps {
  dimension: SummaryDimension;
  data: SummaryRow[];
  meta?: PaginatedMeta;
  currentPage: number;
  onPageChange: (page: number) => void;
  onContactClick?: (row: CommissionSummary) => void;
  onGAClick?: (row: CommissionSummaryByGA) => void;
  onBrandClick?: (row: CommissionSummaryByBrand) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SummaryTable({
  dimension,
  data,
  meta,
  currentPage,
  onPageChange,
  onContactClick,
  onGAClick,
  onBrandClick,
}: SummaryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo((): ColumnDef<SummaryRow>[] => {
    switch (dimension) {
      case 'contact':
        return contactColumns(onContactClick ?? (() => {}));
      case 'ga':
        return gaColumns(onGAClick ?? (() => {}));
      case 'brand':
        return brandColumns(onBrandClick ?? (() => {}));
      case 'category':
        return categoryColumns();
      case 'deal_type':
        return dealTypeColumns();
    }
  }, [dimension, onContactClick, onGAClick, onBrandClick]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    manualPagination: true,
    pageCount: meta?.totalPages ?? 1,
  });

  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? data.length;

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
                  className="hover:bg-muted/50 transition-colors"
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
                  No summary data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total} row{total !== 1 ? 's' : ''}
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
