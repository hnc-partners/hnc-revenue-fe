/**
 * Commission Types (F21)
 *
 * Types for commission calculation results.
 * Matches the API response shape from hncms-revenue service.
 */

// ---------------------------------------------------------------------------
// Enums / Unions
// ---------------------------------------------------------------------------

/** Direction of commission flow */
export type CommissionDirection = 'incoming' | 'outgoing';

/** Deal type categories */
export type CommissionDealType =
  | 'master_agent'
  | 'player'
  | 'sub_agent'
  | 'referrer';

/** Result status */
export type CommissionResultStatus = 'active' | 'superseded';

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

/**
 * CommissionResult — matches API response shape from GET /commissions/results
 */
export interface CommissionResult {
  id: string;
  gaming_account_id: string;
  gaming_account_name: string;
  contact_id: string;
  contact_name: string;
  share_type: string;
  share_category_code: string;
  share_category_name: string;
  direction: CommissionDirection;
  deal_type: CommissionDealType;
  share_pct_applied: string;
  revenue_amount: string;
  commission_amount: string;
  currency: string;
  period_start: string;
  period_end: string;
  status: CommissionResultStatus;
  batch_id: string;
  deal_name: string;
  superseded_by_id: string | null;
  recalculation_id: string | null;
}

/**
 * Extended result with audit trail for single-result detail view.
 */
export interface CommissionResultDetail extends CommissionResult {
  /** Supersession chain — results that came before or after */
  supersession_chain?: SupersessionEntry[];
  created_at?: string;
  updated_at?: string;
}

/** Entry in the supersession chain */
export interface SupersessionEntry {
  id: string;
  status: CommissionResultStatus;
  commission_amount: string;
  created_at: string;
  superseded_by_id: string | null;
}

// ---------------------------------------------------------------------------
// Filter Types
// ---------------------------------------------------------------------------

/**
 * Filter params for the results endpoint.
 * Matches query parameters accepted by GET /commissions/results.
 */
export interface CommissionResultFilters {
  batch_id?: string;
  contact_id?: string;
  gaming_account_id?: string;
  direction?: CommissionDirection;
  share_type?: string;
  share_category_code?: string;
  deal_type?: CommissionDealType;
  period_start?: string;
  period_end?: string;
  status?: CommissionResultStatus;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
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

/** Standard collection response wrapper */
export interface CollectionResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

/** Standard single-item response wrapper */
export interface SingleResponse<T> {
  data: T;
}

// ---------------------------------------------------------------------------
// Summary Types (FES-02)
// ---------------------------------------------------------------------------

/** Summary dimension options for the dimension picker */
export type SummaryDimension =
  | 'contact'
  | 'ga'
  | 'brand'
  | 'category'
  | 'deal_type';

/**
 * CommissionSummary — from GET /commissions/summaries (By Contact dimension)
 * Also used for client-side grouping: By Category, By Deal Type
 */
export interface CommissionSummary {
  id: string;
  contact_id: string;
  contact_name: string;
  brand_id: string;
  brand_name: string;
  share_category_code: string;
  deal_type: CommissionDealType;
  period_start: string;
  period_end: string;
  currency: string;
  total_incoming: string;
  total_outgoing: string;
  net_commission: string;
  batch_id: string;
}

/**
 * CommissionSummaryByGA — from GET /commissions/summaries/by-ga
 */
export interface CommissionSummaryByGA {
  id: string;
  gaming_account_id: string;
  gaming_account_name: string;
  brand_id: string;
  brand_name: string;
  share_category_code: string;
  deal_type: CommissionDealType;
  period_start: string;
  period_end: string;
  currency: string;
  total_incoming: string;
  total_outgoing: string;
  net_commission: string;
  batch_id: string;
}

/**
 * CommissionSummaryByBrand — from GET /commissions/summaries/by-brand
 */
export interface CommissionSummaryByBrand {
  id: string;
  brand_id: string;
  brand_name: string;
  share_category_code: string;
  deal_type: CommissionDealType;
  period_start: string;
  period_end: string;
  currency: string;
  total_incoming: string;
  total_outgoing: string;
  net_commission: string;
  batch_id: string;
}

/**
 * Filter params for summary endpoints.
 */
export interface SummaryFilters {
  contact_id?: string;
  gaming_account_id?: string;
  brand_id?: string;
  period_start?: string;
  period_end?: string;
  currency?: string;
  page?: number;
  limit?: number;
}

/**
 * Client-side grouped summary row for Category and Deal Type dimensions.
 */
export interface GroupedSummaryRow {
  key: string;
  label: string;
  currency: string;
  period_start: string;
  period_end: string;
  total_incoming: number;
  total_outgoing: number;
  net_commission: number;
}

// ---------------------------------------------------------------------------
// Validation Types (FES-04)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Recalculation Types (FES-05)
// ---------------------------------------------------------------------------

/** Request body for recalculation trigger */
export interface RecalculationRequest {
  batch_id: string;
}

/** Response from POST /commissions/recalculate */
export interface RecalculationResult {
  batch_id: string;
  previous_total: string; // decimal string
  new_total: string; // decimal string
  changed_count: number;
  unchanged_count: number;
  recalculated_at: string;
}

// ---------------------------------------------------------------------------
// Brand Commission Config Types (FES-06)
// ---------------------------------------------------------------------------

/**
 * Brand commission auto-calculation configuration.
 * From GET /brand-reporting-config/:brandId on REVENUE_API_URL.
 */
export interface BrandCommissionConfig {
  brand_id: string;
  autoCalculateCommission: boolean;
  lastAutoCalculatedAt: string | null;
}

// ---------------------------------------------------------------------------
// Validation Types (FES-04)
// ---------------------------------------------------------------------------

/** Status of a validation comparison row */
export type ValidationStatus = 'matched' | 'mismatched' | 'missing' | 'skipped';

/**
 * ValidationOverview — from GET /commissions/validation/overview
 * One row per brand showing latest validation results.
 */
export interface ValidationOverview {
  id: string;
  batch_id: string;
  brand_id: string;
  brand_name: string;
  matched: number;
  mismatched: number;
  missing: number;
  skipped: number;
  match_rate: string;
  validated_at: string;
  validated_by: string;
}

/**
 * ValidationDetail — from GET /commissions/validate/:batchId
 * Per-gaming-account discrepancy row in a validation batch.
 */
export interface ValidationDetail {
  id: string;
  gaming_account_id: string;
  gaming_account_name: string;
  calculated_amount: string;
  reported_amount: string;
  difference: string;
  pct_difference: string;
  status: ValidationStatus;
}

/**
 * Filter params for the validation overview endpoint.
 */
export interface ValidationOverviewFilters {
  page?: number;
  limit?: number;
}

/**
 * Response envelope for validation detail (validate endpoint).
 */
export interface ValidationDetailResponse {
  data: ValidationDetail[];
  meta: PaginatedMeta;
  summary: {
    matched: number;
    mismatched: number;
    missing: number;
    skipped: number;
    match_rate: string;
  };
}
