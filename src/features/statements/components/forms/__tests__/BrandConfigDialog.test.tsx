/**
 * BrandConfigDialog.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks (external fetch layer).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrandConfigDialog } from '../BrandConfigDialog';
import type { RMBrandConfigWithActivity } from '../../../types';

// Mock API hooks
const mockUseBrandConfig = vi.fn();
const mockUseCreateBrand = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
const mockUseUpdateBrand = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });

vi.mock('../../../api', () => ({
  useBrandConfig: (...args: unknown[]) => mockUseBrandConfig(...args),
  useCreateBrand: () => mockUseCreateBrand(),
  useUpdateBrand: () => mockUseUpdateBrand(),
}));

function makeBrand(
  overrides: Partial<RMBrandConfigWithActivity> = {}
): RMBrandConfigWithActivity {
  return {
    id: '1',
    brandId: 'b-uuid',
    brandCode: 'test-brand',
    brandName: 'Test Brand',
    acquisitionMode: 'manual_download',
    granularity: 'monthly',
    scheduleCron: null,
    requiredFileTypes: [],
    optionalFileTypes: [],
    shareTypes: [],
    currencyCode: 'EUR',
    portalUrl: null,
    credentialsEnv: null,
    maxBackfillMonths: 3,
    enabled: true,
    paused: false,
    autoNotify: false,
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

describe('BrandConfigDialog', () => {
  beforeEach(() => {
    mockUseBrandConfig.mockReset();
    mockUseCreateBrand.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseUpdateBrand.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it('renders "New Brand" title in create mode', () => {
    mockUseBrandConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <BrandConfigDialog isOpen onClose={vi.fn()} />
    );
    expect(screen.getByText('New Brand')).toBeInTheDocument();
  });

  it('renders brand name in title in edit mode', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrand({ brandName: 'My Brand' }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <BrandConfigDialog isOpen onClose={vi.fn()} brandCode="test-brand" />
    );
    expect(screen.getByText('Edit My Brand')).toBeInTheDocument();
  });

  it('shows loading state while loading brand data in edit mode', () => {
    mockUseBrandConfig.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <BrandConfigDialog isOpen onClose={vi.fn()} brandCode="test-brand" />
    );
    // In loading state, the form fields should NOT be present (skeleton is shown instead)
    expect(screen.queryByLabelText(/brand id/i)).not.toBeInTheDocument();
    // Dialog title should still be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows error with retry in edit mode when fetch fails', async () => {
    const refetch = vi.fn();
    mockUseBrandConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('failed'),
      refetch,
    });

    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigDialog isOpen onClose={vi.fn()} brandCode="test-brand" />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it('renders form in create mode when no brandCode', () => {
    mockUseBrandConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <BrandConfigDialog isOpen onClose={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /create brand/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    mockUseBrandConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <BrandConfigDialog isOpen={false} onClose={vi.fn()} />
    );
    expect(screen.queryByText('New Brand')).not.toBeInTheDocument();
  });

  it('shows Save Changes in edit mode with loaded brand', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrand(),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <BrandConfigDialog isOpen onClose={vi.fn()} brandCode="test-brand" />
    );
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('renders form fields in edit mode when brand data loads', () => {
    mockUseBrandConfig.mockReturnValue({
      data: makeBrand({ brandName: 'My Edited Brand' }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <BrandConfigDialog isOpen onClose={vi.fn()} brandCode="test-brand" />
    );
    expect(screen.getByLabelText(/brand name/i)).toHaveValue('My Edited Brand');
  });

  it('calls onClose when Cancel button is clicked in create mode', async () => {
    const onClose = vi.fn();
    mockUseBrandConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigDialog isOpen onClose={onClose} />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('falls back to brandCode in title when brand data not loaded yet', () => {
    mockUseBrandConfig.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <BrandConfigDialog isOpen onClose={vi.fn()} brandCode="my-brand-code" />
    );
    expect(screen.getByText('Edit my-brand-code')).toBeInTheDocument();
  });

  it('calls create mutation on form submit in create mode', async () => {
    const mockMutate = vi.fn();
    mockUseCreateBrand.mockReturnValue({ mutate: mockMutate, isPending: false });
    mockUseBrandConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(<BrandConfigDialog isOpen onClose={vi.fn()} />);

    // Fill required fields
    await user.type(screen.getByLabelText(/brand id/i), 'b-uuid-new');
    await user.type(screen.getByLabelText(/brand code/i), 'new-brand');
    await user.type(screen.getByLabelText(/brand name/i), 'New Brand');

    // Submit
    await user.click(screen.getByRole('button', { name: /create brand/i }));

    // Wait for validation to pass and mutation to be called
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it('calls update mutation on form submit in edit mode', async () => {
    const mockMutate = vi.fn();
    mockUseUpdateBrand.mockReturnValue({ mutate: mockMutate, isPending: false });
    mockUseBrandConfig.mockReturnValue({
      data: makeBrand(),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigDialog isOpen onClose={vi.fn()} brandCode="test-brand" />
    );

    // Modify a field
    const nameInput = screen.getByLabelText(/brand name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    // Submit
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it('shows submitting state when create mutation is pending', () => {
    mockUseCreateBrand.mockReturnValue({ mutate: vi.fn(), isPending: true });
    mockUseBrandConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<BrandConfigDialog isOpen onClose={vi.fn()} />);
    expect(screen.getByText(/creating.../i)).toBeInTheDocument();
  });

  it('calls onClose when create mutation succeeds', async () => {
    const onClose = vi.fn();
    const mockMutate = vi.fn().mockImplementation((_data: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockUseCreateBrand.mockReturnValue({ mutate: mockMutate, isPending: false });
    mockUseBrandConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(<BrandConfigDialog isOpen onClose={onClose} />);

    // Fill required fields
    await user.type(screen.getByLabelText(/brand id/i), 'b-uuid-new');
    await user.type(screen.getByLabelText(/brand code/i), 'new-brand');
    await user.type(screen.getByLabelText(/brand name/i), 'New Brand');

    // Submit
    await user.click(screen.getByRole('button', { name: /create brand/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles create mutation error with "already exists" message', async () => {
    const mockMutate = vi.fn().mockImplementation((_data: unknown, opts?: { onError?: (err: Error) => void }) => {
      opts?.onError?.(new Error('Brand already exists'));
    });
    mockUseCreateBrand.mockReturnValue({ mutate: mockMutate, isPending: false });
    mockUseBrandConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(<BrandConfigDialog isOpen onClose={vi.fn()} />);

    // Fill required fields
    await user.type(screen.getByLabelText(/brand id/i), 'b-uuid-new');
    await user.type(screen.getByLabelText(/brand code/i), 'dup-brand');
    await user.type(screen.getByLabelText(/brand name/i), 'Dup Brand');

    // Submit
    await user.click(screen.getByRole('button', { name: /create brand/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it('handles create mutation error with generic message', async () => {
    const mockMutate = vi.fn().mockImplementation((_data: unknown, opts?: { onError?: (err: Error) => void }) => {
      opts?.onError?.(new Error('Network error'));
    });
    mockUseCreateBrand.mockReturnValue({ mutate: mockMutate, isPending: false });
    mockUseBrandConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(<BrandConfigDialog isOpen onClose={vi.fn()} />);

    // Fill required fields
    await user.type(screen.getByLabelText(/brand id/i), 'b-uuid-new');
    await user.type(screen.getByLabelText(/brand code/i), 'err-brand');
    await user.type(screen.getByLabelText(/brand name/i), 'Err Brand');

    // Submit
    await user.click(screen.getByRole('button', { name: /create brand/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it('calls onClose when update mutation succeeds', async () => {
    const onClose = vi.fn();
    const mockMutate = vi.fn().mockImplementation((_data: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockUseUpdateBrand.mockReturnValue({ mutate: mockMutate, isPending: false });
    mockUseBrandConfig.mockReturnValue({
      data: makeBrand(),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigDialog isOpen onClose={onClose} brandCode="test-brand" />
    );

    // Modify a field
    const nameInput = screen.getByLabelText(/brand name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    // Submit
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles update mutation error', async () => {
    const mockMutate = vi.fn().mockImplementation((_data: unknown, opts?: { onError?: (err: Error) => void }) => {
      opts?.onError?.(new Error('Update failed'));
    });
    mockUseUpdateBrand.mockReturnValue({ mutate: mockMutate, isPending: false });
    mockUseBrandConfig.mockReturnValue({
      data: makeBrand(),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigDialog isOpen onClose={vi.fn()} brandCode="test-brand" />
    );

    // Modify a field
    const nameInput = screen.getByLabelText(/brand name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Fail Name');

    // Submit
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it('shows submitting state when update mutation is pending', () => {
    mockUseUpdateBrand.mockReturnValue({ mutate: vi.fn(), isPending: true });
    mockUseBrandConfig.mockReturnValue({
      data: makeBrand(),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <BrandConfigDialog isOpen onClose={vi.fn()} brandCode="test-brand" />
    );
    expect(screen.getByText(/saving.../i)).toBeInTheDocument();
  });
});
