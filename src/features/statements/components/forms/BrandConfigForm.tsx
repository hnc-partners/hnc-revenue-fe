/**
 * BrandConfigForm.tsx
 *
 * React Hook Form + Zod form for creating and editing brand configurations.
 * Dynamic fields based on acquisitionMode (automated_download, manual_input, manual_download).
 */

import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Input,
  Label,
  Switch,
  Spinner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@hnc-partners/ui-components';
import { Plus, Trash2 } from 'lucide-react';
import type { RMBrandConfigWithActivity } from '../../types';

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const shareTypeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
});

const brandConfigSchema = z
  .object({
    brandId: z.string().min(1, 'Brand ID is required'),
    brandCode: z
      .string()
      .min(1, 'Brand code is required')
      .max(50, 'Brand code must be 50 characters or less')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Brand code must be lowercase, hyphens only (e.g. "my-brand")'
      ),
    brandName: z.string().min(1, 'Brand name is required').max(100),
    acquisitionMode: z.enum(['automated_download', 'manual_download', 'manual_input'], {
      errorMap: () => ({ message: 'Please select an acquisition mode' }),
    }),
    granularity: z.enum(['daily', 'weekly', 'monthly'], {
      errorMap: () => ({ message: 'Please select a granularity' }),
    }),
    scheduleCron: z.string(),
    portalUrl: z.string(),
    credentialsEnv: z.string(),
    currencyCode: z.string(),
    shareTypes: z.array(shareTypeSchema),
    maxBackfillMonths: z.number().int().min(0),
    enabled: z.boolean(),
    autoNotify: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.acquisitionMode === 'automated_download') {
      if (!data.portalUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Portal URL is required for automated download',
          path: ['portalUrl'],
        });
      }
      if (!data.credentialsEnv) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Credentials env variable is required for automated download',
          path: ['credentialsEnv'],
        });
      }
    }

    if (data.acquisitionMode === 'manual_input') {
      if (!data.shareTypes || data.shareTypes.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one share type is required for manual input',
          path: ['shareTypes'],
        });
      }
      if (!data.currencyCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Currency code is required for manual input',
          path: ['currencyCode'],
        });
      } else if (!/^[A-Z]{3}$/.test(data.currencyCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Currency code must be 3 uppercase letters (e.g. USD)',
          path: ['currencyCode'],
        });
      }
    }
  });

export type BrandConfigFormData = z.infer<typeof brandConfigSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BrandConfigFormProps {
  /** Existing brand data for edit mode */
  brand?: RMBrandConfigWithActivity;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Called with validated form data */
  onSubmit: (data: BrandConfigFormData) => void;
  /** Called when user cancels */
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BrandConfigForm({
  brand,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: BrandConfigFormProps) {
  const isEdit = !!brand;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm<BrandConfigFormData>({
    resolver: zodResolver(brandConfigSchema),
    defaultValues: {
      brandId: brand?.brandId ?? '',
      brandCode: brand?.brandCode ?? '',
      brandName: brand?.brandName ?? '',
      acquisitionMode: brand?.acquisitionMode ?? 'manual_download',
      granularity: brand?.granularity ?? 'monthly',
      scheduleCron: brand?.scheduleCron ?? '',
      portalUrl: brand?.portalUrl ?? '',
      credentialsEnv: brand?.credentialsEnv ?? '',
      currencyCode: brand?.currencyCode ?? '',
      shareTypes: brand?.shareTypes ?? [],
      maxBackfillMonths: brand?.maxBackfillMonths ?? 3,
      enabled: brand?.enabled ?? true,
      autoNotify: brand?.autoNotify ?? false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'shareTypes',
  });

  const acquisitionMode = watch('acquisitionMode');

  // Reset form when brand data changes (e.g. refetch)
  useEffect(() => {
    if (brand) {
      reset({
        brandId: brand.brandId,
        brandCode: brand.brandCode,
        brandName: brand.brandName,
        acquisitionMode: brand.acquisitionMode,
        granularity: brand.granularity,
        scheduleCron: brand.scheduleCron ?? '',
        portalUrl: brand.portalUrl ?? '',
        credentialsEnv: brand.credentialsEnv ?? '',
        currencyCode: brand.currencyCode ?? '',
        shareTypes: brand.shareTypes ?? [],
        maxBackfillMonths: brand.maxBackfillMonths ?? 3,
        enabled: brand.enabled,
        autoNotify: brand.autoNotify,
      });
    }
  }, [brand, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* --- Basic Info Section --- */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-4">Basic Information</h3>
        <div className="space-y-4">
          {/* Brand ID */}
          <div className="grid w-full gap-1.5">
            <Label htmlFor="brandId">
              Brand ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="brandId"
              placeholder="UUID of the brand"
              {...register('brandId')}
              disabled={isEdit}
            />
            {errors.brandId && (
              <p className="text-sm text-destructive" role="alert">{errors.brandId.message}</p>
            )}
            {isEdit && (
              <p className="text-xs text-muted-foreground">Brand ID cannot be changed after creation.</p>
            )}
          </div>

          {/* Brand Code */}
          <div className="grid w-full gap-1.5">
            <Label htmlFor="brandCode">
              Brand Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="brandCode"
              placeholder="e.g. my-brand"
              {...register('brandCode')}
              disabled={isEdit}
            />
            {errors.brandCode && (
              <p className="text-sm text-destructive" role="alert">{errors.brandCode.message}</p>
            )}
            {isEdit && (
              <p className="text-xs text-muted-foreground">Brand code cannot be changed after creation.</p>
            )}
          </div>

          {/* Brand Name */}
          <div className="grid w-full gap-1.5">
            <Label htmlFor="brandName">
              Brand Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="brandName"
              placeholder="Human-readable brand name"
              {...register('brandName')}
            />
            {errors.brandName && (
              <p className="text-sm text-destructive" role="alert">{errors.brandName.message}</p>
            )}
          </div>

          {/* Acquisition Mode */}
          <div className="grid w-full gap-1.5">
            <Label htmlFor="acquisitionMode">
              Acquisition Mode <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="acquisitionMode"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select acquisition mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automated_download">Automated Download</SelectItem>
                    <SelectItem value="manual_download">Manual Download</SelectItem>
                    <SelectItem value="manual_input">Manual Input</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.acquisitionMode && (
              <p className="text-sm text-destructive" role="alert">{errors.acquisitionMode.message}</p>
            )}
          </div>

          {/* Granularity */}
          <div className="grid w-full gap-1.5">
            <Label htmlFor="granularity">
              Granularity <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="granularity"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
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
            {errors.granularity && (
              <p className="text-sm text-destructive" role="alert">{errors.granularity.message}</p>
            )}
          </div>

          {/* Schedule Cron */}
          <div className="grid w-full gap-1.5">
            <Label htmlFor="scheduleCron">Schedule (Cron Expression)</Label>
            <Input
              id="scheduleCron"
              placeholder="e.g. 0 6 * * *"
              {...register('scheduleCron')}
            />
            <p className="text-xs text-muted-foreground">
              Optional. Defines when automated acquisition runs.
            </p>
          </div>

          {/* Max Backfill Months */}
          <div className="grid w-full gap-1.5">
            <Label htmlFor="maxBackfillMonths">Max Backfill Months</Label>
            <Input
              id="maxBackfillMonths"
              type="number"
              min={0}
              {...register('maxBackfillMonths', { valueAsNumber: true })}
            />
            {errors.maxBackfillMonths && (
              <p className="text-sm text-destructive" role="alert">{errors.maxBackfillMonths.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* --- Automated Download Fields --- */}
      {acquisitionMode === 'automated_download' && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4">
            Automated Download Settings
          </h3>
          <div className="space-y-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="portalUrl">
                Portal URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="portalUrl"
                type="url"
                placeholder="https://portal.example.com"
                {...register('portalUrl')}
              />
              {errors.portalUrl && (
                <p className="text-sm text-destructive" role="alert">{errors.portalUrl.message}</p>
              )}
            </div>

            <div className="grid w-full gap-1.5">
              <Label htmlFor="credentialsEnv">
                Credentials Env Variable <span className="text-destructive">*</span>
              </Label>
              <Input
                id="credentialsEnv"
                placeholder="e.g. BRAND_PORTAL_CREDS"
                {...register('credentialsEnv')}
              />
              {errors.credentialsEnv && (
                <p className="text-sm text-destructive" role="alert">{errors.credentialsEnv.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Manual Input Fields --- */}
      {acquisitionMode === 'manual_input' && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4">
            Manual Input Settings
          </h3>
          <div className="space-y-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="currencyCode">
                Currency Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="currencyCode"
                placeholder="e.g. USD"
                maxLength={3}
                {...register('currencyCode')}
              />
              {errors.currencyCode && (
                <p className="text-sm text-destructive" role="alert">{errors.currencyCode.message}</p>
              )}
            </div>

            {/* Share Types */}
            <div className="grid w-full gap-1.5">
              <Label>
                Share Types <span className="text-destructive">*</span>
              </Label>
              {errors.shareTypes && !Array.isArray(errors.shareTypes) && (
                <p className="text-sm text-destructive" role="alert">
                  {(errors.shareTypes as { message?: string }).message}
                </p>
              )}
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Code (e.g. GGR)"
                        {...register(`shareTypes.${index}.code`)}
                      />
                      {errors.shareTypes?.[index]?.code && (
                        <p className="text-xs text-destructive mt-1" role="alert">
                          {errors.shareTypes[index].code?.message}
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Name (e.g. Gross Gaming Revenue)"
                        {...register(`shareTypes.${index}.name`)}
                      />
                      {errors.shareTypes?.[index]?.name && (
                        <p className="text-xs text-destructive mt-1" role="alert">
                          {errors.shareTypes[index].name?.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      aria-label={`Remove share type ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ code: '', name: '' })}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Share Type
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Toggles Section --- */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-4">Settings</h3>
        <div className="space-y-4">
          {/* Enabled toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled">Enabled</Label>
              <p className="text-xs text-muted-foreground">
                When disabled, no statement acquisition runs for this brand.
              </p>
            </div>
            <Controller
              control={control}
              name="enabled"
              render={({ field }) => (
                <Switch
                  id="enabled"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Auto-notify toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoNotify">Auto Notify</Label>
              <p className="text-xs text-muted-foreground">
                Automatically send notifications on acquisition failures.
              </p>
            </div>
            <Controller
              control={control}
              name="autoNotify"
              render={({ field }) => (
                <Switch
                  id="autoNotify"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* --- Buttons --- */}
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              {isEdit ? 'Saving...' : 'Creating...'}
            </>
          ) : (
            isEdit ? 'Save Changes' : 'Create Brand'
          )}
        </Button>
      </div>
    </form>
  );
}
