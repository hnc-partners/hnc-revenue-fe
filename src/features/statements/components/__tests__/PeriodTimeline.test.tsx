import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PeriodTimeline } from '../PeriodTimeline';
import type { RecentRun } from '../../types';

function makeRun(overrides: Partial<RecentRun> = {}): RecentRun {
  return {
    id: 'run-1',
    status: 'success',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    sourceType: 'automated',
    createdAt: '2026-01-15T00:00:00Z',
    ...overrides,
  };
}

describe('PeriodTimeline', () => {
  it('renders empty state when no runs provided', () => {
    render(<PeriodTimeline runs={[]} />);
    expect(screen.getByText(/no period data available/i)).toBeInTheDocument();
  });

  it('renders timeline blocks for runs', () => {
    const runs = [
      makeRun({ id: 'r1', periodStart: '2026-01-01', periodEnd: '2026-01-31', status: 'success' }),
      makeRun({ id: 'r2', periodStart: '2026-02-01', periodEnd: '2026-02-28', status: 'failed' }),
    ];
    const { container } = render(<PeriodTimeline runs={runs} />);
    // Should have 2 timeline blocks
    const blocks = container.querySelectorAll('[title]');
    expect(blocks.length).toBeGreaterThanOrEqual(2);
  });

  it('sorts runs by periodStart ascending', () => {
    const runs = [
      makeRun({ id: 'r2', periodStart: '2026-03-01', periodEnd: '2026-03-31' }),
      makeRun({ id: 'r1', periodStart: '2026-01-01', periodEnd: '2026-01-31' }),
    ];
    const { container } = render(<PeriodTimeline runs={runs} />);
    const labels = container.querySelectorAll('.text-center');
    // First label should be Jan, not Mar
    const texts = Array.from(labels).map((el) => el.textContent?.trim());
    expect(texts[0]).toMatch(/Jan/);
  });

  it('renders status legend', () => {
    const runs = [makeRun()];
    render(<PeriodTimeline runs={runs} />);
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Partial')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const runs = [makeRun()];
    const { container } = render(
      <PeriodTimeline runs={runs} className="my-timeline" />
    );
    expect(container.firstChild).toHaveClass('my-timeline');
  });

  it('renders different status colors for each run type', () => {
    const runs = [
      makeRun({ id: 'r1', status: 'success', periodStart: '2026-01-01' }),
      makeRun({ id: 'r2', status: 'failed', periodStart: '2026-02-01' }),
      makeRun({ id: 'r3', status: 'partial', periodStart: '2026-03-01' }),
      makeRun({ id: 'r4', status: 'running', periodStart: '2026-04-01' }),
      makeRun({ id: 'r5', status: 'skipped', periodStart: '2026-05-01' }),
      makeRun({ id: 'r6', status: 'rolled_back', periodStart: '2026-06-01' }),
    ];
    const { container } = render(<PeriodTimeline runs={runs} />);
    // Each run should have a colored block
    const blocks = container.querySelectorAll('.rounded-sm');
    expect(blocks.length).toBeGreaterThanOrEqual(6);
  });

  it('handles date formatting gracefully for invalid dates', () => {
    const runs = [makeRun({ id: 'r1', periodStart: 'not-a-date', periodEnd: 'also-not' })];
    // Should render without crashing
    const { container } = render(<PeriodTimeline runs={runs} />);
    expect(container).toBeDefined();
  });
});
