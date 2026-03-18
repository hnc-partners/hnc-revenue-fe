/**
 * Coverage Types (FES-05)
 *
 * Types for coverage matrix and brand configuration.
 * Matches the API response shapes from hncms-revenue service.
 */

// ---------------------------------------------------------------------------
// Coverage Matrix Types
// ---------------------------------------------------------------------------

/** Status of a coverage period */
export type CoverageStatus = 'processed' | 'pending' | 'failed' | 'missing';

/** Granularity of reporting period */
export type CoverageGranularity = 'daily' | 'weekly' | 'monthly';

/** A single period cell in the coverage matrix */
export interface CoveragePeriod {
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  status: CoverageStatus;
  batchId: string | null;
}

/** A brand row in the coverage matrix */
export interface CoverageBrandRow {
  brandId: string;
  brandName: string;
  granularity: CoverageGranularity;
  periods: CoveragePeriod[];
}

/** Query params for GET /batches/coverage */
export interface CoverageQueryParams {
  periodStartGte: string; // YYYY-MM-DD
  periodStartLte: string; // YYYY-MM-DD
}

/** Response from GET /batches/coverage */
export interface CoverageResponse {
  data: CoverageBrandRow[];
}

// ---------------------------------------------------------------------------
// Brand Config Types (for upsert)
// ---------------------------------------------------------------------------

/** File types for brand config */
export type ExpectedFileType =
  | 'commission'
  | 'poker_ggr'
  | 'casino_ggr'
  | 'poker_analysis'
  | 'single';

/** Payload for POST /batches/coverage/config (upsert) */
export interface UpsertBrandConfigPayload {
  brandId: string;
  brandCode: string;
  periodGranularity: CoverageGranularity;
  expectedFileTypes: ExpectedFileType[];
  active: boolean;
}

/** Full brand config from GET /batches/coverage/config */
export interface BrandConfigFull {
  brandId: string;
  brandName: string;
  brandCode?: string;
  periodGranularity?: CoverageGranularity;
  expectedFileTypes?: string[];
  active?: boolean;
  autoCalculateCommission?: boolean;
}

/** Response from POST /batches/coverage/config */
export interface UpsertBrandConfigResponse {
  data: BrandConfigFull;
}
