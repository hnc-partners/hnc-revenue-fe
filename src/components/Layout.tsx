import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

interface LayoutProps {
  /**
   * The page content to render inside the layout.
   */
  children: ReactNode;
  /**
   * Navigation items for the header.
   * Defaults to Dashboard only.
   */
  navItems?: Array<{ label: string; to: string }>;
  /**
   * Application name to display in the header.
   */
  appName?: string;
}

/**
 * Layout
 *
 * Standard page layout with AppHeader and content area.
 * Provides consistent structure across all authenticated pages.
 */
export function Layout({
  children,
  navItems,
  appName,
}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader navItems={navItems} appName={appName} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
