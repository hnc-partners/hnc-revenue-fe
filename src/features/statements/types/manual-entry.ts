/**
 * Manual Entry Types (F54 — FE-3)
 *
 * Types for the manual statement entry feature.
 * Brands with acquisitionMode = 'manual_input' use this flow.
 */

import type { ShareType } from './index';

// ---------------------------------------------------------------------------
// Entry Form Data (from GET /brands/:code/entry-form)
// ---------------------------------------------------------------------------

/** Gaming account within the entry form */
export interface RMEntryFormGamingAccount {
  id: string;
  externalAccountId: string;
  accountName: string;
}

/**
 * Dynamic form structure returned by the API.
 * Defines what share types, currency, and gaming accounts to show.
 */
export interface RMEntryFormData {
  brandCode: string;
  brandName: string;
  shareTypes: ShareType[];
  currencyCode: string;
  gamingAccounts: RMEntryFormGamingAccount[];
}

// ---------------------------------------------------------------------------
// Manual Entry Batch
// ---------------------------------------------------------------------------

/** Batch status lifecycle: draft → submitted → processed/failed */
export type RMBatchStatus = 'draft' | 'submitted' | 'processed' | 'failed';

/** A single line within a manual entry batch */
export interface RMManualEntryLine {
  id: string;
  batchId: string;
  gamingAccountId: string;
  externalAccountId: string;
  shareTypeCode: string;
  metricAmount: number;
  currencyCode: string;
  createdAt: string;
  updatedAt: string;
}

/** A manual entry batch record */
export interface RMManualEntryBatch {
  id: string;
  brandConfigId: string;
  brandCode: string;
  brandName: string;
  periodStart: string;
  periodEnd: string;
  status: RMBatchStatus;
  lineCount: number;
  submittedAt: string | null;
  submittedBy: string | null;
  processedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  lines?: RMManualEntryLine[];
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

/** Create a new draft batch */
export interface RMCreateManualEntryBatchDto {
  brandCode: string;
  periodStart: string;
  periodEnd: string;
}

/** A single line to add to a batch */
export interface RMManualEntryLineDto {
  gamingAccountId: string;
  externalAccountId: string;
  shareTypeCode: string;
  metricAmount: number;
  currencyCode: string;
}

/** Submit a batch for processing */
export interface RMSubmitManualEntryDto {
  batchId: string;
  lines: RMManualEntryLineDto[];
}

/** Response from POST /manual-entries/submit */
export interface RMSubmitManualEntryResponse {
  batch: RMManualEntryBatch;
  run: {
    id: string;
    status: string;
  };
}
