import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchRateBadge } from '../MatchRateBadge';

describe('MatchRateBadge', () => {
  it('displays match rate as percentage', () => {
    render(<MatchRateBadge matchRate="0.9500" />);
    expect(screen.getByText('95.00%')).toBeInTheDocument();
  });

  it('shows success styling for rate >= 99%', () => {
    const { container } = render(<MatchRateBadge matchRate="0.9950" />);
    const badge = container.querySelector('[class*="text-success"]');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('99.50%')).toBeInTheDocument();
  });

  it('shows warning styling for rate 95-99%', () => {
    const { container } = render(<MatchRateBadge matchRate="0.9600" />);
    const badge = container.querySelector('[class*="text-warning"]');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('96.00%')).toBeInTheDocument();
  });

  it('shows destructive styling for rate < 95%', () => {
    const { container } = render(<MatchRateBadge matchRate="0.8000" />);
    const badge = container.querySelector('[class*="text-destructive"]');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('80.00%')).toBeInTheDocument();
  });

  it('handles NaN match rate', () => {
    render(<MatchRateBadge matchRate="invalid" />);
    expect(screen.getByText('0.00%')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(
      <MatchRateBadge matchRate="0.9900" className="custom-class" />
    );
    const badge = container.firstChild;
    expect(badge).toHaveClass('custom-class');
  });
});
