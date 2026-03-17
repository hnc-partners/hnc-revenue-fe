import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AcquisitionModeBadge } from '../AcquisitionModeBadge';
import type { AcquisitionMode } from '../../types';

describe('AcquisitionModeBadge', () => {
  const modes: { mode: AcquisitionMode; label: string }[] = [
    { mode: 'automated_download', label: 'Automated' },
    { mode: 'manual_download', label: 'Manual Upload' },
    { mode: 'manual_input', label: 'Manual Entry' },
  ];

  it.each(modes)(
    'renders "$label" for mode=$mode',
    ({ mode, label }) => {
      render(<AcquisitionModeBadge mode={mode} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  );

  it('renders an icon alongside the label', () => {
    const { container } = render(<AcquisitionModeBadge mode="automated_download" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
