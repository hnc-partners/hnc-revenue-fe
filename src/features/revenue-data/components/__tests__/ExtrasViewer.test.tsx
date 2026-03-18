/**
 * ExtrasViewer.test.tsx
 *
 * TE04 compliant: No mocks needed — pure rendering component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExtrasViewer } from '../ExtrasViewer';

describe('ExtrasViewer', () => {
  it('renders "No extra data" when extras is empty', () => {
    render(<ExtrasViewer extras={{}} />);
    expect(screen.getByText('No extra data')).toBeInTheDocument();
  });

  it('renders primitive string values', () => {
    render(<ExtrasViewer extras={{ playerType: 'VIP' }} />);
    expect(screen.getByText('Player Type')).toBeInTheDocument();
    expect(screen.getByText('VIP')).toBeInTheDocument();
  });

  it('renders numeric values with locale formatting', () => {
    render(<ExtrasViewer extras={{ totalWins: 42 }} />);
    expect(screen.getByText('Total Wins')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders boolean values', () => {
    render(<ExtrasViewer extras={{ isActive: true, isBlocked: false }} />);
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('false')).toBeInTheDocument();
  });

  it('renders null values as "null"', () => {
    render(<ExtrasViewer extras={{ note: null }} />);
    expect(screen.getByText('null')).toBeInTheDocument();
  });

  it('renders empty arrays as "empty array"', () => {
    render(<ExtrasViewer extras={{ tags: [] }} />);
    expect(screen.getByText('empty array')).toBeInTheDocument();
  });

  it('formats camelCase keys to human-friendly labels', () => {
    render(<ExtrasViewer extras={{ camelCaseKey: 'value' }} />);
    expect(screen.getByText('Camel Case Key')).toBeInTheDocument();
  });

  it('formats snake_case keys to human-friendly labels', () => {
    render(<ExtrasViewer extras={{ snake_case_key: 'value' }} />);
    expect(screen.getByText('Snake Case Key')).toBeInTheDocument();
  });

  it('renders nested objects with expandable sections', async () => {
    const user = userEvent.setup();
    render(
      <ExtrasViewer
        extras={{
          breakdown: {
            slots: 100,
            table: 50,
          },
        }}
      />
    );

    // At depth 1, nested objects start expanded (depth < 2)
    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect(screen.getByText('Slots')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();

    // Click to collapse
    await user.click(screen.getByText('2 items'));

    // After collapsing, nested values should be hidden
    expect(screen.queryByText('Slots')).not.toBeInTheDocument();
    expect(screen.queryByText('Table')).not.toBeInTheDocument();

    // Click to expand again
    await user.click(screen.getByText('2 items'));
    expect(screen.getByText('Slots')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();
  });

  it('renders string numbers as formatted numbers', () => {
    render(<ExtrasViewer extras={{ revenue: '1234.56' }} />);
    // The component converts numeric strings to formatted numbers
    expect(screen.getByText(/1.*234/)).toBeInTheDocument();
  });

  it('renders negative numbers with destructive styling', () => {
    const { container } = render(<ExtrasViewer extras={{ loss: -500 }} />);
    const negativeEl = container.querySelector('.text-destructive');
    expect(negativeEl).toBeInTheDocument();
  });

  it('renders multiple top-level entries', () => {
    render(
      <ExtrasViewer
        extras={{
          firstName: 'John',
          lastName: 'Doe',
          age: 30,
        }}
      />
    );
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('renders array items with values', () => {
    render(<ExtrasViewer extras={{ games: ['poker', 'blackjack'] }} />);
    expect(screen.getByText('poker')).toBeInTheDocument();
    expect(screen.getByText('blackjack')).toBeInTheDocument();
  });
});
