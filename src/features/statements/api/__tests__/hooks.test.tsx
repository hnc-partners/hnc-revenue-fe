/**
 * hooks.test.tsx
 *
 * Tests for TanStack Query API hooks.
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
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

// Mock auth-context for useUploadCSV
vi.mock('@hnc-partners/auth-context', () => ({
  getAuthItem: vi.fn().mockReturnValue('test-token'),
}));

vi.mock('@/features/revenue/api/config', () => ({
  REPORT_MANAGEMENT_API_URL: 'http://test-api',
}));

// Import hooks AFTER mocks
import { useStatementBrands } from '../useStatementBrands';
import { useBrandConfig, useCreateBrand, useUpdateBrand, useEnableBrand, useDisableBrand } from '../useBrandConfig';
import { useBrandRuns, useTriggerDownload, useRetryRun, useRetryNotify, useUploadCSV } from '../useBrandRuns';
import { useGaps } from '../useGaps';
import { useServiceStatus, usePauseService, useResumeService } from '../useServiceStatus';
import { useEntryForm, useManualInputBrands, useManualEntryBatches, useSubmitManualEntry } from '../useManualEntry';

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

describe('useStatementBrands', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches brands and returns data array', async () => {
    const brands = [{ brandCode: 'a', brandName: 'A' }];
    mockApiFetch.mockResolvedValueOnce({ data: brands });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useStatementBrands(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(brands);
    expect(mockApiFetch).toHaveBeenCalledWith('http://test-api/brands');
  });

  it('sets isLoading while fetching', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {})); // never resolves
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useStatementBrands(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns error on fetch failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useStatementBrands(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});

describe('useBrandConfig', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches single brand config', async () => {
    const brand = { brandCode: 'test', brandName: 'Test' };
    mockApiFetch.mockResolvedValueOnce({ data: brand });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBrandConfig('test'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(brand);
    expect(mockApiFetch).toHaveBeenCalledWith('http://test-api/brands/test');
  });

  it('does not fetch when brandCode is empty', () => {
    mockApiFetch.mockResolvedValue({ data: null });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBrandConfig(''), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});

describe('useCreateBrand', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('calls POST endpoint with brand data', async () => {
    const response = { data: { brandCode: 'new-brand' } };
    mockApiFetch.mockResolvedValueOnce(response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateBrand(), { wrapper });

    const createDto = {
      brandId: 'uuid',
      brandCode: 'new-brand',
      brandName: 'New Brand',
      acquisitionMode: 'manual_download' as const,
      granularity: 'monthly' as const,
      enabled: true,
      autoNotify: false,
      maxBackfillMonths: 3,
    };

    result.current.mutate(createDto);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/brands',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(createDto),
      })
    );
  });
});

describe('useUpdateBrand', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('calls PATCH endpoint with update data', async () => {
    const response = { data: { brandCode: 'test', brandName: 'Updated' } };
    mockApiFetch.mockResolvedValueOnce(response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateBrand('test'), { wrapper });

    const updateDto = { brandName: 'Updated' };
    result.current.mutate(updateDto);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/brands/test',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(updateDto),
      })
    );
  });
});

describe('useBrandRuns', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches paginated runs', async () => {
    const response = {
      data: [{ id: 'run-1', status: 'success' }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    mockApiFetch.mockResolvedValueOnce(response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBrandRuns('test', 1), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining('http://test-api/brands/test/runs')
    );
  });

  it('does not fetch when brandCode is empty', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBrandRuns(''), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});

describe('useUploadCSV', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockApiFetch.mockReset();
    mockFetch.mockReset();
    globalThis.fetch = mockFetch;
  });

  it('uploads a file via POST with FormData', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'run-1' } }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUploadCSV('test-brand'), { wrapper });

    const file = new File(['csv,data'], 'test.csv', { type: 'text/csv' });
    result.current.mutate(file);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/brands/test-brand/upload'),
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
    const { result } = renderHook(() => useUploadCSV('test-brand'), { wrapper });

    const file = new File(['bad'], 'test.csv', { type: 'text/csv' });
    result.current.mutate(file);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Bad format');
  });
});

describe('useGaps', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches gap results with query params', async () => {
    const gaps = [{ brandCode: 'a', status: 'missing' }];
    mockApiFetch.mockResolvedValueOnce({ data: gaps });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useGaps({ startDate: '2026-01-01', endDate: '2026-03-31' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(gaps);
    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining('startDate=2026-01-01')
    );
  });

  it('fetches without params when none provided', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: [] });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useGaps(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith('http://test-api/gaps');
  });
});

describe('useServiceStatus', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches service status', async () => {
    const status = { globalPaused: false, activeRuns: 2 };
    mockApiFetch.mockResolvedValueOnce({ data: status });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useServiceStatus(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(status);
    expect(mockApiFetch).toHaveBeenCalledWith('http://test-api/service/status');
  });
});

describe('useEntryForm', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches entry form data for a brand', async () => {
    const formData = { brandCode: 'test', shareTypes: [], gamingAccounts: [], currencyCode: 'EUR' };
    mockApiFetch.mockResolvedValueOnce({ data: formData });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useEntryForm('test'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(formData);
  });

  it('does not fetch when brandCode is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useEntryForm(undefined), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});

describe('useManualInputBrands', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('filters to only manual_input brands', async () => {
    const allBrands = [
      { brandCode: 'auto', acquisitionMode: 'automated_download' },
      { brandCode: 'manual', acquisitionMode: 'manual_input' },
    ];
    mockApiFetch.mockResolvedValueOnce({ data: allBrands });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useManualInputBrands(), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual([{ brandCode: 'manual', acquisitionMode: 'manual_input' }]);
  });
});

describe('useManualEntryBatches', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches batches for a brand', async () => {
    const batches = [{ id: 'b-1', status: 'draft' }];
    mockApiFetch.mockResolvedValueOnce({ data: batches });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useManualEntryBatches('test'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(batches);
  });

  it('fetches all batches when no brand specified', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: [] });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useManualEntryBatches(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining('http://test-api/manual-entries')
    );
  });
});

describe('useEnableBrand', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('calls POST enable endpoint', async () => {
    mockApiFetch.mockResolvedValueOnce(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useEnableBrand('test'), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/brands/test/enable',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('useDisableBrand', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('calls POST disable endpoint', async () => {
    mockApiFetch.mockResolvedValueOnce(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDisableBrand('test'), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/brands/test/disable',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('useTriggerDownload', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('calls POST trigger endpoint', async () => {
    mockApiFetch.mockResolvedValueOnce(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTriggerDownload('test'), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/brands/test/trigger',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('useRetryRun', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('calls POST retry endpoint with run ID', async () => {
    mockApiFetch.mockResolvedValueOnce(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRetryRun('test'), { wrapper });

    result.current.mutate('run-123');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/runs/run-123/retry',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('useRetryNotify', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('calls POST retry-notify endpoint with run ID', async () => {
    mockApiFetch.mockResolvedValueOnce(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRetryNotify('test'), { wrapper });

    result.current.mutate('run-456');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/runs/run-456/retry-notify',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('usePauseService', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('calls POST pause endpoint', async () => {
    mockApiFetch.mockResolvedValueOnce(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePauseService(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/service/pause',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('useResumeService', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('calls POST resume endpoint', async () => {
    mockApiFetch.mockResolvedValueOnce(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useResumeService(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/service/resume',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('useSubmitManualEntry', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('calls POST submit endpoint with entry data', async () => {
    const response = { batch: { id: 'b-1' }, run: { id: 'r-1', status: 'success' } };
    mockApiFetch.mockResolvedValueOnce({ data: response });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSubmitManualEntry(), { wrapper });

    const dto = {
      batchId: 'test:2026-01-01:2026-01-31',
      lines: [
        { gamingAccountId: 'ga-1', externalAccountId: 'ext-1', shareTypeCode: 'GGR', metricAmount: 100, currencyCode: 'EUR' },
      ],
    };

    result.current.mutate(dto);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/manual-entries/submit',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(dto),
      })
    );
  });
});
