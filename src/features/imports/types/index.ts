/**
 * Import Batch Types (F30)
 *
 * Types for revenue import batches.
 * Matches the API response shape from hncms-revenue service.
 */

// ---------------------------------------------------------------------------
// Enums / Unions
// ---------------------------------------------------------------------------

/** Status of an import batch */
export type ImportBatchStatus =
  | 'pending'
  | 'validating'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'rolled_back';

/** Granularity of import data */
export type ImportGranularity = 'daily' | 'weekly' | 'monthly';

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

/**
 * ImportBatch — matches API response shape from GET /batches
 */
export interface ImportBatch {
  id: string;
  brandId: string;
  brandName: string;
  periodStart: string;
  periodEnd: string;
  granularity: ImportGranularity;
  status: ImportBatchStatus;
  fileCount: number;
  rowCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Filter Types
// ---------------------------------------------------------------------------

/**
 * Filter/query params for GET /batches.
 */
export interface ImportBatchFilters {
  brandId?: string;
  status?: ImportBatchStatus[];
  periodStart?: string;
  periodEnd?: string;
  page?: number;
  limit?: number;
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

// ---------------------------------------------------------------------------
// Brand Config Types (for filters)
// ---------------------------------------------------------------------------

/**
 * Brand from the coverage config endpoint.
 * Used for the brand filter dropdown.
 */
export interface BrandConfig {
  brandId: string;
  brandName: string;
  periodGranularity?: ImportGranularity;
  expectedFileTypes?: string[];
}

// ---------------------------------------------------------------------------
// Wizard Types (FES-02)
// ---------------------------------------------------------------------------

/** Payload for POST /batches — creates a new import batch */
export interface CreateBatchPayload {
  brandId: string;
  periodStart: string;
  periodEnd: string;
  periodGranularity: ImportGranularity;
}

/** Response from POST /batches */
export interface CreateBatchResponse {
  data: ImportBatch;
}

/** File upload metadata returned after upload */
export interface BatchFile {
  id: string;
  batchId: string;
  fileType: string;
  originalFilename: string;
  fileSizeBytes: string; // BigInt from API comes as string
  hash: string;
  status: string;
  createdAt: string;
}

/** Response from POST /batches/:id/files */
export interface UploadFileResponse {
  data: BatchFile;
}

/** Correlation summary entry */
export interface CorrelationSummary {
  fileType: string;
  matched: number;
  unmatched: number;
}

/** Result from processing a batch */
export interface ProcessingResult {
  batchId: string;
  status: 'processed' | 'failed';
  revenueRecordsCreated?: number;
  amountRecordsCreated?: number;
  totalPlayersCorrelated?: number;
  correlationSummary?: CorrelationSummary[];
  issues?: ProcessingIssue[];
}

/** Validation/processing issue */
export interface ProcessingIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  brandPlayerId?: string;
}

/** Response from POST /batches/:id/process */
export interface ProcessBatchResponse {
  data: ProcessingResult;
}

// ---------------------------------------------------------------------------
// Batch Detail Types (FES-03)
// ---------------------------------------------------------------------------

/**
 * ImportBatchDetail — matches API response shape from GET /batches/:id.
 * Extends ImportBatch with nested files[], processing timestamps, etc.
 */
export interface ImportBatchDetail {
  id: string;
  brandId: string;
  brandName: string;
  periodStart: string;
  periodEnd: string;
  granularity: ImportGranularity;
  status: ImportBatchStatus;
  fileCount: number;
  rowCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  validationErrors: ProcessingIssue[] | null;
  files: BatchFile[];
}

/** Response from GET /batches/:id */
export interface ImportBatchDetailResponse {
  data: ImportBatchDetail;
}

// ---------------------------------------------------------------------------
// Audit Log Types (FES-03)
// ---------------------------------------------------------------------------

/** Log level for import audit log entries */
export type LogLevel = 'info' | 'warn' | 'error';

/** Import log entry from GET /batches/:id/logs */
export interface ImportLog {
  id: string;
  batchId: string;
  fileId: string | null;
  logLevel: LogLevel;
  message: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

/** Query params for GET /batches/:id/logs */
export interface LogQueryParams {
  page?: number;
  limit?: number;
  logLevel?: LogLevel;
}

/** Response from GET /batches/:id/logs */
export interface LogsResponse {
  data: ImportLog[];
  meta: PaginatedMeta;
}

// ---------------------------------------------------------------------------
// Rollback Types (FES-03)
// ---------------------------------------------------------------------------

/** Result from DELETE /batches/:id (rollback) */
export interface RollbackResult {
  message: string;
  revenueRecordsDeleted?: number;
}
