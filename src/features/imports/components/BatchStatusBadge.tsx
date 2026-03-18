/**
 * BatchStatusBadge.tsx
 *
 * Badge component for displaying import batch status with appropriate colors.
 */

import { Badge } from '@hnc-partners/ui-components';
import type { ImportBatchStatus } from '../types';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  ImportBatchStatus,
  { label: string; variant: 'warning' | 'info' | 'success' | 'destructive' | 'secondary' | 'default' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  validating: { label: 'Validating', variant: 'info' },
  processing: { label: 'Processing', variant: 'info' },
  processed: { label: 'Processed', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
  rolled_back: { label: 'Rolled Back', variant: 'secondary' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BatchStatusBadgeProps {
  status: ImportBatchStatus;
}

export function BatchStatusBadge({ status }: BatchStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: 'default' as const,
  };

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}
