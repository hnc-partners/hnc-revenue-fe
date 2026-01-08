import { createFileRoute } from '@tanstack/react-router';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

export const Route = createFileRoute('/')({
  component: HomePage,
});

/**
 * Home Page / Dashboard
 *
 * The main landing page after authentication.
 * Protected route - redirects to login if not authenticated.
 */
function HomePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <Layout>
        <div className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Welcome back, {user?.username}
              </p>
            </div>

            {/* Dashboard Content */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Example Card 1 */}
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-medium text-card-foreground">
                  Quick Stats
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your activity overview
                </p>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-brand">--</p>
                  <p className="text-xs text-muted-foreground">Items today</p>
                </div>
              </div>

              {/* Example Card 2 */}
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-medium text-card-foreground">
                  Recent Activity
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Latest updates
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No recent activity
                  </p>
                </div>
              </div>

              {/* Example Card 3 */}
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-medium text-card-foreground">
                  Quick Actions
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Common tasks
                </p>
                <div className="mt-4 space-y-2">
                  <button className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90 transition-colors">
                    Get Started
                  </button>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="mt-8 rounded-lg border bg-card p-6">
              <h2 className="text-lg font-medium text-card-foreground">
                Template Information
              </h2>
              <div className="mt-4 prose prose-sm max-w-none text-muted-foreground">
                <p>
                  This is the HNC Frontend Template. It includes:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>React 19 with TypeScript</li>
                  <li>TanStack Router for file-based routing</li>
                  <li>TanStack Query for data fetching</li>
                  <li>Tailwind CSS with HNC design tokens</li>
                  <li>Authentication context with protected routes</li>
                </ul>
                <p className="mt-4">
                  Your role: <span className="font-medium">{user?.role}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
