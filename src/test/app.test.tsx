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
  it('renders tab navigation with all three tabs', () => {
    render(<RevenuePage />);

    expect(screen.getByRole('tab', { name: 'Statements' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Imports' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Commissions' })).toBeInTheDocument();
  });

  it('renders statements content by default (error boundary catches missing providers)', () => {
    render(<RevenuePage />);

    // Without QueryClient/Auth providers, BrandDashboard hits error boundary
    // The fallback text should appear
    expect(screen.getByText('Statements unavailable')).toBeInTheDocument();
  });

  it('switches to imports tab', async () => {
    const user = userEvent.setup();
    render(<RevenuePage />);

    await user.click(screen.getByRole('tab', { name: 'Imports' }));
    expect(screen.getByText(/revenue data imports/i)).toBeInTheDocument();
  });

  it('switches to commissions tab (shows sub-tabs)', async () => {
    const user = userEvent.setup();
    render(<RevenuePage />);

    await user.click(screen.getByRole('tab', { name: 'Commissions' }));

    // Commission sub-tabs should appear
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Summaries')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
  });

  it('provides both named and default exports for MF lazy loading', async () => {
    const module = await import('@/features/revenue/components/RevenuePage');
    expect(module.RevenuePage).toBeDefined();
    expect(module.default).toBeDefined();
    expect(module.RevenuePage).toBe(module.default);
  });
});
