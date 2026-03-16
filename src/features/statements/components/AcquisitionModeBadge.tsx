/**
 * AcquisitionModeBadge.tsx
 *
 * Small badge showing the acquisition mode for a brand's statements.
 * Uses design system Badge component with appropriate icon.
 */

import { Badge } from '@hnc-partners/ui-components';
import { Bot, Upload, PenLine } from 'lucide-react';
import type { AcquisitionMode } from '../types';

interface AcquisitionModeBadgeProps {
  mode: AcquisitionMode;
}

const MODE_CONFIG: Record<
  AcquisitionMode,
  { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline' }
> = {
  automated_download: {
    label: 'Automated',
    icon: Bot,
    variant: 'secondary',
  },
  manual_download: {
    label: 'Manual Upload',
    icon: Upload,
    variant: 'outline',
  },
  manual_input: {
    label: 'Manual Entry',
    icon: PenLine,
    variant: 'outline',
  },
};

export function AcquisitionModeBadge({ mode }: AcquisitionModeBadgeProps) {
  const config = MODE_CONFIG[mode];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1 text-xs font-normal">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
