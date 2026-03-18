/**
 * hooks.test.tsx
 *
 * Tests for TanStack Query API hooks in the imports feature.
 * TE04 compliant: Mocks ONLY the apiFetch function (external fetch layer).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock the apiFetch function — external fetch layer
const mockApiFetch = vi.fn();
vi.mock('@/features/revenue/api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  ApiError: class ApiError extends Error {
    status: number;
    data: unknown;
    constructor(message: string, status: number, data?: unknown) {
      super(message);
      this.status = status;
      this.data = data;
    }
  },
}));

// Mock auth-context for useUploadFile
vi.mock('@hnc-partners/auth-context', () => ({
  getAuthItem: vi.fn().mockReturnValue('test-token'),
}));

vi.mock('@/features/revenue/api/config', () => ({
  REVENUE_API_URL: 'http://test-api',
}));

// Import hooks AFTER mocks
import { useImportBatches } from '../useImportBatches';
import { useImportBatch } from '../useImportBatch';
import { useBrandConfigs } from '../useBrandConfigs';
import { useCreateBatch } from '../useCreateBatch';
import { useUploadFile } from '../useUploadFile';
import { useProcessBatch } from '../useProcessBatch';
import { usePurgeBatch } from '../usePurgeBatch';
import { useRollbackBatch } from '../useRollbackBatch';
import { useBatchLogs } from '../useBatchLogs';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

// ---------------------------------------------------------------------------
// useImportBatches
// ---------------------------------------------------------------------------

describe('useImportBatches', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches batches with default filters', async () => {
    const response = {
      data: [{ id: 'b-1', brandName: 'Test', status: 'pending' }],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };
    mockApiFetch.mockResolvedValueOnce(response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useImportBatches({ page: 1, limit: 50 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining('http://test-api/batches')
    );
  });

  it('builds query string from filters', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useImportBatches({
          brandId: 'brand-uuid',
          status: ['pending', 'processing'],
          periodStart: '2026-01-01',
          periodEnd: '2026-01-31',
          page: 2,
          limit: 25,
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('brandId=brand-uuid');
    expect(calledUrl).toContain('status=pending');
    expect(calledUrl).toContain('status=processing');
    expect(calledUrl).toContain('periodStart=2026-01-01');
    expect(calledUrl).toContain('periodEnd=2026-01-31');
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('limit=25');
  });

  it('sets isLoading while fetching', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {})); // never resolves
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useImportBatches({ page: 1 }),
      { wrapper }
    );
    expect(result.current.isLoading).toBe(true);
  });

  it('returns error on fetch failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useImportBatches({ page: 1 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});

// ---------------------------------------------------------------------------
// useImportBatch
// ---------------------------------------------------------------------------

describe('useImportBatch', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches a single batch by ID', async () => {
    const response = {
      data: { id: 'batch-1', brandName: 'Test', status: 'processed', files: [] },
    };
    mockApiFetch.mockResolvedValueOnce(response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useImportBatch('batch-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(mockApiFetch).toHaveBeenCalledWith('http://test-api/batches/batch-1');
  });

  it('does not fetch when batchId is empty', () => {
    mockApiFetch.mockResolvedValue({ data: null });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useImportBatch(''), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('returns error on fetch failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Not found'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useImportBatch('bad-id'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not found');
  });
});

// ---------------------------------------------------------------------------
// useBrandConfigs
// ---------------------------------------------------------------------------

describe('useBrandConfigs', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches brand configs and unwraps data', async () => {
    const brands = [
      { brandId: 'b-1', brandName: 'Brand A' },
      { brandId: 'b-2', brandName: 'Brand B' },
    ];
    mockApiFetch.mockResolvedValueOnce({ data: brands });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBrandConfigs(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(brands);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/batches/coverage/config'
    );
  });

  it('returns error on failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Server error'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBrandConfigs(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// useCreateBatch
// ---------------------------------------------------------------------------

describe('useCreateBatch', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('calls POST endpoint with batch payload', async () => {
    const batch = { id: 'new-1', brandId: 'brand-1', status: 'pending' };
    mockApiFetch.mockResolvedValueOnce({ data: batch });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateBatch(), { wrapper });

    const payload = {
      brandId: 'brand-1',
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
      periodGranularity: 'monthly' as const,
    };

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(batch);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/batches',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  });

  it('returns error on mutation failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Conflict'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateBatch(), { wrapper });

    result.current.mutate({
      brandId: 'brand-1',
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
      periodGranularity: 'monthly',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Conflict');
  });
});

// ---------------------------------------------------------------------------
// useUploadFile
// ---------------------------------------------------------------------------

describe('useUploadFile', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockApiFetch.mockReset();
    mockFetch.mockReset();
    globalThis.fetch = mockFetch;
  });

  it('uploads a file via POST with FormData', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            id: 'file-1',
            batchId: 'batch-1',
            fileType: 'commission',
            originalFilename: 'test.csv',
            fileSizeBytes: '1024',
            hash: 'abc',
            status: 'uploaded',
            createdAt: '2026-01-01T00:00:00Z',
          },
        }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUploadFile(), { wrapper });

    const file = new File(['csv,data'], 'test.csv', { type: 'text/csv' });
    result.current.mutate({ batchId: 'batch-1', file, fileType: 'commission' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('file-1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/batches/batch-1/files'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws on failed upload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'Bad format' }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUploadFile(), { wrapper });

    const file = new File(['bad'], 'test.csv', { type: 'text/csv' });
    result.current.mutate({ batchId: 'batch-1', file, fileType: 'commission' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Bad format');
  });
});

// ---------------------------------------------------------------------------
// useProcessBatch
// ---------------------------------------------------------------------------

describe('useProcessBatch', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('calls POST process endpoint', async () => {
    const processingResult = {
      batchId: 'batch-1',
      status: 'processed',
      revenueRecordsCreated: 100,
      amountRecordsCreated: 200,
      totalPlayersCorrelated: 50,
    };
    mockApiFetch.mockResolvedValueOnce({ data: processingResult });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useProcessBatch(), { wrapper });

    result.current.mutate('batch-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(processingResult);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/batches/batch-1/process',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('returns error on processing failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Processing error'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useProcessBatch(), { wrapper });

    result.current.mutate('batch-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// usePurgeBatch
// ---------------------------------------------------------------------------

describe('usePurgeBatch', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('calls DELETE purge endpoint', async () => {
    mockApiFetch.mockResolvedValueOnce(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePurgeBatch(), { wrapper });

    result.current.mutate('batch-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/batches/batch-1/purge',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('returns error on purge failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Purge failed'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePurgeBatch(), { wrapper });

    result.current.mutate('batch-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// useRollbackBatch
// ---------------------------------------------------------------------------

describe('useRollbackBatch', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('calls DELETE endpoint for rollback', async () => {
    const rollbackResult = { message: 'Rolled back', revenueRecordsDeleted: 50 };
    mockApiFetch.mockResolvedValueOnce(rollbackResult);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRollbackBatch(), { wrapper });

    result.current.mutate('batch-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(rollbackResult);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/batches/batch-1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('returns error on rollback failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Rollback failed'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRollbackBatch(), { wrapper });

    result.current.mutate('batch-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// useBatchLogs
// ---------------------------------------------------------------------------

describe('useBatchLogs', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches paginated logs', async () => {
    const response = {
      data: [{ id: 'log-1', logLevel: 'info', message: 'Test' }],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
    };
    mockApiFetch.mockResolvedValueOnce(response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBatchLogs('batch-1', { page: 1, limit: 25 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining('http://test-api/batches/batch-1/logs')
    );
  });

  it('builds query string with logLevel filter', async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBatchLogs('batch-1', { page: 1, limit: 25, logLevel: 'error' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('logLevel=error');
  });

  it('does not fetch when batchId is empty', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBatchLogs('', { page: 1 }),
      { wrapper }
    );
    expect(result.current.isLoading).toBe(false);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('returns error on fetch failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Server error'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBatchLogs('batch-1', { page: 1 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('builds query string without logLevel when not provided', async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBatchLogs('batch-1', { page: 1, limit: 25 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('page=1');
    expect(calledUrl).toContain('limit=25');
    expect(calledUrl).not.toContain('logLevel');
  });

  it('builds empty query string when no params provided', async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBatchLogs('batch-1', {}),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    // With no page/limit/logLevel, no query string
    expect(calledUrl).toBe('http://test-api/batches/batch-1/logs');
  });
});

// ---------------------------------------------------------------------------
// useUploadFile — additional edge cases
// ---------------------------------------------------------------------------

describe('useUploadFile — edge cases', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockApiFetch.mockReset();
    mockFetch.mockReset();
    globalThis.fetch = mockFetch;
  });

  it('throws ApiError with detail field from response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'Duplicate file hash' }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUploadFile(), { wrapper });

    const file = new File(['csv,data'], 'dup.csv', { type: 'text/csv' });
    result.current.mutate({ batchId: 'batch-1', file, fileType: 'commission' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Duplicate file hash');
  });

  it('falls back to HTTP status message when response.json fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUploadFile(), { wrapper });

    const file = new File(['bad'], 'test.csv', { type: 'text/csv' });
    result.current.mutate({ batchId: 'batch-1', file, fileType: 'commission' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('HTTP 500');
  });
});
