/**
 * BatchDetail.tsx
 *
 * Main Batch Detail page component (FES-03).
 * Shows header section with batch info + action buttons,
 * and three tabs: Files, Processing Results, Audit Log.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Button,
  Badge,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@hnc-partners/ui-components';
import { toast } from 'sonner';
import {
  ArrowLeft,
  AlertTriangle,
  Upload,
  RotateCcw,
  Trash2,
  Calculator,
} from 'lucide-react';
import { useImportBatch, useRollbackBatch, usePurgeBatch } from '../api';
import { BatchStatusBadge } from './BatchStatusBadge';
import { BatchFilesTab } from './BatchFilesTab';
import { BatchResultsTab } from './BatchResultsTab';
import { BatchLogsTab } from './BatchLogsTab';
import type { ImportBatchDetail } from '../types';

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

function formatDateTime(dateStr: string): string {
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

function formatDuration(startStr: string | null, endStr: string | null): string | null {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  const diffMs = end - start;

  if (isNaN(diffMs) || diffMs < 0) return null;

  if (diffMs < 1000) return `${diffMs}ms`;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageSkeleton() {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden" aria-busy="true">
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-7 w-64 mb-2" />
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-9 w-full mb-4" />
      </div>
      <div className="px-4 sm:px-6 lg:px-8 pb-6 flex-1">
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
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

// ---------------------------------------------------------------------------
// Confirmation Dialogs
// ---------------------------------------------------------------------------

interface RollbackDialogProps {
  batch: ImportBatchDetail | null;
  onClose: () => void;
}

function RollbackDialog({ batch, onClose }: RollbackDialogProps) {
  const rollback = useRollbackBatch();

  const handleRollback = () => {
    if (!batch) return;
    rollback.mutate(batch.id, {
      onSuccess: () => {
        toast.success('Batch rolled back successfully. Revenue records deleted.');
        onClose();
      },
      onError: () => {
        toast.error('Failed to rollback batch. Please try again.');
      },
    });
  };

  return (
    <Dialog open={!!batch} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Rollback Import Batch</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive font-medium">
              Warning: This action will permanently delete all revenue records
              created by this batch. This cannot be undone.
            </p>
          </div>
          {batch && (
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <p>
                <span className="font-medium">Brand:</span> {batch.brandName}
              </p>
              <p>
                <span className="font-medium">Period:</span>{' '}
                {formatDate(batch.periodStart)} — {formatDate(batch.periodEnd)}
              </p>
              <p>
                <span className="font-medium">Records:</span>{' '}
                {batch.rowCount.toLocaleString()}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={rollback.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRollback}
              disabled={rollback.isPending}
            >
              {rollback.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Rolling back...
                </>
              ) : (
                'Rollback'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PurgeDialogProps {
  batch: ImportBatchDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}

function PurgeDialog({ batch, onClose, onSuccess }: PurgeDialogProps) {
  const purge = usePurgeBatch();

  const handlePurge = () => {
    if (!batch) return;
    purge.mutate(batch.id, {
      onSuccess: () => {
        toast.success('Batch purged successfully.');
        onClose();
        onSuccess();
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
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive font-medium">
              Warning: This will permanently delete this batch and all associated
              data. This action cannot be undone.
            </p>
          </div>
          {batch && (
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <p>
                <span className="font-medium">Brand:</span> {batch.brandName}
              </p>
              <p>
                <span className="font-medium">Period:</span>{' '}
                {formatDate(batch.periodStart)} — {formatDate(batch.periodEnd)}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={purge.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handlePurge}
              disabled={purge.isPending}
            >
              {purge.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Purging...
                </>
              ) : (
                'Purge'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Action Buttons
// ---------------------------------------------------------------------------

interface BatchActionsProps {
  batch: ImportBatchDetail;
  onRollback: () => void;
  onPurge: () => void;
}

function BatchActions({ batch, onRollback, onPurge }: BatchActionsProps) {
  const navigate = useNavigate();

  switch (batch.status) {
    case 'processed':
      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRollback}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Rollback
          </Button>
          <Button
            variant="outline"
            disabled
            title="Coming in F21 — Recalculate Commissions"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Recalculate Commissions
          </Button>
        </div>
      );
    case 'rolled_back':
      return (
        <Button variant="outline" onClick={onPurge}>
          <Trash2 className="h-4 w-4 mr-2" />
          Purge
        </Button>
      );
    case 'pending':
      return (
        <Button
          onClick={() =>
            navigate({ to: '/revenue/imports/new' })
          }
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Header Section
// ---------------------------------------------------------------------------

interface BatchHeaderProps {
  batch: ImportBatchDetail;
  onRollback: () => void;
  onPurge: () => void;
}

function BatchHeader({ batch, onRollback, onPurge }: BatchHeaderProps) {
  const duration = formatDuration(
    batch.processingStartedAt,
    batch.processingCompletedAt
  );

  return (
    <div className="space-y-3">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            {batch.brandName}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {formatDate(batch.periodStart)} — {formatDate(batch.periodEnd)}
            </span>
            <Badge variant="outline" className="text-xs capitalize">
              {batch.granularity}
            </Badge>
            <BatchStatusBadge status={batch.status} />
          </div>
        </div>
        <BatchActions
          batch={batch}
          onRollback={onRollback}
          onPurge={onPurge}
        />
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        {batch.processingStartedAt && (
          <span>
            Started: {formatDateTime(batch.processingStartedAt)}
          </span>
        )}
        {batch.processingCompletedAt && (
          <span>
            Completed: {formatDateTime(batch.processingCompletedAt)}
          </span>
        )}
        {duration && (
          <span>Duration: {duration}</span>
        )}
        <span>Created by: {batch.createdBy}</span>
        <span>Created: {formatDateTime(batch.createdAt)}</span>
      </div>

      {/* Validation errors banner for failed batches */}
      {batch.status === 'failed' &&
        batch.validationErrors &&
        batch.validationErrors.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm font-medium text-destructive">
                Processing failed with {batch.validationErrors.length} validation
                error{batch.validationErrors.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab Types
// ---------------------------------------------------------------------------

type DetailTab = 'files' | 'results' | 'logs';

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'files', label: 'Files' },
  { id: 'results', label: 'Processing Results' },
  { id: 'logs', label: 'Audit Log' },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface BatchDetailProps {
  batchId: string;
}

export function BatchDetail({ batchId }: BatchDetailProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('files');
  const [rollbackBatch, setRollbackBatch] = useState<ImportBatchDetail | null>(null);
  const [purgeBatchTarget, setPurgeBatchTarget] = useState<ImportBatchDetail | null>(null);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useImportBatch(batchId);

  const batch = response?.data;

  const handleBack = useCallback(() => {
    navigate({ to: '/revenue/imports' });
  }, [navigate]);

  const handlePurgeSuccess = useCallback(() => {
    // Navigate back to imports list after purge
    navigate({ to: '/revenue/imports' });
  }, [navigate]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 pt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Imports
          </Button>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 pb-6 flex-1">
          <ErrorState
            message="Could not load batch details. Please try again."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  if (!batch) {
    return null;
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header area */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Imports
        </Button>

        {/* Batch header info */}
        <BatchHeader
          batch={batch}
          onRollback={() => setRollbackBatch(batch)}
          onPurge={() => setPurgeBatchTarget(batch)}
        />

        {/* Tabs */}
        <div className="mt-4 mb-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as DetailTab)}
          >
            <TabsList className="h-9 bg-muted/50 p-1">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
        {activeTab === 'files' && (
          <BatchFilesTab files={batch.files} />
        )}
        {activeTab === 'results' && (
          <BatchResultsTab batch={batch} />
        )}
        {activeTab === 'logs' && (
          <BatchLogsTab batchId={batchId} />
        )}
      </div>

      {/* Confirmation dialogs */}
      <RollbackDialog
        batch={rollbackBatch}
        onClose={() => setRollbackBatch(null)}
      />
      <PurgeDialog
        batch={purgeBatchTarget}
        onClose={() => setPurgeBatchTarget(null)}
        onSuccess={handlePurgeSuccess}
      />
    </div>
  );
}
