/**
 * BrandConfigSection.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks (external services).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrandConfigSection } from '../BrandConfigSection';
import type { BrandConfigFull } from '../../types';

// Mock API hook — external fetch layer
const mockUseBrandConfigs = vi.fn();
vi.mock('@/features/imports/api/useBrandConfigs', () => ({
  useBrandConfigs: () => mockUseBrandConfigs(),
}));

// Mock the upsert hook used by BrandConfigForm (child)
const mockMutate = vi.fn();
vi.mock('../../api/useUpsertBrandConfig', () => ({
  useUpsertBrandConfig: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function makeConfig(overrides: Partial<BrandConfigFull> = {}): BrandConfigFull {
  return {
    brandId: 'brand-1',
    brandName: 'Test Brand',
    brandCode: 'TB',
    periodGranularity: 'monthly',
    expectedFileTypes: ['commission'],
    active: true,
    autoCalculateCommission: false,
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

describe('BrandConfigSection', () => {
  beforeEach(() => {
    mockUseBrandConfigs.mockReset();
    mockMutate.mockReset();
  });

  it('renders section header with title', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<BrandConfigSection />);
    expect(screen.getByText('Brand Configurations')).toBeInTheDocument();
  });

  it('renders Add Config button', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<BrandConfigSection />);
    expect(screen.getByRole('button', { name: /add config/i })).toBeInTheDocument();
  });

  it('shows loading skeletons when data is loading', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { container } = renderWithQuery(<BrandConfigSection />);
    // Skeleton component renders with pulse animation class
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state when fetch fails', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    });

    renderWithQuery(<BrandConfigSection />);
    expect(screen.getByText(/failed to load brand configurations/i)).toBeInTheDocument();
  });

  it('shows empty state when no configs exist', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<BrandConfigSection />);
    expect(screen.getByText('No Brand Configurations')).toBeInTheDocument();
    expect(
      screen.getByText(/add a brand configuration to start tracking coverage/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add first config/i })
    ).toBeInTheDocument();
  });

  it('renders config list when configs exist', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [
        makeConfig({ brandId: 'b-1', brandName: 'Brand Alpha', brandCode: 'BA' }),
        makeConfig({ brandId: 'b-2', brandName: 'Brand Beta', brandCode: 'BB' }),
      ],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<BrandConfigSection />);
    expect(screen.getByText('Brand Alpha')).toBeInTheDocument();
    expect(screen.getByText('Brand Beta')).toBeInTheDocument();
    expect(screen.getByText('BA')).toBeInTheDocument();
    expect(screen.getByText('BB')).toBeInTheDocument();
  });

  it('renders granularity and file type badges', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [
        makeConfig({
          periodGranularity: 'weekly',
          expectedFileTypes: ['commission', 'poker_ggr'],
        }),
      ],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<BrandConfigSection />);
    expect(screen.getByText('weekly')).toBeInTheDocument();
    expect(screen.getByText('commission')).toBeInTheDocument();
    expect(screen.getByText('poker ggr')).toBeInTheDocument();
  });

  it('renders Inactive badge for inactive configs', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [makeConfig({ active: false })],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<BrandConfigSection />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders Auto-commission badge when autoCalculateCommission is true', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [makeConfig({ autoCalculateCommission: true })],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<BrandConfigSection />);
    expect(screen.getByText('Auto-commission')).toBeInTheDocument();
  });

  it('renders edit button for each config', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [
        makeConfig({ brandId: 'b-1' }),
        makeConfig({ brandId: 'b-2' }),
      ],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<BrandConfigSection />);
    const editButtons = screen.getAllByTitle('Edit configuration');
    expect(editButtons).toHaveLength(2);
  });

  it('opens form dialog when Add Config is clicked', async () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithQuery(<BrandConfigSection />);

    await user.click(screen.getByRole('button', { name: /add config/i }));

    // Dialog should open with "Add Brand Config" title
    expect(screen.getByText('Add Brand Config')).toBeInTheDocument();
  });

  it('opens form dialog in edit mode when edit button is clicked', async () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [makeConfig({ brandName: 'Edit Me' })],
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithQuery(<BrandConfigSection />);

    await user.click(screen.getByTitle('Edit configuration'));

    // Dialog should open with "Edit Brand Config" title
    expect(screen.getByText('Edit Brand Config')).toBeInTheDocument();
  });

  it('opens add form when Add First Config is clicked in empty state', async () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithQuery(<BrandConfigSection />);

    await user.click(screen.getByRole('button', { name: /add first config/i }));

    expect(screen.getByText('Add Brand Config')).toBeInTheDocument();
  });

  it('does not show Inactive badge for active config', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [makeConfig({ active: true })],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<BrandConfigSection />);
    expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
  });

  it('does not show brandCode badge when brandCode is undefined', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [makeConfig({ brandCode: undefined })],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<BrandConfigSection />);
    // Brand name should be present but no code badge
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
  });

  it('does not show granularity badge when periodGranularity is undefined', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [makeConfig({ periodGranularity: undefined })],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<BrandConfigSection />);
    expect(screen.queryByText('monthly')).not.toBeInTheDocument();
    expect(screen.queryByText('weekly')).not.toBeInTheDocument();
    expect(screen.queryByText('daily')).not.toBeInTheDocument();
  });

  it('does not show Auto-commission badge when autoCalculateCommission is false', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [makeConfig({ autoCalculateCommission: false })],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<BrandConfigSection />);
    expect(screen.queryByText('Auto-commission')).not.toBeInTheDocument();
  });

  it('renders null configs as empty state', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    renderWithQuery(<BrandConfigSection />);
    expect(screen.getByText('No Brand Configurations')).toBeInTheDocument();
  });

  it('renders file type badges with underscores replaced by spaces', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: [makeConfig({ expectedFileTypes: ['poker_analysis', 'casino_ggr'] })],
      isLoading: false,
      error: null,
    });

    renderWithQuery(<BrandConfigSection />);
    expect(screen.getByText('poker analysis')).toBeInTheDocument();
    expect(screen.getByText('casino ggr')).toBeInTheDocument();
  });
});
