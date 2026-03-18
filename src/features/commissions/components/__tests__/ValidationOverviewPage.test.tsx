import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CollectionResponse, ValidationOverview } from '../../types';

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock validation overview hook
const mockUseValidationOverview = vi.fn();
vi.mock('../../api', () => ({
  useValidationOverview: (...args: unknown[]) => mockUseValidationOverview(...args),
}));

import { ValidationOverviewPage } from '../ValidationOverviewPage';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockOverview: ValidationOverview = {
  id: 'vo-1',
  batch_id: 'batch-1',
  brand_id: 'b-1',
  brand_name: 'Brand Alpha',
  matched: 45,
  mismatched: 3,
  missing: 2,
  skipped: 0,
  match_rate: '0.9000',
  validated_at: '2026-01-20T14:00:00Z',
  validated_by: 'admin',
};

const mockResponse: CollectionResponse<ValidationOverview> = {
  data: [mockOverview],
  meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
};

describe('ValidationOverviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    mockUseValidationOverview.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Cross-Validation')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    mockUseValidationOverview.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = render(<ValidationOverviewPage />, {
      wrapper: createWrapper(),
    });
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('shows error state with retry', async () => {
    const mockRefetch = vi.fn();
    mockUseValidationOverview.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed'),
      refetch: mockRefetch,
    });

    render(<ValidationOverviewPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByText('Try Again'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows empty state when no validation results', () => {
    mockUseValidationOverview.mockReturnValue({
      data: { data: [], meta: { page: 1, limit: 25, total: 0, totalPages: 0 } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('No Validation Results')).toBeInTheDocument();
  });

  it('renders validation overview table', () => {
    mockUseValidationOverview.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationOverviewPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Brand Alpha')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument(); // matched
    expect(screen.getByText('3')).toBeInTheDocument(); // mismatched
    expect(screen.getByText('2')).toBeInTheDocument(); // missing
  });

  it('shows match rate badge', () => {
    mockUseValidationOverview.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationOverviewPage />, { wrapper: createWrapper() });
    // 0.9000 * 100 = 90.00%
    expect(screen.getByText('90.00%')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    mockUseValidationOverview.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationOverviewPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Brand Name')).toBeInTheDocument();
    expect(screen.getByText('Last Validated')).toBeInTheDocument();
    expect(screen.getByText('Matched')).toBeInTheDocument();
    expect(screen.getByText('Mismatched')).toBeInTheDocument();
    expect(screen.getByText('Missing')).toBeInTheDocument();
    expect(screen.getByText('Match Rate')).toBeInTheDocument();
  });

  it('navigates to detail page on row click', async () => {
    mockUseValidationOverview.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationOverviewPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    const row = screen.getByText('Brand Alpha').closest('tr')!;
    await user.click(row);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/revenue/commissions/validation/$batchId',
      params: { batchId: 'batch-1' },
    });
  });

  it('shows result count', () => {
    mockUseValidationOverview.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('shows empty state when data is null', () => {
    mockUseValidationOverview.mockReturnValue({
      data: { data: null, meta: { page: 1, limit: 25, total: 0, totalPages: 0 } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('No Validation Results')).toBeInTheDocument();
  });

  it('shows pagination for multi-page results', () => {
    const multiPageResponse: CollectionResponse<ValidationOverview> = {
      data: [mockOverview],
      meta: { page: 1, limit: 25, total: 100, totalPages: 4 },
    };

    mockUseValidationOverview.mockReturnValue({
      data: multiPageResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Page 1 of 4', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Previous page')).toBeInTheDocument();
    expect(screen.getByText('Next page')).toBeInTheDocument();
  });

  it('navigates to next page when clicking next', async () => {
    const multiPageResponse: CollectionResponse<ValidationOverview> = {
      data: [mockOverview],
      meta: { page: 1, limit: 25, total: 100, totalPages: 4 },
    };

    mockUseValidationOverview.mockReturnValue({
      data: multiPageResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationOverviewPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    const nextBtn = screen.getByText('Next page').closest('button')!;
    await user.click(nextBtn);

    // The hook should be re-called with page 2
    const lastCall = mockUseValidationOverview.mock.calls[mockUseValidationOverview.mock.calls.length - 1];
    expect(lastCall[0]).toEqual(expect.objectContaining({ page: 2 }));
  });

  it('disables previous button on first page', () => {
    const multiPageResponse: CollectionResponse<ValidationOverview> = {
      data: [mockOverview],
      meta: { page: 1, limit: 25, total: 100, totalPages: 4 },
    };

    mockUseValidationOverview.mockReturnValue({
      data: multiPageResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationOverviewPage />, { wrapper: createWrapper() });

    const prevBtn = screen.getByText('Previous page').closest('button')!;
    expect(prevBtn).toBeDisabled();
  });

  it('pluralizes results count correctly for multiple results', () => {
    const multiResponse: CollectionResponse<ValidationOverview> = {
      data: [
        mockOverview,
        { ...mockOverview, id: 'vo-2', brand_name: 'Brand Beta', batch_id: 'batch-2' },
      ],
      meta: { page: 1, limit: 25, total: 2, totalPages: 1 },
    };

    mockUseValidationOverview.mockReturnValue({
      data: multiResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('2 results')).toBeInTheDocument();
  });

  it('renders skipped column', () => {
    mockUseValidationOverview.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Skipped')).toBeInTheDocument();
  });
});
