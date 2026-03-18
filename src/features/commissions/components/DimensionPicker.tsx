/**
 * DimensionPicker.tsx
 *
 * Segmented control for selecting the summary dimension.
 * Uses Tabs from ui-components for consistent look with the rest of the app.
 */

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@hnc-partners/ui-components';
import type { SummaryDimension } from '../types';

// ---------------------------------------------------------------------------
// Dimension options
// ---------------------------------------------------------------------------

const DIMENSIONS: { value: SummaryDimension; label: string }[] = [
  { value: 'contact', label: 'By Contact' },
  { value: 'ga', label: 'By Gaming Account' },
  { value: 'brand', label: 'By Brand' },
  { value: 'category', label: 'By Category' },
  { value: 'deal_type', label: 'By Deal Type' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DimensionPickerProps {
  value: SummaryDimension;
  onChange: (dimension: SummaryDimension) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DimensionPicker({ value, onChange }: DimensionPickerProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(val) => onChange(val as SummaryDimension)}
    >
      <TabsList className="h-9 bg-muted p-0.5">
        {DIMENSIONS.map((dim) => (
          <TabsTrigger
            key={dim.value}
            value={dim.value}
            className="h-8 px-3 text-xs font-medium rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            {dim.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
