/**
 * BatchLogsTab.tsx
 *
 * Audit Log tab for the Batch Detail page (FES-03).
 * Displays paginated, filterable log entries with expandable JSON details.
 */

import { useState, useCallback, useMemo } from 'react';
// Table rendering handled via custom LogRow component for expandable rows
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@hnc-partners/ui-components';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBatchLogs } from '../api';
import type { ImportLog, LogLevel, LogQueryParams } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 25;

const LOG_LEVEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warning' },
  { value: 'error', label: 'Error' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function logLevelVariant(
  level: LogLevel
): 'info' | 'warning' | 'destructive' {
  switch (level) {
    case 'info':
      return 'info';
    case 'warn':
      return 'warning';
    case 'error':
      return 'destructive';
  }
}

// ---------------------------------------------------------------------------
// Expandable Row Component
// ---------------------------------------------------------------------------

interface LogRowProps {
  log: ImportLog;
  isExpanded: boolean;
  onToggle: () => void;
  colCount: number;
}

function LogRow({ log, isExpanded, onToggle, colCount }: LogRowProps) {
  const hasDetails = log.details !== null && log.details !== undefined;

  return (
    <>
      <TableRow
        className={cn(
          hasDetails && 'cursor-pointer hover:bg-muted/50 transition-colors'
        )}
        onClick={hasDetails ? onToggle : undefined}
      >
        <TableCell className="w-8">
          {hasDetails && (
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0" aria-label={isExpanded ? 'Collapse log details' : 'Expand log details'}>
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </TableCell>
        <TableCell>
          <Badge
            variant={logLevelVariant(log.logLevel)}
            className="text-xs capitalize"
          >
            {log.logLevel}
          </Badge>
        </TableCell>
        <TableCell>
          <span className="text-sm">{log.message}</span>
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatTimestamp(log.createdAt)}
          </span>
        </TableCell>
      </TableRow>
      {isExpanded && hasDetails && (
        <TableRow>
          <TableCell colSpan={colCount} className="bg-muted/30 p-0">
            <div className="px-6 py-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Details
              </p>
              <pre className="rounded-md bg-card border border-border p-3 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BatchLogsTabProps {
  batchId: string;
}

export function BatchLogsTab({ batchId }: BatchLogsTabProps) {
  const [params, setParams] = useState<LogQueryParams>({
    page: 1,
    limit: DEFAULT_LIMIT,
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: response, isLoading, error, refetch } = useBatchLogs(batchId, params);

  // Rows rendered via custom LogRow component for expandable detail support

  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleLevelChange = useCallback((val: string) => {
    setParams((prev) => ({
      ...prev,
      logLevel: val === 'all' ? undefined : (val as LogLevel),
      page: 1,
    }));
    setExpandedRows(new Set());
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
    setExpandedRows(new Set());
  }, []);

  const currentPage = params.page ?? 1;
  const totalPages = response?.meta?.totalPages ?? 1;
  const total = response?.meta?.total ?? 0;

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

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-[180px]" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

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
          Could not load audit logs. Please try again.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Select
          value={params.logLevel ?? 'all'}
          onValueChange={handleLevelChange}
        >
          <SelectTrigger className="h-8 w-[180px] rounded-md text-sm">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            {LOG_LEVEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {!response?.data || response.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            No log entries yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Log entries will appear here as the batch is processed.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead className="text-xs font-medium uppercase tracking-wider">
                    Level
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">
                    Message
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">
                    Timestamp
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {response.data.map((log) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    isExpanded={expandedRows.has(log.id)}
                    onToggle={() => toggleRow(log.id)}
                    colCount={4}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {total} log entr{total !== 1 ? 'ies' : 'y'}
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
                  onClick={() => handlePageChange(currentPage - 1)}
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
                    onClick={() => handlePageChange(pageNum)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                ))}
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
            )}
          </div>
        </>
      )}
    </div>
  );
}
