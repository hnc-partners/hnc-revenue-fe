/**
 * ExtrasViewer.tsx
 *
 * Renders the JSONB extras field as expandable key-value pairs.
 * Handles variable shapes per brand (game breakdowns, bonuses, fees).
 */

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExtrasViewerProps {
  /** JSONB extras object — variable shape per brand */
  extras: Record<string, unknown>;
}

/**
 * Recursively render a value: primitives as text, objects/arrays as expandable.
 */
function RenderValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">null</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="font-mono text-sm">{value ? 'true' : 'false'}</span>;
  }

  if (typeof value === 'number') {
    return (
      <span className={cn('font-mono tabular-nums text-sm', value < 0 && 'text-destructive')}>
        {value.toLocaleString()}
      </span>
    );
  }

  if (typeof value === 'string') {
    // Try to format as a number if it looks like one
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') {
      return (
        <span className={cn('font-mono tabular-nums text-sm', num < 0 && 'text-destructive')}>
          {num.toLocaleString()}
        </span>
      );
    }
    return <span className="text-sm">{value}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground italic text-sm">empty array</span>;
    }
    return (
      <div className="space-y-1">
        {value.map((item, i) => (
          <div key={i} className="pl-4 border-l border-border">
            <RenderValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    return <ExpandableObject obj={value as Record<string, unknown>} depth={depth + 1} />;
  }

  return <span className="text-sm">{String(value)}</span>;
}

/**
 * An expandable object section.
 */
function ExpandableObject({
  obj,
  depth = 0,
}: {
  obj: Record<string, unknown>;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const entries = Object.entries(obj);

  if (entries.length === 0) {
    return <span className="text-muted-foreground italic text-sm">empty</span>;
  }

  return (
    <div>
      {depth > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 transition-transform',
              expanded && 'rotate-90'
            )}
          />
          <span>{entries.length} {entries.length === 1 ? 'item' : 'items'}</span>
        </button>
      )}
      {expanded && (
        <div className={cn('space-y-1.5', depth > 0 && 'pl-4 mt-1 border-l border-border')}>
          {entries.map(([key, val]) => (
            <div key={key}>
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap min-w-0">
                  {formatKey(key)}
                </span>
                {isPrimitive(val) ? (
                  <RenderValue value={val} depth={depth} />
                ) : null}
              </div>
              {!isPrimitive(val) && (
                <div className="mt-0.5">
                  <RenderValue value={val} depth={depth} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Format a camelCase or snake_case key to a human-friendly label.
 */
function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Check if a value is a primitive (not an object/array).
 */
function isPrimitive(value: unknown): boolean {
  return value === null || value === undefined || typeof value !== 'object';
}

/**
 * Main ExtrasViewer component.
 */
export function ExtrasViewer({ extras }: ExtrasViewerProps) {
  const entries = Object.entries(extras);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No extra data</p>
    );
  }

  return (
    <div className="space-y-2">
      <ExpandableObject obj={extras} depth={0} />
    </div>
  );
}
