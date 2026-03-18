/**
 * CreateBatchStep.tsx
 *
 * Step 1 of the import wizard — Create Batch.
 * Form with brand selector, period dates, and granularity.
 * Uses react-hook-form + Zod validation.
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Spinner,
} from '@hnc-partners/ui-components';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { useBrandConfigs, useCreateBatch } from '../api';
import { ApiError } from '@/features/revenue/api';
import type { ImportBatch, ImportGranularity, BrandConfig } from '../types';

// ---------------------------------------------------------------------------
// Validation Schema
// ---------------------------------------------------------------------------

const createBatchSchema = z
  .object({
    brandId: z.string().min(1, 'Brand is required'),
    periodStart: z.string().min(1, 'Period start date is required'),
    periodEnd: z.string().min(1, 'Period end date is required'),
    periodGranularity: z.enum(['daily', 'weekly', 'monthly'], {
      errorMap: () => ({ message: 'Granularity is required' }),
    }),
  })
  .refine((data) => data.periodEnd >= data.periodStart, {
    message: 'Period end must be on or after period start',
    path: ['periodEnd'],
  });

type CreateBatchFormData = z.infer<typeof createBatchSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CreateBatchStepProps {
  onBatchCreated: (batch: ImportBatch, brandConfig: BrandConfig) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateBatchStep({ onBatchCreated, onCancel }: CreateBatchStepProps) {
  const { data: brands, isLoading: brandsLoading, error: brandsError } = useBrandConfigs();
  const createBatch = useCreateBatch();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateBatchFormData>({
    resolver: zodResolver(createBatchSchema),
    defaultValues: {
      brandId: '',
      periodStart: '',
      periodEnd: '',
      periodGranularity: 'monthly',
    },
  });

  // Watch brandId to update granularity default from config
  const selectedBrandId = watch('brandId');

  useEffect(() => {
    if (selectedBrandId && brands) {
      const brandConfig = brands.find((b) => b.brandId === selectedBrandId);
      if (brandConfig?.periodGranularity) {
        setValue('periodGranularity', brandConfig.periodGranularity);
      }
    }
  }, [selectedBrandId, brands, setValue]);

  const onSubmit = (data: CreateBatchFormData) => {
    const selectedBrand = brands?.find((b) => b.brandId === data.brandId);

    createBatch.mutate(
      {
        brandId: data.brandId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        periodGranularity: data.periodGranularity as ImportGranularity,
      },
      {
        onSuccess: (batch) => {
          toast.success('Batch created successfully');
          if (selectedBrand) {
            onBatchCreated(batch, selectedBrand);
          }
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            toast.error('Batch already exists for this brand and period');
          } else {
            toast.error('Failed to create batch. Please try again.');
          }
          console.error('Create batch error:', error);
        },
      }
    );
  };

  if (brandsLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (brandsError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center" role="alert">
        <div className="rounded-full bg-destructive/10 p-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          Could not load brand configurations
        </h3>
        <p className="text-sm text-muted-foreground">
          Please check your connection and try again.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Brand selector */}
      <div className="grid w-full gap-1.5">
        <Label htmlFor="brandId">Brand</Label>
        <Controller
          control={control}
          name="brandId"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="brandId">
                <SelectValue placeholder="Select a brand" />
              </SelectTrigger>
              <SelectContent>
                {brands?.map((brand) => (
                  <SelectItem key={brand.brandId} value={brand.brandId}>
                    {brand.brandName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.brandId && (
          <p className="text-sm text-destructive">{errors.brandId.message}</p>
        )}
      </div>

      {/* Period dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid w-full gap-1.5">
          <Label htmlFor="periodStart">Period Start</Label>
          <Input
            id="periodStart"
            type="date"
            {...register('periodStart')}
          />
          {errors.periodStart && (
            <p className="text-sm text-destructive">{errors.periodStart.message}</p>
          )}
        </div>

        <div className="grid w-full gap-1.5">
          <Label htmlFor="periodEnd">Period End</Label>
          <Input
            id="periodEnd"
            type="date"
            {...register('periodEnd')}
          />
          {errors.periodEnd && (
            <p className="text-sm text-destructive">{errors.periodEnd.message}</p>
          )}
        </div>
      </div>

      {/* Granularity */}
      <div className="grid w-full gap-1.5">
        <Label htmlFor="periodGranularity">Granularity</Label>
        <Controller
          control={control}
          name="periodGranularity"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="periodGranularity">
                <SelectValue placeholder="Select granularity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.periodGranularity && (
          <p className="text-sm text-destructive">{errors.periodGranularity.message}</p>
        )}
      </div>

      {/* 409 Conflict inline error */}
      {createBatch.isError && createBatch.error instanceof ApiError && createBatch.error.status === 409 && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive font-medium">
            Batch already exists for this brand and period
          </p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createBatch.isPending}>
          {createBatch.isPending ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Creating...
            </>
          ) : (
            'Create Batch'
          )}
        </Button>
      </div>
    </form>
  );
}
