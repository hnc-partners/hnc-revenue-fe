/**
 * RunStatusBadge.tsx
 *
 * Badge component for displaying run status with appropriate colors.
 * Uses design system semantic badge variants.
 */

import { Badge } from '@hnc-partners/ui-components';
import type { RunStatus } from '../types';

interface RunStatusBadgeProps {
  status: RunStatus;
}

const STATUS_CONFIG: Record<
  RunStatus,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' }
> = {
  running: { label: 'Running', variant: 'info' },
  success: { label: 'Success', variant: 'success' },
  partial: { label: 'Partial', variant: 'warning' },
  failed: { label: 'Failed', variant: 'destructive' },
  skipped: { label: 'Skipped', variant: 'secondary' },
  rolled_back: { label: 'Rolled Back', variant: 'warning' },
};

export function RunStatusBadge({ status }: RunStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'secondary' as const };

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}
