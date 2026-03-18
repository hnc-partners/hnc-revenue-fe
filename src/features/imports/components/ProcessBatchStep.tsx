/**
 * ProcessBatchStep.tsx
 *
 * Step 3 of the import wizard — Process Batch.
 * Triggers batch processing and displays results or validation issues.
 * Processing can take ~30s — shows loading state throughout.
 */

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Button,
  Badge,
  Spinner,
} from '@hnc-partners/ui-components';
import { toast } from 'sonner';
import {
  Play,
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useProcessBatch } from '../api';
import type { ProcessingResult, ProcessingIssue } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function severityVariant(severity: ProcessingIssue['severity']) {
  switch (severity) {
    case 'error':
      return 'destructive' as const;
    case 'warning':
      return 'warning' as const;
    case 'info':
      return 'info' as const;
    default:
      return 'secondary' as const;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatsCardProps {
  result: ProcessingResult;
}

function StatsCard({ result }: StatsCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-full bg-success/10 p-2">
          <Check className="h-5 w-5 text-success" />
        </div>
        <h3 className="text-lg font-medium text-foreground">
          Processing Complete
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Revenue Records
          </p>
          <p className="text-2xl font-semibold font-mono tabular-nums">
            {(result.revenueRecordsCreated ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Amount Records
          </p>
          <p className="text-2xl font-semibold font-mono tabular-nums">
            {(result.amountRecordsCreated ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Players Correlated
          </p>
          <p className="text-2xl font-semibold font-mono tabular-nums">
            {(result.totalPlayersCorrelated ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Correlation summary by file type */}
      {result.correlationSummary && result.correlationSummary.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium mb-3">Correlation Summary</h4>
          <div className="space-y-2">
            {result.correlationSummary.map((cs) => (
              <div
                key={cs.fileType}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground capitalize">
                  {cs.fileType.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-4 font-mono tabular-nums">
                  <span className="text-success">
                    {cs.matched.toLocaleString()} matched
                  </span>
                  {cs.unmatched > 0 && (
                    <span className="text-warning">
                      {cs.unmatched.toLocaleString()} unmatched
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface IssuesTableProps {
  issues: ProcessingIssue[];
}

function IssuesTable({ issues }: IssuesTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-full bg-destructive/10 p-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <h3 className="text-lg font-medium text-foreground">
          Processing Failed
        </h3>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                Severity
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                Message
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                Brand Player ID
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {issues.map((issue, idx) => (
              <tr key={idx} className="hover:bg-muted/30">
                <td className="px-4 py-2 text-sm">{issue.type}</td>
                <td className="px-4 py-2">
                  <Badge variant={severityVariant(issue.severity)} className="text-xs">
                    {issue.severity}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-sm text-muted-foreground">
                  {issue.message}
                </td>
                <td className="px-4 py-2 text-sm font-mono text-muted-foreground">
                  {issue.brandPlayerId || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface ProcessBatchStepProps {
  batchId: string;
}

export function ProcessBatchStep({ batchId }: ProcessBatchStepProps) {
  const navigate = useNavigate();
  const processBatch = useProcessBatch();
  const [result, setResult] = useState<ProcessingResult | null>(null);

  const handleProcess = () => {
    processBatch.mutate(batchId, {
      onSuccess: (data) => {
        setResult(data);
        if (data.status === 'processed') {
          toast.success('Batch processed successfully');
        } else {
          toast.error('Batch processing completed with issues');
        }
      },
      onError: (error) => {
        toast.error('Failed to process batch. Please try again.');
        console.error('Process batch error:', error);
      },
    });
  };

  // Initial state — ready to process
  if (!result && !processBatch.isPending) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-mf-accent/10 p-4 mb-4">
            <Play className="h-8 w-8 text-mf-accent" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Ready to Process
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Files have been uploaded. Click the button below to start processing
            the batch. This may take up to 30 seconds for large batches.
          </p>
          <Button onClick={handleProcess} size="lg">
            <Play className="h-4 w-4 mr-2" />
            Process Batch
          </Button>
        </div>

        {/* Back to imports */}
        <div className="flex justify-start pt-4">
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/revenue/imports' })}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Imports
          </Button>
        </div>
      </div>
    );
  }

  // Processing state — loading
  if (processBatch.isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Spinner size="lg" className="mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Processing Batch...
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          This may take up to 30 seconds. Please do not close this page.
        </p>
      </div>
    );
  }

  // Error state — mutation error (not processing issues)
  if (processBatch.isError && !result) {
    return (
      <div className="space-y-6">
        <div
          className="flex flex-col items-center justify-center py-8 text-center"
          role="alert"
        >
          <div className="rounded-full bg-destructive/10 p-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            Processing Failed
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            An error occurred while processing the batch. You can try again.
          </p>
          <Button onClick={handleProcess}>
            Try Again
          </Button>
        </div>
        <div className="flex justify-start">
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/revenue/imports' })}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Imports
          </Button>
        </div>
      </div>
    );
  }

  // Result state — success or failure with issues
  return (
    <div className="space-y-6">
      {result?.status === 'processed' ? (
        <StatsCard result={result} />
      ) : result?.issues && result.issues.length > 0 ? (
        <IssuesTable issues={result.issues} />
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Processing completed.</p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => navigate({ to: '/revenue/imports' })}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Imports
        </Button>
        <Button
          onClick={() =>
            navigate({
              to: '/revenue/imports/$batchId',
              params: { batchId },
            })
          }
        >
          View Batch Detail
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
