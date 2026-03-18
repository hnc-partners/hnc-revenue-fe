/**
 * CoverageMatrix.test.tsx
 *
 * TE04 compliant: Mocks ONLY router (external navigation service).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoverageMatrix } from '../CoverageMatrix';
import type { CoverageBrandRow } from '../../types';

// Mock router — external navigation service
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

function makeBrandRow(overrides: Partial<CoverageBrandRow> = {}): CoverageBrandRow {
  return {
    brandId: 'brand-1',
    brandName: 'Test Brand',
    granularity: 'monthly',
    periods: [
      {
        periodStart: '2026-01-01',
        periodEnd: '2026-01-31',
        status: 'processed',
        batchId: 'batch-1',
      },
      {
        periodStart: '2026-02-01',
        periodEnd: '2026-02-28',
        status: 'pending',
        batchId: 'batch-2',
      },
      {
        periodStart: '2026-03-01',
        periodEnd: '2026-03-31',
        status: 'failed',
        batchId: 'batch-3',
      },
      {
        periodStart: '2026-04-01',
        periodEnd: '2026-04-30',
        status: 'missing',
        batchId: null,
      },
    ],
    ...overrides,
  };
}

describe('CoverageMatrix', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders empty state when data is empty', () => {
    render(<CoverageMatrix data={[]} />);
    expect(screen.getByText('No Coverage Data')).toBeInTheDocument();
    expect(
      screen.getByText(/no brands configured for reporting/i)
    ).toBeInTheDocument();
  });

  it('renders brand names as row headers', () => {
    const data = [
      makeBrandRow({ brandId: 'b-1', brandName: 'Brand Alpha' }),
      makeBrandRow({ brandId: 'b-2', brandName: 'Brand Beta' }),
    ];
    render(<CoverageMatrix data={data} />);

    expect(screen.getByText('Brand Alpha')).toBeInTheDocument();
    expect(screen.getByText('Brand Beta')).toBeInTheDocument();
  });

  it('renders "Brand" column header', () => {
    render(<CoverageMatrix data={[makeBrandRow()]} />);
    expect(screen.getByText('Brand')).toBeInTheDocument();
  });

  it('renders granularity badges for each brand', () => {
    render(
      <CoverageMatrix
        data={[makeBrandRow({ granularity: 'monthly' })]}
      />
    );
    expect(screen.getByText('monthly')).toBeInTheDocument();
  });

  it('renders period column headers with formatted labels', () => {
    render(
      <CoverageMatrix
        data={[makeBrandRow({ granularity: 'monthly' })]}
      />
    );
    // Monthly format: "Jan 2026", "Feb 2026", etc.
    expect(screen.getByText('Jan 2026')).toBeInTheDocument();
    expect(screen.getByText('Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('Mar 2026')).toBeInTheDocument();
    expect(screen.getByText('Apr 2026')).toBeInTheDocument();
  });

  it('renders cells with status icons as buttons', () => {
    render(<CoverageMatrix data={[makeBrandRow()]} />);
    // 4 periods = 4 cell buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  it('renders cell title attributes with status', () => {
    render(<CoverageMatrix data={[makeBrandRow()]} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('title', 'processed — Click to view batch');
    expect(buttons[1]).toHaveAttribute('title', 'pending — Click to view batch');
    expect(buttons[2]).toHaveAttribute('title', 'failed — Click to view batch');
    expect(buttons[3]).toHaveAttribute('title', 'missing');
  });

  it('disables cell button when no batchId', () => {
    render(<CoverageMatrix data={[makeBrandRow()]} />);
    const buttons = screen.getAllByRole('button');
    // Last period (missing) has no batchId
    expect(buttons[3]).toBeDisabled();
  });

  it('enables cell button when batchId exists', () => {
    render(<CoverageMatrix data={[makeBrandRow()]} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).not.toBeDisabled();
    expect(buttons[1]).not.toBeDisabled();
    expect(buttons[2]).not.toBeDisabled();
  });

  it('navigates to batch page on cell click', async () => {
    const user = userEvent.setup();
    render(<CoverageMatrix data={[makeBrandRow()]} />);

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/revenue/imports/$batchId',
      params: { batchId: 'batch-1' },
    });
  });

  it('does not navigate when clicking a cell without batchId', async () => {
    const user = userEvent.setup();
    render(<CoverageMatrix data={[makeBrandRow()]} />);

    const buttons = screen.getAllByRole('button');
    // Missing cell (last) is disabled so click won't fire handler
    await user.click(buttons[3]);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('renders legend section with all statuses', () => {
    render(<CoverageMatrix data={[makeBrandRow()]} />);

    expect(screen.getByText('Legend:')).toBeInTheDocument();
    expect(screen.getByText('Processed')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Missing')).toBeInTheDocument();
  });

  it('renders weekly period labels correctly', () => {
    const weeklyBrand = makeBrandRow({
      granularity: 'weekly',
      periods: [
        {
          periodStart: '2026-01-06',
          periodEnd: '2026-01-12',
          status: 'processed',
          batchId: 'b-1',
        },
      ],
    });

    render(<CoverageMatrix data={[weeklyBrand]} />);
    // Weekly format: "Jan 6-12"
    expect(screen.getByText('Jan 6-12')).toBeInTheDocument();
  });

  it('renders daily period labels correctly', () => {
    const dailyBrand = makeBrandRow({
      granularity: 'daily',
      periods: [
        {
          periodStart: '2026-03-15',
          periodEnd: '2026-03-15',
          status: 'processed',
          batchId: 'b-1',
        },
      ],
    });

    render(<CoverageMatrix data={[dailyBrand]} />);
    // Daily format: "Mar 15"
    expect(screen.getByText('Mar 15')).toBeInTheDocument();
  });

  it('renders multiple brand rows', () => {
    const data = [
      makeBrandRow({ brandId: 'b-1', brandName: 'Alpha' }),
      makeBrandRow({ brandId: 'b-2', brandName: 'Beta' }),
      makeBrandRow({ brandId: 'b-3', brandName: 'Gamma' }),
    ];

    render(<CoverageMatrix data={data} />);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    // 3 brands x 4 periods = 12 cell buttons
    expect(screen.getAllByRole('button')).toHaveLength(12);
  });

  it('navigates to different batch when clicking a different cell', async () => {
    const user = userEvent.setup();
    render(<CoverageMatrix data={[makeBrandRow()]} />);

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]); // pending cell with batch-2

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/revenue/imports/$batchId',
      params: { batchId: 'batch-2' },
    });
  });

  it('renders granularity badges with correct variant per type', () => {
    const data = [
      makeBrandRow({ brandId: 'b-1', brandName: 'Daily Brand', granularity: 'daily', periods: [] }),
      makeBrandRow({ brandId: 'b-2', brandName: 'Weekly Brand', granularity: 'weekly', periods: [] }),
      makeBrandRow({ brandId: 'b-3', brandName: 'Monthly Brand', granularity: 'monthly', periods: [] }),
    ];

    render(<CoverageMatrix data={data} />);

    expect(screen.getByText('daily')).toBeInTheDocument();
    expect(screen.getByText('weekly')).toBeInTheDocument();
    expect(screen.getByText('monthly')).toBeInTheDocument();
  });

  it('renders brand with no periods (empty periods array)', () => {
    const data = [
      makeBrandRow({
        brandName: 'Empty Brand',
        periods: [],
      }),
    ];

    render(<CoverageMatrix data={data} />);

    expect(screen.getByText('Empty Brand')).toBeInTheDocument();
    // Only column header row, no cell buttons
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('applies correct cursor styling based on batchId presence', () => {
    render(<CoverageMatrix data={[makeBrandRow()]} />);

    const buttons = screen.getAllByRole('button');
    // Buttons with batchId should have cursor-pointer class
    expect(buttons[0].className).toContain('cursor-pointer');
    // Button without batchId (missing) should have cursor-default
    expect(buttons[3].className).toContain('cursor-default');
  });

  it('renders cells for failed status with correct title', () => {
    render(<CoverageMatrix data={[makeBrandRow()]} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[2]).toHaveAttribute('title', 'failed — Click to view batch');
  });
});
