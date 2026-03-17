/**
 * BrandConfigForm.test.tsx
 *
 * TE04 compliant: Tests real form rendering with react-hook-form + zod.
 * No mocks of ui-components. Only mock: none needed (pure form component).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrandConfigForm } from '../BrandConfigForm';
import type { RMBrandConfigWithActivity } from '../../../types';

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
    scheduleCron: '0 6 * * *',
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

describe('BrandConfigForm', () => {
  it('renders all basic fields in create mode', () => {
    render(
      <BrandConfigForm onSubmit={vi.fn()} onCancel={vi.fn()} />
    );

    expect(screen.getByLabelText(/brand id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/brand code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/brand name/i)).toBeInTheDocument();
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows "Create Brand" button in create mode', () => {
    render(
      <BrandConfigForm onSubmit={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /create brand/i })).toBeInTheDocument();
  });

  it('shows "Save Changes" button in edit mode', () => {
    render(
      <BrandConfigForm brand={makeBrand()} onSubmit={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('disables brandId and brandCode fields in edit mode', () => {
    render(
      <BrandConfigForm brand={makeBrand()} onSubmit={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByLabelText(/brand id/i)).toBeDisabled();
    expect(screen.getByLabelText(/brand code/i)).toBeDisabled();
  });

  it('calls onCancel when Cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <BrandConfigForm onSubmit={vi.fn()} onCancel={onCancel} />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows validation errors for required fields on submit', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <BrandConfigForm onSubmit={onSubmit} onCancel={vi.fn()} />
    );

    // Submit without filling required fields
    await user.click(screen.getByRole('button', { name: /create brand/i }));

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });

    // onSubmit should NOT have been called
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows spinner text when isSubmitting is true', () => {
    render(
      <BrandConfigForm onSubmit={vi.fn()} onCancel={vi.fn()} isSubmitting />
    );
    expect(screen.getByText(/creating.../i)).toBeInTheDocument();
  });

  it('shows "Saving..." when isSubmitting in edit mode', () => {
    render(
      <BrandConfigForm
        brand={makeBrand()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting
      />
    );
    expect(screen.getByText(/saving.../i)).toBeInTheDocument();
  });

  it('renders Enabled and Auto Notify toggles', () => {
    render(
      <BrandConfigForm onSubmit={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByLabelText('Enabled')).toBeInTheDocument();
    expect(screen.getByLabelText('Auto Notify')).toBeInTheDocument();
  });

  it('renders schedule cron and max backfill fields', () => {
    render(
      <BrandConfigForm onSubmit={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByLabelText(/schedule/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max backfill/i)).toBeInTheDocument();
  });

  it('shows automated download fields when mode is automated_download', () => {
    render(
      <BrandConfigForm
        brand={makeBrand({ acquisitionMode: 'automated_download', portalUrl: 'https://portal.test', credentialsEnv: 'MY_CREDS' })}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Automated Download Settings')).toBeInTheDocument();
    expect(screen.getByLabelText(/portal url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/credentials env/i)).toBeInTheDocument();
  });

  it('shows manual input fields when mode is manual_input', () => {
    render(
      <BrandConfigForm
        brand={makeBrand({
          acquisitionMode: 'manual_input',
          currencyCode: 'USD',
          shareTypes: [{ code: 'GGR', name: 'Gross Gaming Revenue' }],
        })}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Manual Input Settings')).toBeInTheDocument();
    expect(screen.getByLabelText(/currency code/i)).toBeInTheDocument();
  });

  it('allows adding and removing share types', async () => {
    const user = userEvent.setup();
    render(
      <BrandConfigForm
        brand={makeBrand({ acquisitionMode: 'manual_input', shareTypes: [] })}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Add a share type
    await user.click(screen.getByRole('button', { name: /add share type/i }));
    expect(screen.getByPlaceholderText('Code (e.g. GGR)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name (e.g. Gross Gaming Revenue)')).toBeInTheDocument();

    // Remove it
    await user.click(screen.getByRole('button', { name: /remove share type 1/i }));
    expect(screen.queryByPlaceholderText('Code (e.g. GGR)')).not.toBeInTheDocument();
  });

  it('does not show automated fields when mode is manual_download', () => {
    render(
      <BrandConfigForm onSubmit={vi.fn()} onCancel={vi.fn()} />
    );

    // Default mode is manual_download, should not show automated or manual_input sections
    expect(screen.queryByText('Automated Download Settings')).not.toBeInTheDocument();
    expect(screen.queryByText('Manual Input Settings')).not.toBeInTheDocument();
  });

  it('populates form with brand data in edit mode', () => {
    render(
      <BrandConfigForm
        brand={makeBrand({
          brandId: 'uuid-123',
          brandCode: 'my-brand',
          brandName: 'My Brand Name',
        })}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/brand id/i)).toHaveValue('uuid-123');
    expect(screen.getByLabelText(/brand code/i)).toHaveValue('my-brand');
    expect(screen.getByLabelText(/brand name/i)).toHaveValue('My Brand Name');
  });

  it('calls onSubmit with valid data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <BrandConfigForm onSubmit={onSubmit} onCancel={vi.fn()} />
    );

    // Fill required fields
    await user.type(screen.getByLabelText(/brand id/i), 'b-uuid');
    await user.type(screen.getByLabelText(/brand code/i), 'my-brand');
    await user.type(screen.getByLabelText(/brand name/i), 'My Brand');

    // Submit
    await user.click(screen.getByRole('button', { name: /create brand/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        brandId: 'b-uuid',
        brandCode: 'my-brand',
        brandName: 'My Brand',
      }),
      expect.anything()
    );
  });

  it('validates brand code format (lowercase with hyphens)', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <BrandConfigForm onSubmit={onSubmit} onCancel={vi.fn()} />
    );

    await user.type(screen.getByLabelText(/brand id/i), 'b-uuid');
    await user.type(screen.getByLabelText(/brand code/i), 'INVALID CODE');
    await user.type(screen.getByLabelText(/brand name/i), 'Test');

    await user.click(screen.getByRole('button', { name: /create brand/i }));

    await waitFor(() => {
      expect(screen.getByText(/lowercase, hyphens only/i)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows portal URL and credentials env required errors for automated_download', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <BrandConfigForm
        brand={makeBrand({
          acquisitionMode: 'automated_download',
          portalUrl: '',
          credentialsEnv: '',
        })}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    // Clear the portal URL and credentials (if pre-filled)
    const portalInput = screen.getByLabelText(/portal url/i);
    await user.clear(portalInput);
    const credsInput = screen.getByLabelText(/credentials env/i);
    await user.clear(credsInput);

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });
});
