/**
 * Statement Management Types (F54)
 *
 * Types for the brand dashboard and service status features.
 * Defined locally until shared-types package includes report-management types.
 */

/** Acquisition mode for a brand's statement data */
export type AcquisitionMode =
  | 'automated_download'
  | 'manual_download'
  | 'manual_input';

/** Statement granularity */
export type StatementGranularity = 'daily' | 'weekly' | 'monthly';

/** Health status computed by the API */
export type BrandHealth = 'healthy' | 'warning' | 'critical' | 'unknown';

/** Run status for a brand's last acquisition run */
export type RunStatus =
  | 'running'
  | 'success'
  | 'partial'
  | 'failed'
  | 'skipped'
  | 'rolled_back';

/** Share type descriptor returned by the API */
export interface ShareType {
  code: string;
  name: string;
}

/** Last run information for a brand */
export interface BrandLastRun {
  id: string;
  status: RunStatus;
  startedAt: string;
  completedAt: string | null;
  periodStart: string;
  periodEnd: string;
}

/**
 * Brand configuration with status summary from the API.
 * Represents a single brand's statement acquisition config and latest status.
 */
export interface RMBrandConfigWithStatus {
  /** Primary key */
  id: string;
  /** Foreign key to brand service */
  brandId: string;
  /** Unique brand code identifier */
  brandCode: string;
  /** Human-readable brand name */
  brandName: string;
  /** How statements are acquired */
  acquisitionMode: AcquisitionMode;
  /** Cron expression for scheduling */
  scheduleCron: string;
  /** How frequently statements are expected */
  granularity: StatementGranularity;
  /** Period type (null when not applicable) */
  periodType: string | null;
  /** Required file types for this brand */
  requiredFileTypes: string[];
  /** Optional file types for this brand */
  optionalFileTypes: string[];
  /** Share types (e.g. GGR, Commission) */
  shareTypes: ShareType[];
  /** Currency code for this brand's statements */
  currencyCode: string;
  /** Portal URL for manual access */
  portalUrl: string | null;
  /** Environment variable key for credentials */
  credentialsEnv: string | null;
  /** Maximum months for backfill */
  maxBackfillMonths: number;
  /** Whether this brand's acquisition is enabled */
  enabled: boolean;
  /** Whether this brand's acquisition is paused */
  paused: boolean;
  /** Whether to auto-notify on failures */
  autoNotify: boolean;
  /** Created timestamp */
  createdAt: string;
  /** Updated timestamp */
  updatedAt: string;
  /** Created by user */
  createdBy: string | null;
  /** Updated by user */
  updatedBy: string | null;
  /** Last run information (null if never run) */
  lastRun: BrandLastRun | null;
  /** Next expected statement date (ISO string or null) */
  nextExpected: string | null;
  /** Overall health status computed by the API */
  health: BrandHealth;
}

/** Scheduled brand info within service status */
export interface ScheduledBrand {
  brandCode: string;
  cronExpression: string;
}

/** Scheduler state within service status */
export interface SchedulerState {
  running: boolean;
  scheduledBrands: number;
  queueLength: number;
  isProcessing: boolean;
  pendingRetries: number;
  nextRun: string | null;
  brands: ScheduledBrand[];
}

/**
 * Global service state — whether scheduling is paused system-wide.
 */
export interface RMServiceState {
  globalPaused: boolean;
  pausedAt: string | null;
  pausedBy: string | null;
  updatedAt: string;
  activeRuns: number;
  scheduler: SchedulerState;
  nextScheduledRun: string | null;
}

/**
 * Standard collection response wrapper (matches backend pattern).
 */
export interface CollectionResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

/**
 * Standard single-item response wrapper.
 */
export interface SingleResponse<T> {
  data: T;
}

/**
 * Pagination metadata from the API.
 */
export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Recent run entry within brand config with activity.
 */
export interface RecentRun {
  id: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  sourceType: string;
  createdAt: string;
}

/**
 * Brand configuration with recent activity (from GET /brands/:code).
 */
export interface RMBrandConfigWithActivity {
  id: string;
  brandId: string;
  brandCode: string;
  brandName: string;
  acquisitionMode: AcquisitionMode;
  granularity: StatementGranularity;
  scheduleCron: string | null;
  requiredFileTypes: string[];
  optionalFileTypes: string[];
  shareTypes: ShareType[];
  currencyCode: string;
  portalUrl: string | null;
  credentialsEnv: string | null;
  maxBackfillMonths: number;
  enabled: boolean;
  paused: boolean;
  autoNotify: boolean;
  createdAt: string;
  updatedAt: string;
  recentRuns: RecentRun[];
}

/**
 * DTO for creating a new brand configuration.
 * POST /brands
 */
export interface RMCreateBrandConfigDto {
  brandId: string;
  brandCode: string;
  brandName: string;
  acquisitionMode: AcquisitionMode;
  granularity: StatementGranularity;
  scheduleCron?: string | null;
  requiredFileTypes?: string[];
  optionalFileTypes?: string[];
  shareTypes?: ShareType[];
  currencyCode?: string;
  portalUrl?: string | null;
  credentialsEnv?: string | null;
  maxBackfillMonths?: number;
  enabled?: boolean;
  paused?: boolean;
  autoNotify?: boolean;
}

/**
 * DTO for updating an existing brand configuration.
 * PATCH /brands/:code — brandCode is immutable.
 */
export interface RMUpdateBrandConfigDto {
  brandName?: string;
  acquisitionMode?: AcquisitionMode;
  granularity?: StatementGranularity;
  scheduleCron?: string | null;
  requiredFileTypes?: string[];
  optionalFileTypes?: string[];
  shareTypes?: ShareType[];
  currencyCode?: string;
  portalUrl?: string | null;
  credentialsEnv?: string | null;
  maxBackfillMonths?: number;
  enabled?: boolean;
  paused?: boolean;
  autoNotify?: boolean;
}
