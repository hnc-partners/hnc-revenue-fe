/**
 * Revenue Data Types (FES-04)
 *
 * Types for the Revenue Browser — player revenue records with amounts.
 * Matches API response shape from hncms-revenue service.
 */

// ---------------------------------------------------------------------------
// Share Type Labels
// ---------------------------------------------------------------------------

/** Known share type codes and their human-friendly labels */
export const SHARE_TYPE_LABELS: Record<string, string> = {
  POKER_CNGR: 'Poker CNGR',
  CASINO_NGR: 'Casino NGR',
  CIP_GGR: 'CIP GGR',
  POKER_NGR: 'Poker NGR',
};

/** Get a human-friendly label for a share type code */
export function getShareTypeLabel(code: string): string {
  return SHARE_TYPE_LABELS[code] || code;
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

/** A single revenue amount entry linked to a share type */
export interface PlayerRevenueAmount {
  id: string;
  revenueId: string;
  shareTypeId: string;
  shareTypeCode: string;
  amount: string; // Decimal from API comes as string
}

/** A player revenue record from GET /revenue */
export interface PlayerRevenue {
  id: string;
  batchId: string;
  gamingAccountId: string;
  brandId: string;
  brandName: string;
  brandPlayerId: string;
  nickname: string;
  agentCode: string | null;
  periodStart: string;
  periodEnd: string;
  commission: string | null; // Decimal from API comes as string
  extras: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  amounts: PlayerRevenueAmount[];
}

// ---------------------------------------------------------------------------
// Filter / Query Params
// ---------------------------------------------------------------------------

/** Query params for GET /revenue */
export interface RevenueQueryParams {
  page?: number;
  limit?: number;
  brandId?: string;
  batchId?: string;
  gamingAccountId?: string;
  periodStartGte?: string;
  periodStartLte?: string;
}

/** Query params for GET /revenue/by-player/:gamingAccountId */
export interface ByPlayerQueryParams {
  page?: number;
  limit?: number;
  periodStartGte?: string;
  periodStartLte?: string;
}

// ---------------------------------------------------------------------------
// Response Envelopes
// ---------------------------------------------------------------------------

/** Pagination metadata from the API */
export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Standard paginated collection response */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

/** Single record response */
export interface SingleResponse<T> {
  data: T;
}
