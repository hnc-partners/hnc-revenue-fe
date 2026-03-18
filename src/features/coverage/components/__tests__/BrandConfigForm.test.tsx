/**
 * BrandConfigForm.test.tsx
 *
 * TE04 compliant: Mocks ONLY the mutation hook (external API layer).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrandConfigForm } from '../BrandConfigForm';
import type { BrandConfigFull } from '../../types';

// Mock mutation hook — external API layer
const mockMutate = vi.fn();
const mockUseUpsertBrandConfig = vi.fn();
vi.mock('../../api/useUpsertBrandConfig', () => ({
  useUpsertBrandConfig: () => mockUseUpsertBrandConfig(),
}));

// Mock sonner toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
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

describe('BrandConfigForm', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
    mockUseUpsertBrandConfig.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it('renders "Add Brand Config" title in create mode', () => {
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );
    expect(screen.getByText('Add Brand Config')).toBeInTheDocument();
  });

  it('renders "Edit Brand Config" title in edit mode', () => {
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} config={makeConfig()} />
    );
    expect(screen.getByText('Edit Brand Config')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );

    expect(screen.getByLabelText(/brand id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/brand code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/granularity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/active/i)).toBeInTheDocument();
  });

  it('renders file type toggle buttons', () => {
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );

    expect(screen.getByText('Commission')).toBeInTheDocument();
    expect(screen.getByText('Poker GGR')).toBeInTheDocument();
    expect(screen.getByText('Casino GGR')).toBeInTheDocument();
    expect(screen.getByText('Poker Analysis')).toBeInTheDocument();
    expect(screen.getByText('Single')).toBeInTheDocument();
  });

  it('renders granularity select options', () => {
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );

    const select = screen.getByLabelText(/granularity/i);
    expect(select).toBeInTheDocument();
    // Check options
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Daily');
    expect(options[1]).toHaveTextContent('Weekly');
    expect(options[2]).toHaveTextContent('Monthly');
  });

  it('shows "Create" button in create mode', () => {
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('shows "Save" button in edit mode', () => {
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} config={makeConfig()} />
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('shows Cancel button', () => {
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('disables brandId field in edit mode', () => {
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} config={makeConfig()} />
    );
    expect(screen.getByLabelText(/brand id/i)).toBeDisabled();
  });

  it('enables brandId field in create mode', () => {
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );
    expect(screen.getByLabelText(/brand id/i)).not.toBeDisabled();
  });

  it('populates form fields in edit mode', () => {
    renderWithQuery(
      <BrandConfigForm
        open={true}
        onClose={vi.fn()}
        config={makeConfig({
          brandId: 'uuid-123',
          brandCode: 'MY',
          periodGranularity: 'weekly',
        })}
      />
    );

    expect(screen.getByLabelText(/brand id/i)).toHaveValue('uuid-123');
    expect(screen.getByLabelText(/brand code/i)).toHaveValue('MY');
    expect(screen.getByLabelText(/granularity/i)).toHaveValue('weekly');
  });

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigForm open={true} onClose={onClose} />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText('Brand ID is required')).toBeInTheDocument();
    });
    expect(screen.getByText('Brand code is required')).toBeInTheDocument();
    expect(screen.getByText('At least one file type is required')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('calls mutation with valid form data on submit', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );

    await user.type(screen.getByLabelText(/brand id/i), 'my-brand-id');
    await user.type(screen.getByLabelText(/brand code/i), 'MBR');
    // Select a file type
    await user.click(screen.getByText('Commission'));

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        brandId: 'my-brand-id',
        brandCode: 'MBR',
        periodGranularity: 'monthly',
        expectedFileTypes: ['commission'],
        active: true,
      }),
      expect.anything()
    );
  });

  it('toggles file type selection on click', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );

    // Select two file types
    await user.click(screen.getByText('Commission'));
    await user.click(screen.getByText('Poker GGR'));

    // Fill required fields and submit
    await user.type(screen.getByLabelText(/brand id/i), 'test-id');
    await user.type(screen.getByLabelText(/brand code/i), 'TST');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedFileTypes: ['commission', 'poker_ggr'],
        }),
        expect.anything()
      );
    });
  });

  it('deselects file type when clicking already-selected type', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );

    // Select then deselect Commission
    await user.click(screen.getByText('Commission'));
    await user.click(screen.getByText('Commission'));

    // Only select Poker GGR
    await user.click(screen.getByText('Poker GGR'));

    await user.type(screen.getByLabelText(/brand id/i), 'test-id');
    await user.type(screen.getByLabelText(/brand code/i), 'TST');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedFileTypes: ['poker_ggr'],
        }),
        expect.anything()
      );
    });
  });

  it('shows "Saving..." text when mutation is pending', () => {
    mockUseUpsertBrandConfig.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    });

    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('disables submit button when mutation is pending', () => {
    mockUseUpsertBrandConfig.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    });

    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );
    // The submit button with "Saving..." text should be disabled
    const submitBtn = screen.getByText('Saving...').closest('button');
    expect(submitBtn).toBeDisabled();
  });

  it('does not render dialog when open is false', () => {
    renderWithQuery(
      <BrandConfigForm open={false} onClose={vi.fn()} />
    );
    expect(screen.queryByText('Add Brand Config')).not.toBeInTheDocument();
  });

  it('shows success toast and calls onClose on successful mutation', async () => {
    // Make mutate call onSuccess callback
    mockMutate.mockImplementation((_data: unknown, options: { onSuccess: () => void }) => {
      options.onSuccess();
    });

    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigForm open={true} onClose={onClose} />
    );

    await user.type(screen.getByLabelText(/brand id/i), 'test-id');
    await user.type(screen.getByLabelText(/brand code/i), 'TST');
    await user.click(screen.getByText('Commission'));
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Brand config created successfully');
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error toast on failed mutation', async () => {
    mockMutate.mockImplementation((_data: unknown, options: { onError: () => void }) => {
      options.onError();
    });

    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );

    await user.type(screen.getByLabelText(/brand id/i), 'test-id');
    await user.type(screen.getByLabelText(/brand code/i), 'TST');
    await user.click(screen.getByText('Commission'));
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'Failed to save brand config. Please try again.'
      );
    });
  });

  it('shows update success toast in edit mode', async () => {
    mockMutate.mockImplementation((_data: unknown, options: { onSuccess: () => void }) => {
      options.onSuccess();
    });

    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigForm
        open={true}
        onClose={vi.fn()}
        config={makeConfig({ expectedFileTypes: ['commission'] })}
      />
    );

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Brand config updated successfully');
    });
  });

  it('renders active checkbox checked by default in create mode', () => {
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );
    expect(screen.getByLabelText(/active/i)).toBeChecked();
  });

  it('renders active checkbox unchecked when config has active=false', () => {
    renderWithQuery(
      <BrandConfigForm
        open={true}
        onClose={vi.fn()}
        config={makeConfig({ active: false })}
      />
    );
    expect(screen.getByLabelText(/active/i)).not.toBeChecked();
  });

  it('handles config with null brandCode by defaulting to empty string', () => {
    renderWithQuery(
      <BrandConfigForm
        open={true}
        onClose={vi.fn()}
        config={makeConfig({ brandCode: undefined })}
      />
    );
    expect(screen.getByLabelText(/brand code/i)).toHaveValue('');
  });

  it('handles config with null periodGranularity by defaulting to monthly', () => {
    renderWithQuery(
      <BrandConfigForm
        open={true}
        onClose={vi.fn()}
        config={makeConfig({ periodGranularity: undefined })}
      />
    );
    expect(screen.getByLabelText(/granularity/i)).toHaveValue('monthly');
  });

  it('handles config with undefined expectedFileTypes by defaulting to empty array', () => {
    renderWithQuery(
      <BrandConfigForm
        open={true}
        onClose={vi.fn()}
        config={makeConfig({ expectedFileTypes: undefined })}
      />
    );
    // All file type buttons should be in unselected state (no mf-accent styling)
    const commissionBtn = screen.getByText('Commission');
    expect(commissionBtn.className).not.toContain('border-mf-accent');
  });

  it('selects multiple file types and submits correctly', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );

    await user.type(screen.getByLabelText(/brand id/i), 'test-multi');
    await user.type(screen.getByLabelText(/brand code/i), 'TM');
    await user.click(screen.getByText('Commission'));
    await user.click(screen.getByText('Casino GGR'));
    await user.click(screen.getByText('Single'));

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedFileTypes: ['commission', 'casino_ggr', 'single'],
        }),
        expect.anything()
      );
    });
  });

  it('changes granularity selection', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );

    await user.type(screen.getByLabelText(/brand id/i), 'test-gran');
    await user.type(screen.getByLabelText(/brand code/i), 'TG');
    await user.click(screen.getByText('Commission'));
    await user.selectOptions(screen.getByLabelText(/granularity/i), 'daily');

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          periodGranularity: 'daily',
        }),
        expect.anything()
      );
    });
  });

  it('pre-selects file types in edit mode', () => {
    renderWithQuery(
      <BrandConfigForm
        open={true}
        onClose={vi.fn()}
        config={makeConfig({ expectedFileTypes: ['commission', 'poker_ggr'] })}
      />
    );

    // Commission and Poker GGR buttons should have selected styling
    const commissionBtn = screen.getByText('Commission');
    expect(commissionBtn.className).toContain('border-mf-accent');
    const pokerBtn = screen.getByText('Poker GGR');
    expect(pokerBtn.className).toContain('border-mf-accent');
  });

  it('shows validation error for brandCode when empty on submit', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <BrandConfigForm open={true} onClose={vi.fn()} />
    );

    // Fill brand ID but not brand code
    await user.type(screen.getByLabelText(/brand id/i), 'some-id');
    await user.click(screen.getByText('Commission'));
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText('Brand code is required')).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
