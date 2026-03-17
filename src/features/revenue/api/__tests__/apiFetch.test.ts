/**
 * apiFetch.test.ts
 *
 * Tests for the apiFetch utility function.
 * TE04 compliant: Mocks ONLY fetch (browser API) and auth-context (external service).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, ApiError } from '../apiFetch';

// Mock auth-context — external service
const mockGetAuthItem = vi.fn();
vi.mock('@hnc-partners/auth-context', () => ({
  getAuthItem: (...args: unknown[]) => mockGetAuthItem(...args),
}));

// Mock global fetch — browser API
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('apiFetch', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockGetAuthItem.mockReturnValue('test-token-123');
  });

  it('makes a GET request with auth header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    });

    const result = await apiFetch<{ data: string }>('http://api.test/endpoint');

    expect(result).toEqual({ data: 'test' });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://api.test/endpoint');
    const headers = options.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test-token-123');
    expect(headers.get('Accept')).toBe('application/json');
  });

  it('sets Content-Type for requests with body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'created' }),
    });

    await apiFetch('http://api.test/endpoint', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
    });

    const [, options] = mockFetch.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('handles 204 No Content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await apiFetch('http://api.test/endpoint', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });

  it('throws ApiError on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not found' }),
    });

    await expect(apiFetch('http://api.test/endpoint')).rejects.toThrow(ApiError);

    try {
      await apiFetch('http://api.test/endpoint');
    } catch (err) {
      // This won't actually run since the test above already verified the throw.
      // But we check the type for thoroughness in a separate test below.
    }
  });

  it('includes status and message in ApiError', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'Already exists' }),
    });

    try {
      await apiFetch('http://api.test/endpoint');
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(409);
      expect(apiErr.message).toBe('Already exists');
    }
  });

  it('handles non-JSON error response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    try {
      await apiFetch('http://api.test/endpoint');
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(500);
      expect(apiErr.message).toBe('HTTP 500');
    }
  });
});
