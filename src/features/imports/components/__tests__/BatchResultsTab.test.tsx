/**
 * BatchResultsTab.test.tsx
 *
 * TE04 compliant: No mocks needed — pure presentational component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BatchResultsTab } from '../BatchResultsTab';
import type { ImportBatchDetail } from '../../types';

function makeBatch(overrides: Partial<ImportBatchDetail> = {}): ImportBatchDetail {
  return {
    id: 'batch-1',
    brandId: 'brand-uuid',
    brandName: 'Test Brand',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    granularity: 'monthly',
    status: 'processed',
    fileCount: 2,
    rowCount: 500,
    createdBy: 'admin',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T12:00:00Z',
    processingStartedAt: '2026-01-15T11:00:00Z',
    processingCompletedAt: '2026-01-15T11:00:30Z',
    validationErrors: null,
    files: [],
    ...overrides,
  };
}

describe('BatchResultsTab', () => {
  it('renders "Not yet processed" for pending batches', () => {
    render(<BatchResultsTab batch={makeBatch({ status: 'pending' })} />);
    expect(screen.getByText('Not yet processed')).toBeInTheDocument();
    expect(screen.getByText(/processing results will appear/i)).toBeInTheDocument();
  });

  it('renders "Not yet processed" for validating batches', () => {
    render(<BatchResultsTab batch={makeBatch({ status: 'validating' })} />);
    expect(screen.getByText('Not yet processed')).toBeInTheDocument();
  });

  it('renders stats cards for processed batches', () => {
    render(
      <BatchResultsTab
        batch={makeBatch({
          status: 'processed',
          rowCount: 1500,
        })}
      />
    );
    expect(screen.getByText('Revenue Records Created')).toBeInTheDocument();
    expect(screen.getByText('Processing Duration')).toBeInTheDocument();
  });

  it('renders "No validation issues" for processed batch with no errors', () => {
    render(
      <BatchResultsTab
        batch={makeBatch({ status: 'processed', validationErrors: [] })}
      />
    );
    expect(screen.getByText(/no validation issues/i)).toBeInTheDocument();
  });

  it('renders validation issues table for failed batch', () => {
    render(
      <BatchResultsTab
        batch={makeBatch({
          status: 'failed',
          validationErrors: [
            {
              type: 'MISSING_FIELD',
              severity: 'error',
              message: 'Required field missing',
              brandPlayerId: 'player-1',
            },
            {
              type: 'INVALID_VALUE',
              severity: 'warning',
              message: 'Invalid amount',
            },
          ],
        })}
      />
    );
    expect(screen.getByText(/processing failed with 2 validation issues/i)).toBeInTheDocument();
    expect(screen.getByText('MISSING_FIELD')).toBeInTheDocument();
    expect(screen.getByText('Required field missing')).toBeInTheDocument();
    expect(screen.getByText('player-1')).toBeInTheDocument();
    expect(screen.getByText('INVALID_VALUE')).toBeInTheDocument();
    expect(screen.getByText('Invalid amount')).toBeInTheDocument();
  });

  it('renders issue count text', () => {
    render(
      <BatchResultsTab
        batch={makeBatch({
          status: 'failed',
          validationErrors: [
            { type: 'ERR', severity: 'error', message: 'Error 1' },
          ],
        })}
      />
    );
    expect(screen.getByText('1 issue')).toBeInTheDocument();
  });

  it('renders "Validation Issues" heading for processed batch', () => {
    render(<BatchResultsTab batch={makeBatch({ status: 'processed' })} />);
    expect(screen.getByText('Validation Issues')).toBeInTheDocument();
  });
});
