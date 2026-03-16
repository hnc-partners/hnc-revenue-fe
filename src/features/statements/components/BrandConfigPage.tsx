/**
 * BrandConfigPage.tsx
 *
 * Page wrapper for brand configuration create/edit.
 * Loads brand data for edit mode, shows breadcrumb back to dashboard.
 */

import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import {
  Button,
  Skeleton,
  toast,
  TOAST_MESSAGES,
} from '@hnc-partners/ui-components';
import {
  useBrandConfig,
  useCreateBrand,
  useUpdateBrand,
} from '../api';
import { BrandConfigForm } from './BrandConfigForm';
import type { BrandConfigFormData } from './BrandConfigForm';
import type { RMCreateBrandConfigDto, RMUpdateBrandConfigDto } from '../types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BrandConfigPageProps {
  /** Brand code for edit mode; undefined for create mode */
  brandCode?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toCreateDto(data: BrandConfigFormData): RMCreateBrandConfigDto {
  const dto: RMCreateBrandConfigDto = {
    brandId: data.brandId,
    brandCode: data.brandCode,
    brandName: data.brandName,
    acquisitionMode: data.acquisitionMode,
    granularity: data.granularity,
    enabled: data.enabled,
    autoNotify: data.autoNotify,
    maxBackfillMonths: data.maxBackfillMonths,
  };

  if (data.scheduleCron) dto.scheduleCron = data.scheduleCron;
  if (data.portalUrl) dto.portalUrl = data.portalUrl;
  if (data.credentialsEnv) dto.credentialsEnv = data.credentialsEnv;
  if (data.currencyCode) dto.currencyCode = data.currencyCode;
  if (data.shareTypes && data.shareTypes.length > 0) dto.shareTypes = data.shareTypes;

  return dto;
}

function toUpdateDto(data: BrandConfigFormData): RMUpdateBrandConfigDto {
  const dto: RMUpdateBrandConfigDto = {
    brandName: data.brandName,
    acquisitionMode: data.acquisitionMode,
    granularity: data.granularity,
    enabled: data.enabled,
    autoNotify: data.autoNotify,
    maxBackfillMonths: data.maxBackfillMonths,
    scheduleCron: data.scheduleCron || null,
    portalUrl: data.portalUrl || null,
    credentialsEnv: data.credentialsEnv || null,
    currencyCode: data.currencyCode || undefined,
    shareTypes: data.shareTypes,
  };
  return dto;
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function FormSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Skeleton className="h-6 w-40" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BrandConfigPage({ brandCode }: BrandConfigPageProps) {
  const navigate = useNavigate();
  const isEdit = !!brandCode;

  // Fetch existing brand config for edit mode
  const {
    data: brand,
    isLoading,
    error,
    refetch,
  } = useBrandConfig(brandCode ?? '');

  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand(brandCode ?? '');

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (data: BrandConfigFormData) => {
    if (isEdit) {
      updateMutation.mutate(toUpdateDto(data), {
        onSuccess: () => {
          toast.success(TOAST_MESSAGES.UPDATE_SUCCESS('Brand config'));
          navigate({ to: '/revenue/statements' });
        },
        onError: (err: Error) => {
          toast.error(TOAST_MESSAGES.UPDATE_ERROR('brand config', err.message));
        },
      });
    } else {
      createMutation.mutate(toCreateDto(data), {
        onSuccess: () => {
          toast.success(TOAST_MESSAGES.CREATE_SUCCESS('Brand config'));
          navigate({ to: '/revenue/statements' });
        },
        onError: (err: Error) => {
          const message = err.message;
          if (message.includes('already exists')) {
            toast.error(TOAST_MESSAGES.DUPLICATE_NAME('brand'));
          } else {
            toast.error(TOAST_MESSAGES.CREATE_ERROR('brand config', message));
          }
        },
      });
    }
  };

  const handleCancel = () => {
    navigate({ to: '/revenue/statements' });
  };

  // Loading state (edit mode only)
  if (isEdit && isLoading) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/revenue/statements">
              <Button variant="ghost" size="icon" aria-label="Back to dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Skeleton className="h-7 w-48" />
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
          <FormSkeleton />
        </div>
      </div>
    );
  }

  // Error state (edit mode only)
  if (isEdit && error) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/revenue/statements">
              <Button variant="ghost" size="icon" aria-label="Back to dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-foreground">Edit Brand</h1>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="text-lg font-medium text-foreground mb-1">
              Something went wrong
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Could not load brand configuration. Please try again.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/revenue/statements">
            <Button variant="ghost" size="icon" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-foreground">
            {isEdit ? `Edit ${brand?.brandName ?? brandCode}` : 'New Brand'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
        <div className="max-w-2xl">
          <BrandConfigForm
            brand={isEdit ? brand : undefined}
            isSubmitting={isMutating}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
