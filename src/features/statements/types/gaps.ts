/**
 * Gap Detection Types (F54 — FE-4)
 *
 * Types for the statement gaps matrix visualization.
 * Gaps are computed on the fly by the API (not stored).
 */

/** Status of a statement period for a brand */
export type RMGapStatus = 'received' | 'missing' | 'failed' | 'partial';

/** A single gap detection result */
export interface RMGapResult {
  /** Brand code identifier */
  brandCode: string;
  /** Human-readable brand name */
  brandName: string;
  /** Period start date (ISO string, e.g. "2026-01-01") */
  periodStart: string;
  /** Period end date (ISO string, e.g. "2026-01-31") */
  periodEnd: string;
  /** Status of this period */
  status: RMGapStatus;
  /** Associated run ID if exists */
  runId?: string;
}

/** Query parameters for the gaps endpoint */
export interface RMGapQueryParams {
  /** Filter by brand code */
  brandCode?: string;
  /** Start date for the date range filter (ISO string) */
  startDate?: string;
  /** End date for the date range filter (ISO string) */
  endDate?: string;
}
