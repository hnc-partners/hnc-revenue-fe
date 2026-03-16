/**
 * BrandDashboard.tsx
 *
 * Main statement management dashboard showing brand cards in a responsive grid.
 * Includes global service status indicator and pause/resume controls.
 */

import { Link } from '@tanstack/react-router';
import { Button, Skeleton } from '@hnc-partners/ui-components';
import { FileText, Plus } from 'lucide-react';
import { useStatementBrands } from '../api';
import { ServiceStatusBar } from './ServiceStatusBar';
import { BrandCard } from './BrandCard';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-1">
        No Brands Configured
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        No brands have been set up for statement acquisition yet. Configure brands in the Report Management service to get started.
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-destructive/10 p-3 mb-4">
        <FileText className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">
        Something went wrong
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {message}
      </p>
      <Button variant="outline" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}

export function BrandDashboard() {
  const { data: brands, isLoading, error, refetch } = useStatementBrands();

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <ErrorState
          message="Could not load brand data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1 className="text-xl font-semibold text-foreground">Statements</h1>
          <div className="flex items-center gap-3">
            <ServiceStatusBar />
            <Link to="/revenue/statements/config/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Brand
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
        {!brands || brands.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <BrandCard key={brand.brandCode} brand={brand} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
