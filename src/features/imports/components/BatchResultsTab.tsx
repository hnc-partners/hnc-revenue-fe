/**
 * BatchResultsTab.tsx
 *
 * Processing Results tab for the Batch Detail page (FES-03).
 * Shows stats cards and validation issues table when batch is processed/failed.
 */

import { useMemo } from 'react';
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
} from '@hnc-partners/ui-components';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Info,
} from 'lucide-react';
import type { ImportBatchDetail, ProcessingIssue } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(startStr: string | null, endStr: string | null): string {
  if (!startStr || !endStr) return '-';
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  const diffMs = end - start;

  if (isNaN(diffMs) || diffMs < 0) return '-';

  if (diffMs < 1000) return `${diffMs}ms`;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function severityVariant(
  severity: ProcessingIssue['severity']
): 'destructive' | 'warning' | 'info' {
  switch (severity) {
    case 'error':
      return 'destructive';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
  }
}

// ---------------------------------------------------------------------------
// Column definitions for validation issues
// ---------------------------------------------------------------------------

function getIssueColumns(): ColumnDef<ProcessingIssue>[] {
  return [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.type}</span>
      ),
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => (
        <Badge
          variant={severityVariant(row.original.severity)}
          className="text-xs capitalize"
        >
          {row.original.severity}
        </Badge>
      ),
    },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.message}
        </span>
      ),
    },
    {
      accessorKey: 'brandPlayerId',
      header: 'Brand Player ID',
      cell: ({ row }) => (
        <span className="text-sm font-mono">
          {row.original.brandPlayerId ?? '-'}
        </span>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BatchResultsTabProps {
  batch: ImportBatchDetail;
}

export function BatchResultsTab({ batch }: BatchResultsTabProps) {
  const isProcessed = batch.status === 'processed' || batch.status === 'failed';
  const issues = batch.validationErrors ?? [];
  const columns = useMemo(() => getIssueColumns(), []);

  const table = useReactTable({
    data: issues,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!isProcessed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Info className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          Not yet processed
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Processing results will appear here once the batch has been processed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      {batch.status === 'processed' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Revenue Records Created
              </p>
            </div>
            <p className="text-2xl font-semibold font-mono tabular-nums">
              {batch.rowCount.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-info" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Processing Duration
              </p>
            </div>
            <p className="text-2xl font-semibold font-mono tabular-nums">
              {formatDuration(
                batch.processingStartedAt,
                batch.processingCompletedAt
              )}
            </p>
          </div>
        </div>
      )}

      {/* Failed status — show prominent error */}
      {batch.status === 'failed' && issues.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="text-sm font-medium text-destructive">
              Processing failed with {issues.length} validation issue
              {issues.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Validation issues table */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          Validation Issues
        </h3>

        {issues.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-success">
              <CheckCircle className="h-4 w-4" />
              <p className="text-sm">
                No validation issues — all records processed successfully
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
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
                  {table.getRowModel().rows.map((row) => (
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
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="text-sm text-muted-foreground">
              {issues.length} issue{issues.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
