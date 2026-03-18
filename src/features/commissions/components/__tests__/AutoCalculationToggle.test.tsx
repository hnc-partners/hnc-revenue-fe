import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the brand commission config hooks
const mockUseBrandCommissionConfig = vi.fn();
const mockToggleMutate = vi.fn();
const mockUseToggleAutoCalculation = vi.fn();

vi.mock('../../api/useBrandCommissionConfig', () => ({
  useBrandCommissionConfig: (...args: unknown[]) =>
    mockUseBrandCommissionConfig(...args),
  useToggleAutoCalculation: (...args: unknown[]) =>
    mockUseToggleAutoCalculation(...args),
}));

// Mock toast
vi.mock('@hnc-partners/ui-components', async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    '@hnc-partners/ui-components'
  );
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

import { AutoCalculationToggle } from '../AutoCalculationToggle';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('AutoCalculationToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToggleAutoCalculation.mockReturnValue({
      mutate: mockToggleMutate,
      isPending: false,
    });
  });

  it('renders toggle with label when config is loaded', () => {
    mockUseBrandCommissionConfig.mockReturnValue({
      data: {
        brand_id: 'b-1',
        autoCalculateCommission: false,
        lastAutoCalculatedAt: null,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AutoCalculationToggle brandId="b-1" brandName="Test Brand" />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByText('Auto-Calculate Commissions')
    ).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('shows loading skeleton while config is loading', () => {
    mockUseBrandCommissionConfig.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = render(
      <AutoCalculationToggle brandId="b-1" />,
      { wrapper: createWrapper() }
    );

    // Skeleton elements should be present
    const skeletons = container.querySelectorAll('[class*="animate-pulse"], [data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state when config fetch fails', () => {
    mockUseBrandCommissionConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch: vi.fn(),
    });

    render(<AutoCalculationToggle brandId="b-1" />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByText('Failed to load auto-calculation config')
    ).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('shows retry button on error', async () => {
    const mockRefetch = vi.fn();
    mockUseBrandCommissionConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    render(<AutoCalculationToggle brandId="b-1" />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows last auto-calculated timestamp', () => {
    mockUseBrandCommissionConfig.mockReturnValue({
      data: {
        brand_id: 'b-1',
        autoCalculateCommission: true,
        lastAutoCalculatedAt: '2026-01-20T10:00:00Z',
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AutoCalculationToggle brandId="b-1" />, {
      wrapper: createWrapper(),
    });

    // Should show formatted timestamp, not "Never"
    expect(screen.queryByText('Never')).not.toBeInTheDocument();
  });

  it('shows "Never" when no auto-calculation has been done', () => {
    mockUseBrandCommissionConfig.mockReturnValue({
      data: {
        brand_id: 'b-1',
        autoCalculateCommission: false,
        lastAutoCalculatedAt: null,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AutoCalculationToggle brandId="b-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('toggles to disabled without confirmation', async () => {
    mockUseBrandCommissionConfig.mockReturnValue({
      data: {
        brand_id: 'b-1',
        autoCalculateCommission: true,
        lastAutoCalculatedAt: '2026-01-20T10:00:00Z',
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <AutoCalculationToggle brandId="b-1" brandName="Test Brand" />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    const toggle = screen.getByRole('switch');

    // Toggle is currently enabled, clicking should disable without confirmation
    await user.click(toggle);

    expect(mockToggleMutate).toHaveBeenCalledWith(
      { brandId: 'b-1', autoCalculateCommission: false },
      expect.any(Object)
    );
  });

  it('shows confirmation dialog when enabling auto-calculation', async () => {
    mockUseBrandCommissionConfig.mockReturnValue({
      data: {
        brand_id: 'b-1',
        autoCalculateCommission: false,
        lastAutoCalculatedAt: null,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <AutoCalculationToggle brandId="b-1" brandName="Test Brand" />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    // Should show confirmation dialog
    expect(
      screen.getByText(/Enable auto-calculation for Test Brand/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Commission results will be automatically calculated/)
    ).toBeInTheDocument();
  });

  it('enables auto-calculation after confirming', async () => {
    mockUseBrandCommissionConfig.mockReturnValue({
      data: {
        brand_id: 'b-1',
        autoCalculateCommission: false,
        lastAutoCalculatedAt: null,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <AutoCalculationToggle brandId="b-1" brandName="Test Brand" />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('switch'));

    // Confirm the dialog
    await user.click(screen.getByText('Enable'));

    expect(mockToggleMutate).toHaveBeenCalledWith(
      { brandId: 'b-1', autoCalculateCommission: true },
      expect.any(Object)
    );
  });

  it('shows spinner when toggle mutation is pending', () => {
    mockUseBrandCommissionConfig.mockReturnValue({
      data: {
        brand_id: 'b-1',
        autoCalculateCommission: false,
        lastAutoCalculatedAt: null,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseToggleAutoCalculation.mockReturnValue({
      mutate: mockToggleMutate,
      isPending: true,
    });

    render(<AutoCalculationToggle brandId="b-1" />, {
      wrapper: createWrapper(),
    });

    // Switch should be disabled when pending
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('uses brandId as display name when brandName is not provided', async () => {
    mockUseBrandCommissionConfig.mockReturnValue({
      data: {
        brand_id: 'b-42',
        autoCalculateCommission: false,
        lastAutoCalculatedAt: null,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AutoCalculationToggle brandId="b-42" />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('switch'));

    expect(
      screen.getByText(/Enable auto-calculation for b-42/i)
    ).toBeInTheDocument();
  });

  it('shows "Never" when lastAutoCalculatedAt is an invalid date', () => {
    mockUseBrandCommissionConfig.mockReturnValue({
      data: {
        brand_id: 'b-1',
        autoCalculateCommission: false,
        lastAutoCalculatedAt: 'invalid-date',
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AutoCalculationToggle brandId="b-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('shows generic error message when error is not an Error instance', () => {
    mockUseBrandCommissionConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: 'string error',
      refetch: vi.fn(),
    });

    render(<AutoCalculationToggle brandId="b-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Please try again.')).toBeInTheDocument();
  });

  it('shows toast on successful disable', async () => {
    const { toast } = await import('@hnc-partners/ui-components');

    mockUseBrandCommissionConfig.mockReturnValue({
      data: {
        brand_id: 'b-1',
        autoCalculateCommission: true,
        lastAutoCalculatedAt: null,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    // Make mutate call the onSuccess callback
    mockUseToggleAutoCalculation.mockReturnValue({
      mutate: (_args: unknown, options: { onSuccess?: () => void }) => {
        options.onSuccess?.();
      },
      isPending: false,
    });

    render(
      <AutoCalculationToggle brandId="b-1" brandName="Test Brand" />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('switch'));

    expect(toast.success).toHaveBeenCalledWith('Auto-calculation disabled');
  });

  it('shows toast error on failed disable', async () => {
    const { toast } = await import('@hnc-partners/ui-components');

    mockUseBrandCommissionConfig.mockReturnValue({
      data: {
        brand_id: 'b-1',
        autoCalculateCommission: true,
        lastAutoCalculatedAt: null,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockUseToggleAutoCalculation.mockReturnValue({
      mutate: (_args: unknown, options: { onError?: (e: Error) => void }) => {
        options.onError?.(new Error('Network failure'));
      },
      isPending: false,
    });

    render(
      <AutoCalculationToggle brandId="b-1" brandName="Test Brand" />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('switch'));

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Network failure')
    );
  });

  it('shows toast on successful enable after confirmation', async () => {
    const { toast } = await import('@hnc-partners/ui-components');

    mockUseBrandCommissionConfig.mockReturnValue({
      data: {
        brand_id: 'b-1',
        autoCalculateCommission: false,
        lastAutoCalculatedAt: null,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockUseToggleAutoCalculation.mockReturnValue({
      mutate: (_args: unknown, options: { onSuccess?: () => void }) => {
        options.onSuccess?.();
      },
      isPending: false,
    });

    render(
      <AutoCalculationToggle brandId="b-1" brandName="Test Brand" />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('switch'));
    await user.click(screen.getByText('Enable'));

    expect(toast.success).toHaveBeenCalledWith('Auto-calculation enabled');
  });

  it('shows toast error on failed enable after confirmation', async () => {
    const { toast } = await import('@hnc-partners/ui-components');

    mockUseBrandCommissionConfig.mockReturnValue({
      data: {
        brand_id: 'b-1',
        autoCalculateCommission: false,
        lastAutoCalculatedAt: null,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockUseToggleAutoCalculation.mockReturnValue({
      mutate: (_args: unknown, options: { onError?: (e: Error) => void }) => {
        options.onError?.(new Error('Server error'));
      },
      isPending: false,
    });

    render(
      <AutoCalculationToggle brandId="b-1" brandName="Test Brand" />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('switch'));
    await user.click(screen.getByText('Enable'));

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Server error')
    );
  });
});
