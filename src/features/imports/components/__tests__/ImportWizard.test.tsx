/**
 * ImportWizard.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks and router (external services).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ImportWizard } from '../ImportWizard';

// Mock router — external navigation service
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock API hooks — external fetch layer
const mockUseBrandConfigs = vi.fn().mockReturnValue({
  data: [
    { brandId: 'b-1', brandName: 'Brand A', periodGranularity: 'monthly', expectedFileTypes: ['commission'] },
  ],
  isLoading: false,
  error: null,
});
const mockUseCreateBatch = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
const mockUseUploadFile = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
const mockUseProcessBatch = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });

vi.mock('../../api', () => ({
  useBrandConfigs: () => mockUseBrandConfigs(),
  useCreateBatch: () => mockUseCreateBatch(),
  useUploadFile: () => mockUseUploadFile(),
  useProcessBatch: () => mockUseProcessBatch(),
}));

// Mock ApiError for CreateBatchStep
vi.mock('@/features/revenue/api', () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('ImportWizard', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockUseBrandConfigs.mockReturnValue({
      data: [
        { brandId: 'b-1', brandName: 'Brand A', periodGranularity: 'monthly', expectedFileTypes: ['commission'] },
      ],
      isLoading: false,
      error: null,
    });
    mockUseCreateBatch.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
    mockUseUploadFile.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseProcessBatch.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
  });

  it('renders "New Import" header', () => {
    renderWithQuery(<ImportWizard />);
    expect(screen.getByText('New Import')).toBeInTheDocument();
  });

  it('renders step indicator with 3 steps', () => {
    renderWithQuery(<ImportWizard />);
    const nav = screen.getByLabelText('Wizard progress');
    expect(nav).toBeInTheDocument();
    // Step indicator labels are in the nav, step content heading duplicates "Create Batch"
    // so we scope within the nav element
    const steps = nav.querySelectorAll('li');
    expect(steps).toHaveLength(3);
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
    expect(screen.getByText('Process')).toBeInTheDocument();
  });

  it('shows step 1 as current initially', () => {
    renderWithQuery(<ImportWizard />);
    const step1 = screen.getByText('1');
    expect(step1.closest('[aria-current="step"]')).toBeInTheDocument();
  });

  it('renders CreateBatchStep content in step 1', () => {
    renderWithQuery(<ImportWizard />);
    // CreateBatchStep renders brand selector form
    expect(screen.getByText('Brand')).toBeInTheDocument();
    expect(screen.getByText('Period Start')).toBeInTheDocument();
    expect(screen.getByText('Period End')).toBeInTheDocument();
  });

  it('navigates to imports on cancel', async () => {
    renderWithQuery(<ImportWizard />);

    const user = userEvent.setup();
    await user.click(screen.getByText('Cancel'));
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/revenue/imports' })
    );
  });

  it('renders step content heading for step 1', () => {
    renderWithQuery(<ImportWizard />);
    // Step 1 title appears as heading inside the content card
    // "Create Batch" appears both in step indicator and as content heading
    const headings = screen.getAllByText('Create Batch');
    expect(headings.length).toBeGreaterThanOrEqual(2);
  });

  it('renders connector lines between steps', () => {
    const { container } = renderWithQuery(<ImportWizard />);
    // The nav should have connector lines (divs between steps)
    const nav = screen.getByLabelText('Wizard progress');
    const items = nav.querySelectorAll('li');
    expect(items).toHaveLength(3);
    // Each step except the last should have a connector line
    expect(container.querySelectorAll('[class*="h-px"]').length).toBeGreaterThanOrEqual(2);
  });

  it('shows step 3 label in step indicator', () => {
    renderWithQuery(<ImportWizard />);
    expect(screen.getByText('Process')).toBeInTheDocument();
  });

  it('renders brands loading state from CreateBatchStep', () => {
    mockUseBrandConfigs.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { container } = renderWithQuery(<ImportWizard />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
