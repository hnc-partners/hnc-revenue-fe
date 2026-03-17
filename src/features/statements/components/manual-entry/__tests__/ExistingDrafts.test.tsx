/**
 * ExistingDrafts.test.tsx
 *
 * TE04 compliant: No mocks needed (pure presentational component).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExistingDrafts } from '../ExistingDrafts';
import type { RMManualEntryBatch } from '../../../types/manual-entry';

function makeBatch(
  overrides: Partial<RMManualEntryBatch> = {}
): RMManualEntryBatch {
  return {
    id: 'batch-1',
    brandConfigId: '1',
    brandCode: 'test-brand',
    brandName: 'Test Brand',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    status: 'draft',
    lineCount: 5,
    submittedAt: null,
    submittedBy: null,
    processedAt: null,
    errorMessage: null,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    createdBy: null,
    ...overrides,
  };
}

describe('ExistingDrafts', () => {
  it('renders nothing when batches array is empty', () => {
    const { container } = render(<ExistingDrafts batches={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders batch count badge', () => {
    render(<ExistingDrafts batches={[makeBatch()]} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Existing Entries')).toBeInTheDocument();
  });

  it('renders status badges with correct labels', () => {
    render(
      <ExistingDrafts
        batches={[
          makeBatch({ id: '1', status: 'draft' }),
          makeBatch({ id: '2', status: 'submitted' }),
          makeBatch({ id: '3', status: 'processed' }),
          makeBatch({ id: '4', status: 'failed' }),
        ]}
      />
    );
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('Processed')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('renders line count', () => {
    render(<ExistingDrafts batches={[makeBatch({ lineCount: 12 })]} />);
    expect(screen.getByText(/12 lines/)).toBeInTheDocument();
  });

  it('renders submitted date when available', () => {
    render(
      <ExistingDrafts
        batches={[makeBatch({ submittedAt: '2026-02-01T10:00:00Z' })]}
      />
    );
    expect(screen.getByText(/submitted/i)).toBeInTheDocument();
  });

  it('renders error message when present', () => {
    render(
      <ExistingDrafts
        batches={[makeBatch({ errorMessage: 'Validation failed' })]}
      />
    );
    expect(screen.getByText('Validation failed')).toBeInTheDocument();
  });

  it('renders period date range', () => {
    render(
      <ExistingDrafts
        batches={[makeBatch({ periodStart: '2026-03-01', periodEnd: '2026-03-31' })]}
      />
    );
    // Date formatted as "Mar 1, 2026 — Mar 31, 2026" or similar
    expect(screen.getByText(/mar/i)).toBeInTheDocument();
  });
});
