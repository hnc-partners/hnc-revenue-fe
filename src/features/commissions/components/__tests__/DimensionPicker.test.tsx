import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DimensionPicker } from '../DimensionPicker';

describe('DimensionPicker', () => {
  it('renders all dimension tabs', () => {
    render(<DimensionPicker value="contact" onChange={vi.fn()} />);

    expect(screen.getByText('By Contact')).toBeInTheDocument();
    expect(screen.getByText('By Gaming Account')).toBeInTheDocument();
    expect(screen.getByText('By Brand')).toBeInTheDocument();
    expect(screen.getByText('By Category')).toBeInTheDocument();
    expect(screen.getByText('By Deal Type')).toBeInTheDocument();
  });

  it('calls onChange when a tab is clicked', async () => {
    const onChange = vi.fn();
    render(<DimensionPicker value="contact" onChange={onChange} />);

    const user = userEvent.setup();
    await user.click(screen.getByText('By Brand'));

    expect(onChange).toHaveBeenCalledWith('brand');
  });

  it('highlights the selected dimension', () => {
    render(<DimensionPicker value="ga" onChange={vi.fn()} />);

    const gaTab = screen.getByText('By Gaming Account').closest('button');
    expect(gaTab).toHaveAttribute('data-state', 'active');
  });
});
