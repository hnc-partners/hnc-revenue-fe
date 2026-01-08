import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  AuthContextValue,
  AuthState,
  LoginCredentials,
  User,
} from '@/types/auth';

// Storage keys
const STORAGE_KEY_USER = 'hnc_user';
const STORAGE_KEY_TOKEN = 'hnc_access_token';
const STORAGE_KEY_REFRESH = 'hnc_refresh_token';

// Create the context
export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider
 *
 * Provides authentication state and methods to the application.
 *
 * STUB IMPLEMENTATION:
 * This is a stub that stores auth state in localStorage.
 * It will be replaced with real API calls in the integration phase.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY_USER);
        const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);

        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser) as User;
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear potentially corrupted storage
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_REFRESH);
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initAuth();
  }, []);

  /**
   * Login with username and password
   *
   * STUB: Accepts any credentials and creates a mock user.
   * Replace with real API call to POST /api/auth/login
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // STUB: Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // STUB: Validate credentials (accept any non-empty username/password)
      if (!credentials.username || !credentials.password) {
        throw new Error('Username and password are required');
      }

      // STUB: For demo, reject "invalid" as password
      if (credentials.password === 'invalid') {
        throw new Error('Invalid username or password');
      }

      // STUB: Create mock user and tokens
      const user: User = {
        id: crypto.randomUUID(),
        username: credentials.username,
        email: `${credentials.username}@example.com`,
        role: 'admin',
        permissions: ['labels:read', 'labels:write', 'labels:delete'],
      };

      const accessToken = `stub_access_${Date.now()}`;
      const refreshToken = `stub_refresh_${Date.now()}`;

      // Store in localStorage
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEY_REFRESH, refreshToken);

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  }, []);

  /**
   * Logout the current user
   *
   * STUB: Clears localStorage.
   * Replace with real API call to POST /api/auth/logout
   */
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // STUB: Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Clear storage
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_REFRESH);

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state on error
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_REFRESH);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  /**
   * Refresh authentication tokens
   *
   * STUB: No-op in stub implementation.
   * Replace with real API call to POST /api/auth/refresh
   */
  const refreshAuth = useCallback(async () => {
    // STUB: In real implementation, call refresh token endpoint
    // and update stored tokens
    console.log('Auth refresh called (stub - no-op)');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      refreshAuth,
    }),
    [state, login, logout, refreshAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
