/**
 * BrandConfigForm.tsx
 *
 * Form for adding/editing brand coverage config.
 * Uses react-hook-form + zod for validation.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Spinner,
} from '@hnc-partners/ui-components';
import { toast } from 'sonner';
import { useUpsertBrandConfig } from '../api/useUpsertBrandConfig';
import type { BrandConfigFull, CoverageGranularity, ExpectedFileType } from '../types';

const FILE_TYPE_OPTIONS: { value: ExpectedFileType; label: string }[] = [
  { value: 'commission', label: 'Commission' },
  { value: 'poker_ggr', label: 'Poker GGR' },
  { value: 'casino_ggr', label: 'Casino GGR' },
  { value: 'poker_analysis', label: 'Poker Analysis' },
  { value: 'single', label: 'Single' },
];

const GRANULARITY_OPTIONS: { value: CoverageGranularity; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const brandConfigSchema = z.object({
  brandId: z.string().min(1, 'Brand ID is required'),
  brandCode: z.string().min(1, 'Brand code is required'),
  periodGranularity: z.enum(['daily', 'weekly', 'monthly'], {
    required_error: 'Granularity is required',
  }),
  expectedFileTypes: z
    .array(z.enum(['commission', 'poker_ggr', 'casino_ggr', 'poker_analysis', 'single']))
    .min(1, 'At least one file type is required'),
  active: z.boolean(),
});

type BrandConfigFormValues = z.infer<typeof brandConfigSchema>;

interface BrandConfigFormProps {
  open: boolean;
  onClose: () => void;
  config?: BrandConfigFull; // Pass for edit mode
}

export function BrandConfigForm({ open, onClose, config }: BrandConfigFormProps) {
  const mutation = useUpsertBrandConfig();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<BrandConfigFormValues>({
    resolver: zodResolver(brandConfigSchema),
    defaultValues: config
      ? {
          brandId: config.brandId,
          brandCode: config.brandCode ?? '',
          periodGranularity: config.periodGranularity ?? 'monthly',
          expectedFileTypes: (config.expectedFileTypes ?? []) as ExpectedFileType[],
          active: config.active ?? true,
        }
      : {
          brandId: '',
          brandCode: '',
          periodGranularity: 'monthly',
          expectedFileTypes: [],
          active: true,
        },
  });

  // Reset form when config prop changes (switching between add/edit)
  useEffect(() => {
    if (open) {
      reset(
        config
          ? {
              brandId: config.brandId,
              brandCode: config.brandCode ?? '',
              periodGranularity: config.periodGranularity ?? 'monthly',
              expectedFileTypes: (config.expectedFileTypes ?? []) as ExpectedFileType[],
              active: config.active ?? true,
            }
          : {
              brandId: '',
              brandCode: '',
              periodGranularity: 'monthly',
              expectedFileTypes: [],
              active: true,
            }
      );
    }
  }, [open, config, reset]);

  const selectedFileTypes = watch('expectedFileTypes');

  const toggleFileType = (fileType: ExpectedFileType) => {
    const current = selectedFileTypes ?? [];
    if (current.includes(fileType)) {
      setValue(
        'expectedFileTypes',
        current.filter((ft) => ft !== fileType),
        { shouldValidate: true }
      );
    } else {
      setValue('expectedFileTypes', [...current, fileType], {
        shouldValidate: true,
      });
    }
  };

  const onSubmit = (values: BrandConfigFormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success(
          config ? 'Brand config updated successfully' : 'Brand config created successfully'
        );
        reset();
        onClose();
      },
      onError: () => {
        toast.error('Failed to save brand config. Please try again.');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {config ? 'Edit Brand Config' : 'Add Brand Config'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Brand ID */}
          <div className="grid w-full gap-1.5">
            <Label htmlFor="brandId">
              Brand ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="brandId"
              {...register('brandId')}
              placeholder="e.g., uuid of the brand"
              disabled={!!config} // Cannot change brandId on edit (upsert key)
            />
            {errors.brandId && (
              <p className="text-sm text-destructive">{errors.brandId.message}</p>
            )}
          </div>

          {/* Brand Code */}
          <div className="grid w-full gap-1.5">
            <Label htmlFor="brandCode">
              Brand Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="brandCode"
              {...register('brandCode')}
              placeholder="e.g., BR1"
            />
            {errors.brandCode && (
              <p className="text-sm text-destructive">{errors.brandCode.message}</p>
            )}
          </div>

          {/* Granularity */}
          <div className="grid w-full gap-1.5">
            <Label htmlFor="periodGranularity">
              Granularity <span className="text-destructive">*</span>
            </Label>
            <select
              id="periodGranularity"
              {...register('periodGranularity')}
              className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {GRANULARITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.periodGranularity && (
              <p className="text-sm text-destructive">
                {errors.periodGranularity.message}
              </p>
            )}
          </div>

          {/* Expected File Types (multi-select via checkboxes) */}
          <div className="grid w-full gap-1.5">
            <Label>
              Expected File Types <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {FILE_TYPE_OPTIONS.map((opt) => {
                const isSelected = selectedFileTypes?.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleFileType(opt.value)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      isSelected
                        ? 'border-mf-accent bg-mf-accent/10 text-mf-accent'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {errors.expectedFileTypes && (
              <p className="text-sm text-destructive">
                {errors.expectedFileTypes.message}
              </p>
            )}
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              id="active"
              type="checkbox"
              {...register('active')}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="active">Active</Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : config ? (
                'Save'
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
