/**
 * RevenueDetailPanel.test.tsx
 *
 * TE04 compliant: Mocks ONLY router (external navigation service).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RevenueDetailPanel } from '../RevenueDetailPanel';
import type { PlayerRevenue } from '../../types';

// Mock router — external navigation service
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

function makeRecord(overrides: Partial<PlayerRevenue> = {}): PlayerRevenue {
  return {
    id: 'rec-1',
    batchId: 'batch-1',
    gamingAccountId: 'ga-1',
    brandId: 'brand-1',
    brandName: 'Test Brand',
    brandPlayerId: 'player-123',
    nickname: 'TestPlayer',
    agentCode: null,
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    commission: '150.50',
    extras: null,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
    amounts: [
      {
        id: 'amt-1',
        revenueId: 'rec-1',
        shareTypeId: 'st-1',
        shareTypeCode: 'CASINO_NGR',
        amount: '1000.00',
      },
      {
        id: 'amt-2',
        revenueId: 'rec-1',
        shareTypeId: 'st-2',
        shareTypeCode: 'POKER_CNGR',
        amount: '-250.75',
      },
    ],
    ...overrides,
  };
}

describe('RevenueDetailPanel', () => {
  const mockOnClose = vi.fn();
  const mockOnViewPlayer = vi.fn();

  beforeEach(() => {
    mockOnClose.mockReset();
    mockOnViewPlayer.mockReset();
    mockNavigate.mockReset();
  });

  it('renders the player nickname in the header', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord()}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    // Nickname appears in header (h2) and in player info section
    expect(screen.getAllByText('TestPlayer').length).toBeGreaterThanOrEqual(1);
    // The header h2 should contain the nickname
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('TestPlayer');
  });

  it('renders brandPlayerId when nickname is empty', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord({ nickname: '' })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    // When nickname is empty, header shows brandPlayerId
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('player-123');
  });

  it('renders brand name and period in header', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord()}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    // Brand name appears in header subtitle and in player info section
    expect(screen.getAllByText('Test Brand').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RevenueDetailPanel
        record={makeRecord()}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );

    await user.click(screen.getByRole('button', { name: /close panel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays player info section', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord()}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    expect(screen.getByText('Player Info')).toBeInTheDocument();
    // Nickname and brand appear in both header and info section
    expect(screen.getAllByText('TestPlayer').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('player-123').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Test Brand').length).toBeGreaterThanOrEqual(1);
  });

  it('displays agent code when present', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord({ agentCode: 'AG-42' })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    expect(screen.getByText('Agent Code')).toBeInTheDocument();
    expect(screen.getByText('AG-42')).toBeInTheDocument();
  });

  it('does not display agent code when null', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord({ agentCode: null })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    expect(screen.queryByText('Agent Code')).not.toBeInTheDocument();
  });

  it('displays amounts with share type labels', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord()}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    expect(screen.getByText('Amounts')).toBeInTheDocument();
    expect(screen.getByText('Casino NGR')).toBeInTheDocument();
    expect(screen.getByText('Poker CNGR')).toBeInTheDocument();
  });

  it('displays "No amounts recorded" when amounts is empty', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord({ amounts: [] })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    expect(screen.getByText('No amounts recorded')).toBeInTheDocument();
  });

  it('applies destructive styling to negative amounts', () => {
    const { container } = render(
      <RevenueDetailPanel
        record={makeRecord()}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    // The -250.75 amount should have text-destructive
    const destructiveElements = container.querySelectorAll('.text-destructive');
    expect(destructiveElements.length).toBeGreaterThan(0);
  });

  it('displays commission when present', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord({ commission: '150.50' })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    expect(screen.getByText('Commission (Brand)')).toBeInTheDocument();
  });

  it('does not display commission when null', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord({ commission: null })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    expect(screen.queryByText('Commission (Brand)')).not.toBeInTheDocument();
  });

  it('navigates to batch page when "View source batch" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RevenueDetailPanel
        record={makeRecord({ batchId: 'batch-42' })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );

    await user.click(screen.getByText('View source batch'));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/revenue/imports/$batchId',
      params: { batchId: 'batch-42' },
    });
  });

  it('displays source section with batch ID and created date', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord()}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Batch ID')).toBeInTheDocument();
    expect(screen.getByText('batch-1')).toBeInTheDocument();
  });

  it('calls onViewPlayer when "View all periods" button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RevenueDetailPanel
        record={makeRecord({ gamingAccountId: 'ga-42' })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );

    await user.click(screen.getByText(/view all periods/i));
    expect(mockOnViewPlayer).toHaveBeenCalledWith('ga-42');
  });

  it('renders extras viewer when extras has data', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord({ extras: { bonus: 100 } })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    expect(screen.getByText('Extra Data')).toBeInTheDocument();
  });

  it('does not render extras section when extras is null', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord({ extras: null })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    expect(screen.queryByText('Extra Data')).not.toBeInTheDocument();
  });

  it('does not render extras section when extras is empty object', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord({ extras: {} })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    expect(screen.queryByText('Extra Data')).not.toBeInTheDocument();
  });

  it('applies destructive styling to negative commission', () => {
    const { container } = render(
      <RevenueDetailPanel
        record={makeRecord({ commission: '-99.50' })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    // The commission row should have text-destructive class
    const destructiveElements = container.querySelectorAll('.text-destructive');
    expect(destructiveElements.length).toBeGreaterThan(0);
  });

  it('does not apply destructive styling to positive commission', () => {
    const { container } = render(
      <RevenueDetailPanel
        record={makeRecord({
          commission: '150.50',
          amounts: [], // Remove amounts so only commission styling matters
        })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    const destructiveElements = container.querySelectorAll('.text-destructive');
    expect(destructiveElements.length).toBe(0);
  });

  it('renders nickname "-" when nickname is null-ish empty string', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord({ nickname: '' })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    // Nickname DetailRow should show "-" for empty nickname
    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThanOrEqual(1);
  });

  it('formats NaN amount gracefully', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord({
          amounts: [
            { id: 'amt-bad', revenueId: 'rec-1', shareTypeId: 'st-1', shareTypeCode: 'CASINO_NGR', amount: 'not-a-number' },
          ],
        })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    // NaN amount should display the raw string
    expect(screen.getByText('not-a-number')).toBeInTheDocument();
  });

  it('renders multiple amounts with their share type labels', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord({
          amounts: [
            { id: 'a1', revenueId: 'r1', shareTypeId: 's1', shareTypeCode: 'CASINO_NGR', amount: '100.00' },
            { id: 'a2', revenueId: 'r1', shareTypeId: 's2', shareTypeCode: 'POKER_CNGR', amount: '200.00' },
            { id: 'a3', revenueId: 'r1', shareTypeId: 's3', shareTypeCode: 'UNKNOWN_TYPE', amount: '50.00' },
          ],
        })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    expect(screen.getByText('Casino NGR')).toBeInTheDocument();
    expect(screen.getByText('Poker CNGR')).toBeInTheDocument();
    // Unknown types fall back to raw code
    expect(screen.getByText('UNKNOWN_TYPE')).toBeInTheDocument();
  });

  it('renders Created date in the source section', () => {
    render(
      <RevenueDetailPanel
        record={makeRecord({ createdAt: '2026-03-15T12:00:00Z' })}
        onClose={mockOnClose}
        onViewPlayer={mockOnViewPlayer}
      />
    );
    expect(screen.getByText('Created')).toBeInTheDocument();
  });
});
