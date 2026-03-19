/**
 * ImportWizard.tsx
 *
 * Main wizard component for creating import batches (FES-02).
 * 3-step flow: Create Batch -> Upload Files -> Process
 *
 * Tracks wizard state including batchId from Step 1 to use in Steps 2 and 3.
 * Back navigation preserves state (the created batch).
 */

import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateBatchStep } from './CreateBatchStep';
import { UploadFilesStep } from './UploadFilesStep';
import { ProcessBatchStep } from './ProcessBatchStep';
import type { ImportBatch, BrandConfig } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WizardStep = 1 | 2 | 3;

interface WizardState {
  step: WizardStep;
  batch: ImportBatch | null;
  brandConfig: BrandConfig | null;
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

const STEPS = [
  { number: 1, label: 'Create Batch' },
  { number: 2, label: 'Upload Files' },
  { number: 3, label: 'Process' },
] as const;

interface StepIndicatorProps {
  currentStep: WizardStep;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Wizard progress" className="mb-8">
      <ol className="flex items-center justify-center gap-2 sm:gap-4">
        {STEPS.map((step, idx) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;

          return (
            <li key={step.number} className="flex items-center">
              {/* Step circle + label */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    isCompleted && 'bg-mf-accent text-white',
                    isActive && 'bg-mf-accent text-white ring-2 ring-mf-accent/30 ring-offset-2 ring-offset-background',
                    !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm hidden sm:inline',
                    isActive && 'font-medium text-foreground',
                    !isActive && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'ml-2 sm:ml-4 h-px w-8 sm:w-12',
                    step.number < currentStep ? 'bg-mf-accent' : 'bg-border'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface ImportWizardProps {
  onBack?: () => void;
}

export function ImportWizard({ onBack }: ImportWizardProps) {
  const [state, setState] = useState<WizardState>({
    step: 1,
    batch: null,
    brandConfig: null,
  });

  const handleBatchCreated = (batch: ImportBatch, brandConfig: BrandConfig) => {
    setState({
      step: 2,
      batch,
      brandConfig,
    });
  };

  const handleUploadContinue = () => {
    setState((prev) => ({ ...prev, step: 3 }));
  };

  const handleUploadSkip = () => {
    onBack?.();
  };

  const handleCancel = () => {
    onBack?.();
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-foreground">New Import</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
        {/* Step indicator */}
        <StepIndicator currentStep={state.step} />

        {/* Step content card */}
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            {/* Step title */}
            <h2 className="text-lg font-medium mb-4">
              {STEPS[state.step - 1].label}
            </h2>

            {/* Render active step */}
            {state.step === 1 && (
              <CreateBatchStep
                onBatchCreated={handleBatchCreated}
                onCancel={handleCancel}
              />
            )}

            {state.step === 2 && state.batch && state.brandConfig && (
              <UploadFilesStep
                batchId={state.batch.id}
                brandConfig={state.brandConfig}
                onContinue={handleUploadContinue}
                onSkip={handleUploadSkip}
              />
            )}

            {state.step === 3 && state.batch && (
              <ProcessBatchStep batchId={state.batch.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
