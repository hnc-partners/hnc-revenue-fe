/**
 * BrandDashboard.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks and router (external services).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrandDashboard } from '../BrandDashboard';
import type { RMBrandConfigWithStatus } from '../../types';

// Mock router — external navigation service
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={props.to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

// Mock API hooks — external fetch layer
const mockRefetch = vi.fn();
const mockUseStatementBrands = vi.fn();
const mockUseServiceStatus = vi.fn().mockReturnValue({ data: null, isLoading: true });
const mockUsePauseService = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
const mockUseResumeService = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
const mockUseBrandConfig = vi.fn().mockReturnValue({ data: null, isLoading: false });
const mockUseCreateBrand = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
const mockUseUpdateBrand = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });

vi.mock('../../api', () => ({
  useStatementBrands: () => mockUseStatementBrands(),
  useServiceStatus: () => mockUseServiceStatus(),
  usePauseService: () => mockUsePauseService(),
  useResumeService: () => mockUseResumeService(),
  useBrandConfig: () => mockUseBrandConfig(),
  useCreateBrand: () => mockUseCreateBrand(),
  useUpdateBrand: () => mockUseUpdateBrand(),
}));

function makeBrand(overrides: Partial<RMBrandConfigWithStatus> = {}): RMBrandConfigWithStatus {
  return {
    id: 'brand-1',
    brandId: 'b-uuid',
    brandCode: 'test-brand',
    brandName: 'Test Brand',
    acquisitionMode: 'automated_download',
    scheduleCron: '0 6 * * *',
    granularity: 'monthly',
    periodType: null,
    requiredFileTypes: [],
    optionalFileTypes: [],
    shareTypes: [],
    currencyCode: 'EUR',
    portalUrl: null,
    credentialsEnv: null,
    maxBackfillMonths: 3,
    enabled: true,
    paused: false,
    autoNotify: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    createdBy: null,
    updatedBy: null,
    lastRun: null,
    nextExpected: null,
    health: 'healthy',
    ...overrides,
  };
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('BrandDashboard', () => {
  beforeEach(() => {
    mockRefetch.mockReset();
    mockUseStatementBrands.mockReset();
    // Re-set defaults that mockReset clears
    mockUseServiceStatus.mockReturnValue({ data: null, isLoading: true });
    mockUsePauseService.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseResumeService.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseBrandConfig.mockReturnValue({ data: null, isLoading: false, error: null, refetch: vi.fn() });
    mockUseCreateBrand.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseUpdateBrand.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it('renders loading skeleton when data is loading', () => {
    mockUseStatementBrands.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    const { container } = renderWithQuery(<BrandDashboard />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('renders error state with retry button', async () => {
    mockUseStatementBrands.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDashboard />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/could not load brand data/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no brands exist', () => {
    mockUseStatementBrands.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDashboard />);
    expect(screen.getByText('No Brands Configured')).toBeInTheDocument();
  });

  it('renders brand cards when data is available', () => {
    mockUseStatementBrands.mockReturnValue({
      data: [
        makeBrand({ brandCode: 'brand-a', brandName: 'Brand A' }),
        makeBrand({ brandCode: 'brand-b', brandName: 'Brand B' }),
      ],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDashboard />);
    expect(screen.getByText('Brand A')).toBeInTheDocument();
    expect(screen.getByText('Brand B')).toBeInTheDocument();
  });

  it('renders header with "Statements" title and action buttons', () => {
    mockUseStatementBrands.mockReturnValue({
      data: [makeBrand()],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDashboard />);
    expect(screen.getByText('Statements')).toBeInTheDocument();
    expect(screen.getByText('View Gaps')).toBeInTheDocument();
    expect(screen.getByText('New Brand')).toBeInTheDocument();
  });

  it('opens create dialog when New Brand is clicked', async () => {
    mockUseStatementBrands.mockReturnValue({
      data: [makeBrand()],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BrandDashboard />);

    await user.click(screen.getByText('New Brand'));
    // Dialog should open with "New Brand" title
    expect(screen.getByText('New Brand', { selector: '[role="dialog"] *' })).toBeInTheDocument();
  });
});
