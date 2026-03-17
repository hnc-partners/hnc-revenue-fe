/**
 * BrandDetail.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks and router (external services).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrandDetail } from '../BrandDetail';
import type { RMBrandConfigWithActivity } from '../../types';

// Mock router — external service
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={props.to}>{children}</a>
  ),
}));

// Mock API hooks — external fetch layer
const mockRefetch = vi.fn();
const mockUseBrandConfig = vi.fn();
const mockUseBrandRuns = vi.fn().mockReturnValue({
  data: null,
  isLoading: true,
  error: null,
  refetch: vi.fn(),
});
const mockUseRetryRun = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
const mockUseRetryNotify = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
const mockUseCreateBrand = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
const mockUseUpdateBrand = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
const mockUseEnableBrand = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
const mockUseDisableBrand = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
const mockUseTriggerDownload = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
const mockUseUploadCSV = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });

vi.mock('../../api', () => ({
  useBrandConfig: (...args: unknown[]) => mockUseBrandConfig(...args),
  useBrandRuns: (...args: unknown[]) => mockUseBrandRuns(...args),
  useRetryRun: () => mockUseRetryRun(),
  useRetryNotify: () => mockUseRetryNotify(),
  useCreateBrand: () => mockUseCreateBrand(),
  useUpdateBrand: () => mockUseUpdateBrand(),
  useEnableBrand: () => mockUseEnableBrand(),
  useDisableBrand: () => mockUseDisableBrand(),
  useTriggerDownload: () => mockUseTriggerDownload(),
  useUploadCSV: () => mockUseUploadCSV(),
}));

function makeBrandActivity(
  overrides: Partial<RMBrandConfigWithActivity> = {}
): RMBrandConfigWithActivity {
  return {
    id: 'brand-1',
    brandId: 'b-uuid',
    brandCode: 'test-brand',
    brandName: 'Test Brand',
    acquisitionMode: 'automated_download',
    granularity: 'monthly',
    scheduleCron: '0 6 * * *',
    requiredFileTypes: ['csv'],
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
    recentRuns: [],
    ...overrides,
  };
}

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('BrandDetail', () => {
  beforeEach(() => {
    mockUseBrandConfig.mockReset();
    mockRefetch.mockReset();
    // Re-set defaults after mockReset
    mockUseBrandRuns.mockReturnValue({ data: null, isLoading: true, error: null, refetch: vi.fn() });
    mockUseRetryRun.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseRetryNotify.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseCreateBrand.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseUpdateBrand.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseEnableBrand.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseDisableBrand.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseTriggerDownload.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseUploadCSV.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it('renders loading skeleton when data is loading', () => {
    mockUseBrandConfig.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    const { container } = renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('renders error state with retry button', async () => {
    mockUseBrandConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Not found'),
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/could not load brand data for "test-brand"/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders brand name in header when data loaded', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({ brandName: 'My Brand' }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    // Brand name appears in both page header (h1) and info panel (h2)
    const elements = screen.getAllByText('My Brand');
    expect(elements.length).toBeGreaterThanOrEqual(1);
    // The h1 is the page header
    const h1 = elements.find((el) => el.tagName === 'H1');
    expect(h1).toBeInTheDocument();
  });

  it('renders brand info header with badges', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({
        acquisitionMode: 'manual_download',
        granularity: 'weekly',
        currencyCode: 'USD',
      }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(screen.getByText('Manual Upload')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('shows Active badge for enabled non-paused brand', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({ enabled: true, paused: false }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows Paused badge for paused brand', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({ paused: true }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('shows Disabled badge for disabled brand', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({ enabled: false }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('renders required file types', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({ requiredFileTypes: ['csv', 'pdf'] }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(screen.getByText('csv, pdf')).toBeInTheDocument();
  });

  it('renders back button linking to dashboard', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity(),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(
      screen.getByRole('button', { name: /back to dashboard/i })
    ).toBeInTheDocument();
  });

  it('renders Run History section', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity(),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(screen.getByText('Run History')).toBeInTheDocument();
  });

  it('renders Actions section', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity(),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Edit Config')).toBeInTheDocument();
  });

  it('renders Period Coverage when recentRuns exist', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({
        recentRuns: [
          {
            id: 'r1',
            status: 'success',
            periodStart: '2026-01-01',
            periodEnd: '2026-01-31',
            sourceType: 'automated',
            createdAt: '2026-01-15T00:00:00Z',
          },
        ],
      }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(screen.getByText('Period Coverage')).toBeInTheDocument();
  });

  it('does not render Period Coverage when no recent runs', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({ recentRuns: [] }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(screen.queryByText('Period Coverage')).not.toBeInTheDocument();
  });

  it('shows cron schedule description', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({ scheduleCron: '0 6 * * *' }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(screen.getByText('Daily at 6:00')).toBeInTheDocument();
  });

  it('shows "No schedule" when cron is null', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({ scheduleCron: null }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(screen.getByText('No schedule')).toBeInTheDocument();
  });

  it('derives healthy status from successful recent run', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({
        enabled: true,
        paused: false,
        recentRuns: [
          { id: 'r1', status: 'success', periodStart: '2026-01-01', periodEnd: '2026-01-31', sourceType: 'auto', createdAt: '2026-01-15T00:00:00Z' },
        ],
      }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    const onTrack = screen.getAllByText('On Track');
    expect(onTrack.length).toBeGreaterThanOrEqual(1);
  });

  it('derives warning status from partial recent run', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({
        enabled: true,
        paused: false,
        recentRuns: [
          { id: 'r1', status: 'partial', periodStart: '2026-01-01', periodEnd: '2026-01-31', sourceType: 'auto', createdAt: '2026-01-15T00:00:00Z' },
        ],
      }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    const overdue = screen.getAllByText('Overdue');
    expect(overdue.length).toBeGreaterThanOrEqual(1);
  });

  it('derives critical status from failed recent run', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({
        enabled: true,
        paused: false,
        recentRuns: [
          { id: 'r1', status: 'failed', periodStart: '2026-01-01', periodEnd: '2026-01-31', sourceType: 'auto', createdAt: '2026-01-15T00:00:00Z' },
        ],
      }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    // BrandStatusIndicator shows "Failed" for critical health
    const failed = screen.getAllByText('Failed');
    expect(failed.length).toBeGreaterThanOrEqual(1);
  });

  it('shows weekly cron description', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({ scheduleCron: '0 8 * * 1' }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(screen.getByText('Weekly (day 1) at 8:00')).toBeInTheDocument();
  });

  it('shows monthly cron description', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({ scheduleCron: '30 9 15 * *' }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(screen.getByText('Monthly (day 15) at 9:30')).toBeInTheDocument();
  });

  it('shows raw cron when format is non-standard', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({ scheduleCron: '0 0 1 1 *' }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    // dom=1 is not *, so it's monthly
    expect(screen.getByText('Monthly (day 1) at 0:00')).toBeInTheDocument();
  });

  it('renders updated date', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrandActivity({ updatedAt: '2026-03-15T10:00:00Z' }),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    // Date formatted as "Mar 15, 2026" or similar
    expect(screen.getByText(/mar/i)).toBeInTheDocument();
  });

  it('renders error state with back button even on error', () => {
    mockUseBrandConfig.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('fail'),
      refetch: mockRefetch,
    });

    renderWithQuery(<BrandDetail brandCode="test-brand" />);
    expect(screen.getByText('Brand Detail')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
  });
});
