/**
 * ManualEntryPage.tsx
 *
 * FE-3: Manual Input Form for Statement Management.
 * Allows operators to manually enter statement values for brands
 * with acquisitionMode = 'manual_input'.
 *
 * Workflow:
 * 1. Select brand (or pre-selected via ?brandCode=X)
 * 2. Select period (start/end dates)
 * 3. Dynamic form loads based on brand's shareTypes + gaming accounts
 * 4. Enter metric amounts per gaming account per share type
 * 5. Submit → validates, generates CSV, triggers notify
 *
 * Route: /revenue/statements/manual-entry?brandCode=X
 */

import { useState, useCallback, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Skeleton,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
  TOAST_MESSAGES,
} from '@hnc-partners/ui-components';
import {
  useEntryForm,
  useManualInputBrands,
  useSubmitManualEntry,
  useManualEntryBatches,
  ApiError,
} from '../../api/useManualEntry';
import type {
  RMEntryFormData,
  RMManualEntryLineDto,
  RMManualEntryBatch,
} from '../../types/manual-entry';
import { ExistingDrafts } from './ExistingDrafts';

// ---------------------------------------------------------------------------
// Zod Schema for the period form
// ---------------------------------------------------------------------------

const periodSchema = z
  .object({
    periodStart: z
      .string()
      .min(1, 'Start date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
    periodEnd: z
      .string()
      .min(1, 'End date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  })
  .refine(
    (data) => data.periodStart <= data.periodEnd,
    {
      message: 'Start date must be on or before end date',
      path: ['periodEnd'],
    }
  );

type PeriodFormData = z.infer<typeof periodSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a number as currency-like with grouping */
function formatAmount(value: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currencyCode} ${value.toFixed(2)}`;
  }
}

// ---------------------------------------------------------------------------
// MetricGrid: Dynamic grid of gaming accounts x share types
// ---------------------------------------------------------------------------

interface MetricGridProps {
  formData: RMEntryFormData;
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  errors: Record<string, string>;
}

function MetricGrid({ formData, values, onChange, errors }: MetricGridProps) {
  const { shareTypes, gamingAccounts, currencyCode } = formData;

  // Compute column totals
  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const st of shareTypes) {
      let total = 0;
      for (const ga of gamingAccounts) {
        const key = `${ga.id}_${st.code}`;
        total += values[key] || 0;
      }
      totals[st.code] = total;
    }
    return totals;
  }, [shareTypes, gamingAccounts, values]);

  if (gamingAccounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          No Gaming Accounts
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          This brand has no gaming accounts configured. Add gaming accounts
          before creating manual entries.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3 min-w-[200px]">
              Gaming Account
            </th>
            {shareTypes.map((st) => (
              <th
                key={st.code}
                className="text-right text-xs font-medium uppercase tracking-wider px-4 py-3 min-w-[150px]"
              >
                {st.name}
                <span className="block text-[10px] text-muted-foreground font-normal normal-case">
                  ({currencyCode})
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gamingAccounts.map((ga, idx) => (
            <tr
              key={ga.id}
              className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
            >
              <td className="px-4 py-2">
                <div className="text-sm font-medium text-foreground">
                  {ga.accountName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {ga.externalAccountId}
                </div>
              </td>
              {shareTypes.map((st) => {
                const key = `${ga.id}_${st.code}`;
                const error = errors[key];
                return (
                  <td key={st.code} className="px-4 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={values[key] !== undefined ? values[key] : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onChange(key, val === '' ? 0 : parseFloat(val));
                      }}
                      className={`text-right font-mono tabular-nums h-8 ${
                        error ? 'border-destructive' : ''
                      }`}
                      aria-label={`${st.name} for ${ga.accountName}`}
                    />
                    {error && (
                      <p className="text-xs text-destructive mt-0.5">{error}</p>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-muted/50">
            <td className="px-4 py-2 text-sm font-medium text-foreground">
              Total
            </td>
            {shareTypes.map((st) => (
              <td
                key={st.code}
                className="px-4 py-2 text-right font-mono tabular-nums text-sm font-semibold text-foreground"
              >
                {formatAmount(columnTotals[st.code] || 0, currencyCode)}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ManualEntryPage Component
// ---------------------------------------------------------------------------

interface ManualEntryPageProps {
  /** Pre-selected brand code from route search params */
  initialBrandCode?: string;
}

export function ManualEntryPage({ initialBrandCode }: ManualEntryPageProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [selectedBrandCode, setSelectedBrandCode] = useState<string>(
    initialBrandCode ?? ''
  );
  const [metricValues, setMetricValues] = useState<Record<string, number>>({});
  const [metricErrors, setMetricErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  const { data: manualBrands, isLoading: brandsLoading } =
    useManualInputBrands();
  const {
    data: entryFormData,
    isLoading: formLoading,
    error: formError,
  } = useEntryForm(selectedBrandCode || undefined);
  const { data: existingBatches } = useManualEntryBatches(
    selectedBrandCode || undefined
  );
  const submitMutation = useSubmitManualEntry();

  // ---------------------------------------------------------------------------
  // Period form
  // ---------------------------------------------------------------------------
  const {
    register,
    handleSubmit: handlePeriodSubmit,
    formState: { errors: periodErrors },
    watch,
    reset: resetPeriod,
  } = useForm<PeriodFormData>({
    resolver: zodResolver(periodSchema),
    defaultValues: {
      periodStart: '',
      periodEnd: '',
    },
  });

  const periodStart = watch('periodStart');
  const periodEnd = watch('periodEnd');

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleBrandChange = useCallback(
    (code: string) => {
      setSelectedBrandCode(code);
      setMetricValues({});
      setMetricErrors({});
      setIsSubmitted(false);
      resetPeriod();
    },
    [resetPeriod]
  );

  const handleMetricChange = useCallback((key: string, value: number) => {
    setMetricValues((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field on change
    setMetricErrors((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return prev;
    });
  }, []);

  /** Validate metric amounts and return errors */
  const validateMetrics = useCallback((): Record<string, string> => {
    if (!entryFormData) return {};
    const errors: Record<string, string> = {};

    for (const ga of entryFormData.gamingAccounts) {
      for (const st of entryFormData.shareTypes) {
        const key = `${ga.id}_${st.code}`;
        const val = metricValues[key];
        if (val !== undefined && val !== 0) {
          if (val < -1_000_000_000 || val > 1_000_000_000) {
            errors[key] = 'Amount must be between -1B and +1B';
          }
          if (isNaN(val)) {
            errors[key] = 'Must be a valid number';
          }
        }
      }
    }
    return errors;
  }, [entryFormData, metricValues]);

  /** Build lines from the metric grid */
  const buildLines = useCallback((): RMManualEntryLineDto[] => {
    if (!entryFormData) return [];
    const lines: RMManualEntryLineDto[] = [];

    for (const ga of entryFormData.gamingAccounts) {
      for (const st of entryFormData.shareTypes) {
        const key = `${ga.id}_${st.code}`;
        const val = metricValues[key];
        // Only include non-zero values
        if (val !== undefined && val !== 0) {
          lines.push({
            gamingAccountId: ga.id,
            externalAccountId: ga.externalAccountId,
            shareTypeCode: st.code,
            metricAmount: val,
            currencyCode: entryFormData.currencyCode,
          });
        }
      }
    }
    return lines;
  }, [entryFormData, metricValues]);

  /** Handle full form submission */
  const onSubmit = useCallback(
    async (periodData: PeriodFormData) => {
      // Validate metrics
      const errors = validateMetrics();
      if (Object.keys(errors).length > 0) {
        setMetricErrors(errors);
        toast.error('Please fix the highlighted errors');
        return;
      }

      // Build lines
      const lines = buildLines();
      if (lines.length === 0) {
        toast.error('Enter at least one non-zero amount before submitting');
        return;
      }

      try {
        // Submit creates batch + lines + processes in one shot
        await submitMutation.mutateAsync({
          batchId: `${selectedBrandCode}:${periodData.periodStart}:${periodData.periodEnd}`,
          lines,
        });

        toast.success('Manual entry submitted successfully');
        setIsSubmitted(true);
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          toast.error(
            'A batch already exists for this brand and period. Please choose a different period.'
          );
        } else {
          toast.error(
            TOAST_MESSAGES.CREATE_ERROR(
              'manual entry',
              err instanceof Error ? err.message : 'Unknown error'
            )
          );
        }
      }
    },
    [
      validateMetrics,
      buildLines,
      submitMutation,
      selectedBrandCode,
    ]
  );

  /** Reset form for a new entry */
  const handleNewEntry = useCallback(() => {
    setMetricValues({});
    setMetricErrors({});
    setIsSubmitted(false);
    resetPeriod();
  }, [resetPeriod]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const lineCount = buildLines().length;
  const hasExistingDrafts = existingBatches?.some(
    (b: RMManualEntryBatch) => b.status === 'draft'
  );

  // ---------------------------------------------------------------------------
  // Render: Success State
  // ---------------------------------------------------------------------------
  if (isSubmitted) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/revenue/statements">
              <Button variant="ghost" size="icon" aria-label="Back to dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-foreground">
              Manual Entry
            </h1>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 pb-6 flex-1">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-success/10 p-3 mb-4">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              Entry Submitted Successfully
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Your manual entry has been submitted for processing. The system
              will validate the data, generate the CSV, and notify the
              downstream pipeline.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleNewEntry}>
                New Entry
              </Button>
              <Link to="/revenue/statements/$brandCode" params={{ brandCode: selectedBrandCode }}>
                <Button>View Brand Detail</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Main Form
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            to={
              selectedBrandCode
                ? '/revenue/statements/$brandCode'
                : '/revenue/statements'
            }
            params={selectedBrandCode ? { brandCode: selectedBrandCode } : undefined}
          >
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Manual Statement Entry
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter statement values for manual input brands
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1 space-y-6">
        {/* Step 1: Brand Selection */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            1. Select Brand
          </h2>
          {brandsLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="brand-select">
                Brand <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedBrandCode}
                onValueChange={handleBrandChange}
              >
                <SelectTrigger id="brand-select">
                  <SelectValue placeholder="Choose a brand..." />
                </SelectTrigger>
                <SelectContent>
                  {manualBrands?.map((b) => (
                    <SelectItem key={b.brandCode} value={b.brandCode}>
                      {b.brandName} ({b.brandCode})
                    </SelectItem>
                  ))}
                  {(!manualBrands || manualBrands.length === 0) && (
                    <SelectItem value="__none__" disabled>
                      No manual input brands available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Step 2: Period Selection (shown after brand selected) */}
        {selectedBrandCode && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h2 className="text-sm font-medium text-foreground">
              2. Select Period
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="periodStart">
                  Period Start <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="periodStart"
                  type="date"
                  {...register('periodStart')}
                />
                {periodErrors.periodStart && (
                  <p className="text-sm text-destructive">
                    {periodErrors.periodStart.message}
                  </p>
                )}
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="periodEnd">
                  Period End <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="periodEnd"
                  type="date"
                  {...register('periodEnd')}
                />
                {periodErrors.periodEnd && (
                  <p className="text-sm text-destructive">
                    {periodErrors.periodEnd.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Existing Drafts Warning */}
        {selectedBrandCode && hasExistingDrafts && (
          <div className="flex items-start gap-3 rounded-lg border border-warning/50 bg-warning/10 p-3">
            <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Existing Drafts</p>
              <p className="text-muted-foreground">
                This brand has draft entries. Review them below before creating a
                new entry.
              </p>
            </div>
          </div>
        )}

        {/* Existing Drafts List */}
        {selectedBrandCode && existingBatches && existingBatches.length > 0 && (
          <ExistingDrafts batches={existingBatches} />
        )}

        {/* Step 3: Dynamic Metric Grid (shown after brand selected) */}
        {selectedBrandCode && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">
                3. Enter Amounts
              </h2>
              {entryFormData && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {entryFormData.currencyCode}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {entryFormData.shareTypes.length} share type
                    {entryFormData.shareTypes.length !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {entryFormData.gamingAccounts.length} account
                    {entryFormData.gamingAccounts.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
            </div>

            {formLoading && (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}

            {formError && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-destructive/10 p-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1">
                  Failed to load form structure
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {formError instanceof Error
                    ? formError.message
                    : 'Unknown error'}
                </p>
              </div>
            )}

            {entryFormData && (
              <MetricGrid
                formData={entryFormData}
                values={metricValues}
                onChange={handleMetricChange}
                errors={metricErrors}
              />
            )}
          </div>
        )}

        {/* Submit Section */}
        {selectedBrandCode && entryFormData && (
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div className="text-sm text-muted-foreground">
              {lineCount === 0 ? (
                'Enter at least one non-zero amount to submit'
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    {lineCount}
                  </span>{' '}
                  line{lineCount !== 1 ? 's' : ''} ready to submit
                  {periodStart &&
                    periodEnd &&
                    ` for ${periodStart} to ${periodEnd}`}
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleNewEntry}>
                Reset
              </Button>
              <Button
                disabled={
                  lineCount === 0 ||
                  submitMutation.isPending ||
                  !periodStart ||
                  !periodEnd
                }
                onClick={handlePeriodSubmit(onSubmit)}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Entry'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
