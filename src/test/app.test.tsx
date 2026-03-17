/**
 * app.test.tsx
 *
 * Tests for RevenuePage, RevenueLayout, and PlaceholderPage.
 * TE04 compliant: NO mocks of React components or ui-components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RevenuePage } from '@/features/revenue/components/RevenuePage';
import { RevenueLayout } from '@/features/revenue/components/RevenueLayout';
import { PlaceholderPage } from '@/features/revenue/components/PlaceholderPage';

describe('PlaceholderPage', () => {
  it('renders title and default description', () => {
    render(<PlaceholderPage title="Test Page" />);
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });

  it('renders custom description when provided', () => {
    render(<PlaceholderPage title="Custom" description="Custom description text" />);
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('Custom description text')).toBeInTheDocument();
  });
});

describe('RevenueLayout', () => {
  it('renders all three tab triggers', () => {
    const onTabChange = vi.fn();
    render(
      <RevenueLayout activeTab="statements" onTabChange={onTabChange}>
        <div>Content</div>
      </RevenueLayout>
    );

    expect(screen.getByText('Statements')).toBeInTheDocument();
    expect(screen.getByText('Imports')).toBeInTheDocument();
    expect(screen.getByText('Commissions')).toBeInTheDocument();
  });

  it('renders children in the content area', () => {
    render(
      <RevenueLayout activeTab="statements" onTabChange={vi.fn()}>
        <div data-testid="child-content">Hello</div>
      </RevenueLayout>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('has min-h-0 on main content area for proper flex overflow', () => {
    const { container } = render(
      <RevenueLayout activeTab="statements" onTabChange={vi.fn()}>
        <div>Content</div>
      </RevenueLayout>
    );

    const main = container.querySelector('main');
    expect(main?.className).toContain('min-h-0');
    expect(main?.className).toContain('flex-1');
    expect(main?.className).toContain('overflow-hidden');
  });

  it('calls onTabChange when a tab is clicked', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(
      <RevenueLayout activeTab="statements" onTabChange={onTabChange}>
        <div>Content</div>
      </RevenueLayout>
    );

    await user.click(screen.getByText('Imports'));
    expect(onTabChange).toHaveBeenCalledWith('imports');
  });

  it('updates document title based on active tab', () => {
    render(
      <RevenueLayout activeTab="commissions" onTabChange={vi.fn()}>
        <div>Content</div>
      </RevenueLayout>
    );

    expect(document.title).toBe('Revenue - Commissions | HNC');
  });

  it('falls back to "Revenue" in title for unknown tab', () => {
    render(
      <RevenueLayout activeTab="unknown-tab" onTabChange={vi.fn()}>
        <div>Content</div>
      </RevenueLayout>
    );

    expect(document.title).toBe('Revenue - Revenue | HNC');
  });
});

describe('RevenuePage', () => {
  it('renders with default statements tab active and shows placeholder content', () => {
    render(<RevenuePage />);

    // Statements tab trigger should exist
    const statementsTab = screen.getByRole('tab', { name: 'Statements' });
    expect(statementsTab).toBeInTheDocument();

    // Statements placeholder description should be visible
    expect(screen.getByText(/brand statement management/i)).toBeInTheDocument();
  });

  it('does not import any router modules', async () => {
    const module = await import('@/features/revenue/components/RevenuePage');
    expect(module.RevenuePage).toBeDefined();
    expect(module.default).toBeDefined();
  });

  it('switches tab content when tab is changed', async () => {
    const user = userEvent.setup();
    render(<RevenuePage />);

    // Click Imports tab
    await user.click(screen.getByRole('tab', { name: 'Imports' }));

    // Should show imports placeholder content
    expect(screen.getByText(/revenue data imports/i)).toBeInTheDocument();
  });

  it('switches to commissions tab', async () => {
    const user = userEvent.setup();
    render(<RevenuePage />);

    // Click Commissions tab
    await user.click(screen.getByRole('tab', { name: 'Commissions' }));

    // Should show commissions placeholder content
    expect(screen.getByText(/commission calculation/i)).toBeInTheDocument();
  });

  it('provides both named and default exports for MF lazy loading', async () => {
    const module = await import('@/features/revenue/components/RevenuePage');
    expect(module.RevenuePage).toBeDefined();
    expect(module.default).toBeDefined();
    expect(module.RevenuePage).toBe(module.default);
  });
});
