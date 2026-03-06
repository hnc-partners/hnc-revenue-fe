/**
 * apiFetch.ts
 *
 * Shared fetch wrapper with JWT Bearer token authentication.
 * Uses @hnc-partners/auth-context for token retrieval.
 */

import { getAuthItem } from '@hnc-partners/auth-context';

/**
 * API Error class for typed error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base fetch wrapper with authentication
 *
 * @param url - Full URL to fetch
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws ApiError on non-ok responses
 *
 * @example
 * ```ts
 * const data = await apiFetch<MyType>(`${REVENUE_API_URL}/endpoint`);
 * ```
 */
export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  // Add JWT Bearer token for authentication
  const token = getAuthItem('access_token', 'hnc_');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set Accept header if not present
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Set Content-Type for requests with body
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 204 No Content (for DELETE)
  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      data.detail || data.message || `HTTP ${response.status}`,
      response.status,
      data
    );
  }

  return response.json();
}
