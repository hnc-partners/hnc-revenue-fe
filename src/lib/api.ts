/**
 * API Client Configuration
 *
 * STUB: Basic fetch wrapper for API calls.
 * This will be replaced with @hnc-partners/api-client integration
 * once the auth service is ready.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const AUTH_URL = import.meta.env.VITE_AUTH_URL || `${API_URL}/auth`;

// Storage keys (same as AuthContext)
const STORAGE_KEY_TOKEN = 'hnc_access_token';

/**
 * Get the current access token from storage
 */
function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

/**
 * API Error class for handling HTTP errors
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
 */
async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      data.message || `HTTP ${response.status}`,
      response.status,
      data
    );
  }

  return response;
}

/**
 * API client methods
 *
 * STUB: These are placeholder implementations.
 * Replace with real API client integration.
 */
export const api = {
  /**
   * Base URL for API calls
   */
  baseUrl: API_URL,
  authUrl: AUTH_URL,

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetchWithAuth(`${API_URL}${endpoint}`);
    return response.json();
  },

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetchWithAuth(`${API_URL}${endpoint}`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  },

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetchWithAuth(`${API_URL}${endpoint}`, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  },

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetchWithAuth(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetchWithAuth(`${API_URL}${endpoint}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  /**
   * Auth-specific endpoints (for future integration)
   */
  auth: {
    async login(username: string, password: string) {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new ApiError(
          data.message || 'Login failed',
          response.status,
          data
        );
      }
      return response.json();
    },

    async logout() {
      const response = await fetchWithAuth(`${AUTH_URL}/logout`, {
        method: 'POST',
      });
      return response.json();
    },

    async refresh(refreshToken: string) {
      const response = await fetch(`${AUTH_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new ApiError(
          data.message || 'Token refresh failed',
          response.status,
          data
        );
      }
      return response.json();
    },

    async me() {
      return api.get('/auth/me');
    },
  },
};
