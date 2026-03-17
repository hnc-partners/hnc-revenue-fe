/**
 * exports.test.ts
 *
 * Verify barrel exports are properly re-exported.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock the apiFetch layer to prevent actual API calls
vi.mock('@/features/revenue/api', () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/features/revenue/api/config', () => ({
  REPORT_MANAGEMENT_API_URL: 'http://test',
}));

describe('statements/api barrel exports', () => {
  it('re-exports all expected hooks and keys', async () => {
    const mod = await import('../index');

    // Query hooks
    expect(mod.useStatementBrands).toBeDefined();
    expect(mod.useBrandConfig).toBeDefined();
    expect(mod.useCreateBrand).toBeDefined();
    expect(mod.useUpdateBrand).toBeDefined();
    expect(mod.useEnableBrand).toBeDefined();
    expect(mod.useDisableBrand).toBeDefined();
    expect(mod.useBrandRuns).toBeDefined();
    expect(mod.useTriggerDownload).toBeDefined();
    expect(mod.useUploadCSV).toBeDefined();
    expect(mod.useRetryRun).toBeDefined();
    expect(mod.useRetryNotify).toBeDefined();
    expect(mod.useServiceStatus).toBeDefined();
    expect(mod.usePauseService).toBeDefined();
    expect(mod.useResumeService).toBeDefined();
    expect(mod.useEntryForm).toBeDefined();
    expect(mod.useManualInputBrands).toBeDefined();
    expect(mod.useManualEntryBatches).toBeDefined();
    expect(mod.useCreateBatch).toBeDefined();
    expect(mod.useSubmitManualEntry).toBeDefined();
    expect(mod.useGaps).toBeDefined();

    // Query keys
    expect(mod.statementBrandsQueryKey).toBeDefined();
    expect(mod.serviceStatusQueryKey).toBeDefined();
    expect(mod.brandConfigQueryKey).toBeDefined();
    expect(mod.brandRunsQueryKey).toBeDefined();
    expect(mod.entryFormQueryKey).toBeDefined();
    expect(mod.manualEntryBatchesQueryKey).toBeDefined();
    expect(mod.gapsQueryKey).toBeDefined();
  });
});

describe('revenue/api barrel exports', () => {
  it('re-exports apiFetch and ApiError', async () => {
    const mod = await import('@/features/revenue/api');
    expect(mod.apiFetch).toBeDefined();
    expect(mod.ApiError).toBeDefined();
  });
});
