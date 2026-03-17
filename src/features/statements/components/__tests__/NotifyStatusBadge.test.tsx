import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotifyStatusBadge } from '../NotifyStatusBadge';
import type { NotifyStatus } from '../../types';

describe('NotifyStatusBadge', () => {
  const statuses: { status: NotifyStatus; label: string; showRetry: boolean }[] = [
    { status: 'pending', label: 'Pending', showRetry: false },
    { status: 'notified', label: 'Notified', showRetry: false },
    { status: 'failed', label: 'Notify Failed', showRetry: true },
    { status: 'skipped', label: 'Skipped', showRetry: false },
    { status: 'processing_failed', label: 'Processing Failed', showRetry: true },
  ];

  it.each(statuses)(
    'renders "$label" for status=$status',
    ({ status, label }) => {
      render(<NotifyStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  );

  it('shows retry button for failed status when handler provided', () => {
    const onRetry = vi.fn();
    render(
      <NotifyStatusBadge
        status="failed"
        onRetryNotify={onRetry}
      />
    );
    expect(screen.getByRole('button', { name: /retry notification/i })).toBeInTheDocument();
  });

  it('does not show retry button for successful status', () => {
    render(
      <NotifyStatusBadge status="notified" onRetryNotify={vi.fn()} />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onRetryNotify when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <NotifyStatusBadge
        status="failed"
        onRetryNotify={onRetry}
      />
    );

    await user.click(screen.getByRole('button', { name: /retry notification/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('disables retry button when isRetrying is true', () => {
    render(
      <NotifyStatusBadge
        status="processing_failed"
        onRetryNotify={vi.fn()}
        isRetrying
      />
    );
    expect(screen.getByRole('button', { name: /retry notification/i })).toBeDisabled();
  });

  it('falls back to raw status text for unknown status', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<NotifyStatusBadge status={'unknown_notify' as any} />);
    expect(screen.getByText('unknown_notify')).toBeInTheDocument();
  });

  it('does not show retry when no handler provided for failed status', () => {
    render(<NotifyStatusBadge status="failed" />);
    // No retry button when onRetryNotify is not provided
    expect(screen.queryByRole('button', { name: /retry notification/i })).not.toBeInTheDocument();
  });
});
