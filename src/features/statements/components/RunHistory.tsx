/**
 * RunHistory.tsx
 *
 * Paginated table of download runs for a brand.
 * Expandable rows to show file details per run.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, FileText } from 'lucide-react';
import { Button, Skeleton } from '@hnc-partners/ui-components';
import { cn } from '@/lib/utils';
import { useBrandRuns, useRetryRun, useRetryNotify } from '../api';
import { RunStatusBadge } from './RunStatusBadge';
import { NotifyStatusBadge } from './NotifyStatusBadge';
import type { RMDownloadRun, RMDownloadRunFile } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(isoString: string | null): string {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function formatDateRange(start: string, end: string): string {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
    return `${fmt.format(new Date(start))} - ${fmt.format(new Date(end))}`;
  } catch {
    return `${start} - ${end}`;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// File Details (expandable row content)
// ---------------------------------------------------------------------------

function FileDetails({ files }: { files: RMDownloadRunFile[] }) {
  if (files.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic px-4 py-2">No files recorded</p>
    );
  }

  return (
    <div className="px-4 py-2 space-y-1.5">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 text-xs rounded-md bg-muted/50 px-3 py-2"
        >
          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium text-foreground min-w-0 truncate flex-1">
            {file.fileName}
          </span>
          <span className="text-muted-foreground shrink-0">{file.fileType}</span>
          <span className="text-muted-foreground font-mono tabular-nums shrink-0">
            {formatFileSize(file.fileSize)}
          </span>
          {file.recordCount !== null && (
            <span className="text-muted-foreground shrink-0">
              {file.recordCount} rows
            </span>
          )}
          <span
            className={cn(
              'shrink-0 font-medium',
              file.status === 'processed' && 'text-success',
              file.status === 'failed' && 'text-destructive',
              file.status === 'pending' && 'text-muted-foreground'
            )}
          >
            {file.status}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Run Row
// ---------------------------------------------------------------------------

interface RunRowProps {
  run: RMDownloadRun;
  brandCode: string;
}

function RunRow({ run, brandCode }: RunRowProps) {
  const [expanded, setExpanded] = useState(false);
  const retryRunMutation = useRetryRun(brandCode);
  const retryNotifyMutation = useRetryNotify(brandCode);

  const canRetry = run.status === 'failed';

  return (
    <>
      <tr
        className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Expand toggle */}
        <td className="px-3 py-2.5 w-8">
          {run.files.length > 0 ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )
          ) : null}
        </td>

        {/* Period */}
        <td className="px-3 py-2.5 text-xs text-foreground whitespace-nowrap">
          {formatDateRange(run.periodStart, run.periodEnd)}
        </td>

        {/* Status */}
        <td className="px-3 py-2.5">
          <RunStatusBadge status={run.status} />
        </td>

        {/* Notify Status */}
        <td className="px-3 py-2.5">
          <NotifyStatusBadge
            status={run.notifyStatus}
            onRetryNotify={() => retryNotifyMutation.mutate(run.id)}
            isRetrying={retryNotifyMutation.isPending}
          />
        </td>

        {/* Started */}
        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {formatDateTime(run.startedAt)}
        </td>

        {/* Files count */}
        <td className="px-3 py-2.5 text-xs text-right font-mono tabular-nums text-muted-foreground">
          {run.files.length}
        </td>

        {/* Actions */}
        <td className="px-3 py-2.5 text-right">
          {canRetry && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                retryRunMutation.mutate(run.id);
              }}
              disabled={retryRunMutation.isPending}
              aria-label="Retry run"
            >
              <RefreshCw
                className={cn(
                  'h-3.5 w-3.5',
                  retryRunMutation.isPending && 'animate-spin'
                )}
              />
            </Button>
          )}
        </td>
      </tr>
      {expanded && run.files.length > 0 && (
        <tr>
          <td colSpan={7} className="bg-muted/30 border-b border-border">
            <FileDetails files={run.files} />
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// RunHistory Component
// ---------------------------------------------------------------------------

interface RunHistoryProps {
  brandCode: string;
}

export function RunHistory({ brandCode }: RunHistoryProps) {
  const [page, setPage] = useState(1);
  const { data: response, isLoading, error, refetch } = useBrandRuns(brandCode, page);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <p className="text-sm text-destructive mb-2">Failed to load run history</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  const runs = response?.data ?? [];
  const meta = response?.meta;

  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No runs recorded yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-3 py-2 w-8" />
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Period
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Notify
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Started
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Files
              </th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {runs.map((run: RMDownloadRun) => (
              <RunRow key={run.id} run={run} brandCode={brandCode} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages} ({meta.total} runs)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
