/**
 * BatchStatusBadge.test.tsx
 *
 * TE04 compliant: No mocks needed — pure presentational component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BatchStatusBadge } from '../BatchStatusBadge';
import type { ImportBatchStatus } from '../../types';

describe('BatchStatusBadge', () => {
  const statuses: { status: ImportBatchStatus; label: string }[] = [
    { status: 'pending', label: 'Pending' },
    { status: 'validating', label: 'Validating' },
    { status: 'processing', label: 'Processing' },
    { status: 'processed', label: 'Processed' },
    { status: 'failed', label: 'Failed' },
    { status: 'rolled_back', label: 'Rolled Back' },
  ];

  it.each(statuses)(
    'renders "$label" for status=$status',
    ({ status, label }) => {
      render(<BatchStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  );

  it('falls back to raw status text for unknown status', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<BatchStatusBadge status={'unknown_status' as any} />);
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });
});
