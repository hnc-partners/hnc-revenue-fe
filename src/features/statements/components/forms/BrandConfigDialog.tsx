/**
 * BrandConfigDialog.tsx
 *
 * Dialog/modal wrapper for brand configuration create/edit.
 * Replaces BrandConfigPage — keeps operator on the dashboard.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Button,
  toast,
  TOAST_MESSAGES,
} from '@hnc-partners/ui-components';
import {
  useBrandConfig,
  useCreateBrand,
  useUpdateBrand,
} from '../../api';
import { BrandConfigForm } from './BrandConfigForm';
import type { BrandConfigFormData } from './BrandConfigForm';
import type { RMCreateBrandConfigDto, RMUpdateBrandConfigDto } from '../../types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BrandConfigDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Called to close the dialog */
  onClose: () => void;
  /** Brand code for edit mode; undefined/absent for create mode */
  brandCode?: string;
}

// ---------------------------------------------------------------------------
// Helpers (migrated from BrandConfigPage)
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
// Loading skeleton for dialog content
// ---------------------------------------------------------------------------

function FormSkeleton() {
  return (
    <div className="space-y-6">
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

export function BrandConfigDialog({ isOpen, onClose, brandCode }: BrandConfigDialogProps) {
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
          onClose();
        },
        onError: (err: Error) => {
          toast.error(TOAST_MESSAGES.UPDATE_ERROR('brand config', err.message));
        },
      });
    } else {
      createMutation.mutate(toCreateDto(data), {
        onSuccess: () => {
          toast.success(TOAST_MESSAGES.CREATE_SUCCESS('Brand config'));
          onClose();
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

  // Determine dialog title
  const title = isEdit
    ? `Edit ${brand?.brandName ?? brandCode}`
    : 'New Brand';

  // Render dialog content based on state
  let content: React.ReactNode;

  if (isEdit && isLoading) {
    content = <FormSkeleton />;
  } else if (isEdit && error) {
    content = (
      <div className="flex flex-col items-center justify-center py-8 text-center">
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
    );
  } else {
    content = (
      <BrandConfigForm
        brand={isEdit ? brand : undefined}
        isSubmitting={isMutating}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
