/**
 * NotifyStatusBadge.tsx
 *
 * Badge for displaying notification status of a download run.
 * Shows retry button for failed/processing_failed states.
 */

import { Badge, Button } from '@hnc-partners/ui-components';
import { RefreshCw } from 'lucide-react';
import type { NotifyStatus } from '../types';

interface NotifyStatusBadgeProps {
  status: NotifyStatus;
  /** Called when retry notify is clicked (for failed/processing_failed) */
  onRetryNotify?: () => void;
  isRetrying?: boolean;
}

const STATUS_CONFIG: Record<
  NotifyStatus,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'; showRetry: boolean }
> = {
  pending: { label: 'Pending', variant: 'secondary', showRetry: false },
  notified: { label: 'Notified', variant: 'success', showRetry: false },
  failed: { label: 'Notify Failed', variant: 'destructive', showRetry: true },
  skipped: { label: 'Skipped', variant: 'secondary', showRetry: false },
  processing_failed: { label: 'Processing Failed', variant: 'destructive', showRetry: true },
};

export function NotifyStatusBadge({
  status,
  onRetryNotify,
  isRetrying,
}: NotifyStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'secondary' as const, showRetry: false };

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
      {config.showRetry && onRetryNotify && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onRetryNotify();
          }}
          disabled={isRetrying}
          aria-label="Retry notification"
        >
          <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}
