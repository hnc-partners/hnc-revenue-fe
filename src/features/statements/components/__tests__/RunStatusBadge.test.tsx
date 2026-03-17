import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RunStatusBadge } from '../RunStatusBadge';
import type { RunStatus } from '../../types';

describe('RunStatusBadge', () => {
  const statuses: { status: RunStatus; label: string }[] = [
    { status: 'running', label: 'Running' },
    { status: 'success', label: 'Success' },
    { status: 'partial', label: 'Partial' },
    { status: 'failed', label: 'Failed' },
    { status: 'skipped', label: 'Skipped' },
    { status: 'rolled_back', label: 'Rolled Back' },
  ];

  it.each(statuses)(
    'renders "$label" for status=$status',
    ({ status, label }) => {
      render(<RunStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  );

  it('falls back to raw status text for unknown status', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<RunStatusBadge status={'unknown_status' as any} />);
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });
});
