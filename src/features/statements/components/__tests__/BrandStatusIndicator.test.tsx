import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandStatusIndicator } from '../BrandStatusIndicator';
import type { BrandHealth } from '../../types';

describe('BrandStatusIndicator', () => {
  const healthStates: { health: BrandHealth; label: string }[] = [
    { health: 'healthy', label: 'On Track' },
    { health: 'warning', label: 'Overdue' },
    { health: 'critical', label: 'Failed' },
    { health: 'unknown', label: 'Unknown' },
  ];

  it.each(healthStates)(
    'renders "$label" for health=$health',
    ({ health, label }) => {
      render(<BrandStatusIndicator health={health} />);
      // Both visible label + sr-only text exist
      const elements = screen.getAllByText(label);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    }
  );

  it('hides visible label when showLabel is false', () => {
    render(<BrandStatusIndicator health="healthy" showLabel={false} />);
    // sr-only text still present for accessibility
    expect(screen.getByText('On Track')).toBeInTheDocument();
    // But only the sr-only one (no visible label span with text-xs)
    const srOnly = screen.getByText('On Track');
    expect(srOnly.className).toContain('sr-only');
  });

  it('shows visible label when showLabel is true (default)', () => {
    render(<BrandStatusIndicator health="warning" />);
    const labels = screen.getAllByText('Overdue');
    // One visible + one sr-only
    expect(labels.length).toBe(2);
  });

  it('renders dot indicator', () => {
    const { container } = render(<BrandStatusIndicator health="critical" />);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
    expect(dot?.className).toContain('rounded-full');
  });

  it('applies custom className', () => {
    const { container } = render(
      <BrandStatusIndicator health="healthy" className="my-custom-class" />
    );
    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});
