/**
 * commission-helpers.ts
 *
 * Shared formatting and display helpers for commission components.
 */

import type { CommissionDealType } from '../types';

// ---------------------------------------------------------------------------
// Currency & number formatting
// ---------------------------------------------------------------------------

/**
 * Parse a decimal string and format as currency.
 * API returns decimal values as strings (e.g. "1234.56").
 */
export function formatCurrency(amount: string | null | undefined, currency: string | null | undefined): string {
  if (amount == null) return '—';
  const num = parseFloat(amount);
  if (isNaN(num)) return '—';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Parse a decimal string and format as percentage.
 */
export function formatPercent(value: string | null | undefined): string {
  if (value == null) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  // API stores as decimal (e.g. 0.15 for 15%)
  return `${(num * 100).toFixed(2)}%`;
}

/**
 * Format a period range as a readable string.
 */
export function formatPeriod(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return '—';
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '—';
  const fmt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${fmt.format(startDate)} - ${fmt.format(endDate)}`;
}

/**
 * Format a date string for compact table display.
 */
export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// ---------------------------------------------------------------------------
// Share category badge configuration
// ---------------------------------------------------------------------------

interface BadgeConfig {
  className: string;
  label: string;
}

const SHARE_CATEGORY_BADGES: Record<string, BadgeConfig> = {
  POKER: {
    className: 'text-info border-info/30 bg-info/10',
    label: 'Poker',
  },
  CASINO: {
    className: 'text-destructive border-destructive/30 bg-destructive/10',
    label: 'Casino',
  },
  SPORTS: {
    className: 'text-success border-success/30 bg-success/10',
    label: 'Sports',
  },
};

/**
 * Get badge config for a share category code.
 * Returns colored badge config for known categories, neutral for unknown.
 */
export function shareCategoryBadgeConfig(code: string | null | undefined): BadgeConfig {
  if (!code) return { className: 'text-muted-foreground border-border', label: '—' };
  return (
    SHARE_CATEGORY_BADGES[code.toUpperCase()] ?? {
      className: 'text-muted-foreground border-border',
      label: code,
    }
  );
}

// ---------------------------------------------------------------------------
// Deal type labels
// ---------------------------------------------------------------------------

const DEAL_TYPE_LABELS: Record<CommissionDealType, string> = {
  master_agent: 'Master Agent',
  player: 'Player',
  sub_agent: 'Sub-Agent',
  referrer: 'Referrer',
};

/**
 * Get human-readable label for a deal type.
 */
export function dealTypeLabel(dealType: CommissionDealType): string {
  return DEAL_TYPE_LABELS[dealType] ?? dealType;
}
