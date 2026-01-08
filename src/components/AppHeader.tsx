import { Link, useLocation } from '@tanstack/react-router';
import { LogOut, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  label: string;
  to: string;
}

interface AppHeaderProps {
  /**
   * Navigation items to display in the header.
   * Defaults to just Dashboard if not provided.
   */
  navItems?: NavItem[];
  /**
   * Application name to display in the header.
   */
  appName?: string;
}

/**
 * AppHeader
 *
 * Shared application header with navigation and user menu.
 * Features:
 * - Logo/brand on left
 * - Navigation links in center
 * - User menu on right (username, logout)
 * - Mobile responsive with hamburger menu
 */
export function AppHeader({
  navItems = [{ label: 'Dashboard', to: '/' }],
  appName = 'HNC Platform',
}: AppHeaderProps) {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActiveRoute = (to: string) => {
    return location.pathname === to;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-brand-foreground">
                <span className="text-sm font-bold">H</span>
              </div>
              <span className="hidden font-semibold text-foreground sm:inline-block">
                {appName}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  text-sm font-medium transition-colors
                  ${
                    isActiveRoute(item.to)
                      ? 'text-brand'
                      : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Desktop User Menu */}
            <div className="hidden md:flex md:items-center md:gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{user?.username}</span>
                <span className="text-xs text-muted-foreground">
                  ({user?.role})
                </span>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="
                  inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm
                  text-muted-foreground hover:text-foreground hover:bg-accent
                  transition-colors disabled:opacity-50
                "
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t md:hidden">
            <nav className="flex flex-col py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    block px-2 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isActiveRoute(item.to)
                        ? 'bg-brand/10 text-brand'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }
                  `}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{user?.username}</span>
                  <span className="text-xs">({user?.role})</span>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="
                    flex w-full items-center gap-2 px-2 py-2 rounded-md text-sm
                    text-muted-foreground hover:bg-accent hover:text-foreground
                    transition-colors disabled:opacity-50
                  "
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
