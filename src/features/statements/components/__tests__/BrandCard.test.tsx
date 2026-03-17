/**
 * BrandCard.test.tsx
 *
 * TE04 compliant: Mocks ONLY router navigation (external service), not UI components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrandCard } from '../BrandCard';
import type { RMBrandConfigWithStatus } from '../../types';

// Mock router — external navigation service, not a React component
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
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
    createdBy: null,
    updatedBy: null,
    lastRun: {
      id: 'run-1',
      status: 'success',
      startedAt: '2026-01-10T06:00:00Z',
      completedAt: '2026-01-10T06:05:00Z',
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
    },
    nextExpected: '2026-02-01',
    health: 'healthy',
    ...overrides,
  };
}

describe('BrandCard', () => {
  it('renders brand name and code', () => {
    render(<BrandCard brand={makeBrand()} />);
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    expect(screen.getByText('test-brand')).toBeInTheDocument();
  });

  it('renders acquisition mode badge', () => {
    render(<BrandCard brand={makeBrand()} />);
    expect(screen.getByText('Automated')).toBeInTheDocument();
  });

  it('renders granularity label', () => {
    render(<BrandCard brand={makeBrand({ granularity: 'monthly' })} />);
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('navigates to brand detail on click', async () => {
    const user = userEvent.setup();
    render(<BrandCard brand={makeBrand()} />);

    await user.click(screen.getByRole('button', { name: /view statements for test brand/i }));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/revenue/statements/$brandCode',
      params: { brandCode: 'test-brand' },
    });
  });

  it('navigates on Enter key', async () => {
    const user = userEvent.setup();
    render(<BrandCard brand={makeBrand()} />);

    const card = screen.getByRole('button', { name: /view statements for test brand/i });
    card.focus();
    await user.keyboard('{Enter}');
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('calls onEditConfig when settings button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<BrandCard brand={makeBrand()} onEditConfig={onEdit} />);

    await user.click(screen.getByRole('button', { name: /configure test brand/i }));
    expect(onEdit).toHaveBeenCalledWith('test-brand');
    // Should NOT navigate (stopPropagation)
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows reduced opacity when brand is disabled', () => {
    const { container } = render(
      <BrandCard brand={makeBrand({ enabled: false })} />
    );
    const card = container.querySelector('[role="button"]');
    expect(card?.className).toContain('opacity-50');
  });

  it('renders "—" when no last run date', () => {
    render(<BrandCard brand={makeBrand({ lastRun: null })} />);
    // Both Last and Next fields should show dash for missing data
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });
});
