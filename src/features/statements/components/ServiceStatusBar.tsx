/**
 * ServiceStatusBar.tsx
 *
 * Shows the global service pause/active state with controls.
 * When paused, shows who paused and when, with a resume button.
 */

import { useState } from 'react';
import { Button, ConfirmDialog } from '@hnc-partners/ui-components';
import { Pause, Play, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServiceStatus, usePauseService, useResumeService } from '../api';
import type { RMServiceState } from '../types';

function formatPausedTime(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function ServiceStatusContent({ status }: { status: RMServiceState }) {
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showResumeConfirm, setShowResumeConfirm] = useState(false);

  const pauseMutation = usePauseService();
  const resumeMutation = useResumeService();

  const isMutating = pauseMutation.isPending || resumeMutation.isPending;

  if (status.globalPaused) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Service Paused</p>
          <p className="text-xs text-muted-foreground truncate">
            {status.pausedBy && `Paused by ${status.pausedBy}`}
            {status.pausedAt && ` at ${formatPausedTime(status.pausedAt)}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowResumeConfirm(true)}
          disabled={isMutating}
        >
          <Play className="h-3.5 w-3.5 mr-1.5" />
          Resume
        </Button>
        <ConfirmDialog
          isOpen={showResumeConfirm}
          onClose={() => setShowResumeConfirm(false)}
          title="Resume Service"
          message="This will resume all scheduled statement acquisitions. Are you sure?"
          confirmText="Resume"
          onConfirm={() => {
            resumeMutation.mutate();
            setShowResumeConfirm(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-success" />
        <span className="text-xs text-muted-foreground">Service Active</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowPauseConfirm(true)}
        disabled={isMutating}
      >
        <Pause className="h-3.5 w-3.5 mr-1.5" />
        Pause
      </Button>
      <ConfirmDialog
        isOpen={showPauseConfirm}
        onClose={() => setShowPauseConfirm(false)}
        title="Pause Service"
        message="This will pause all scheduled statement acquisitions across all brands. You can resume at any time."
        confirmText="Pause"
        onConfirm={() => {
          pauseMutation.mutate();
          setShowPauseConfirm(false);
        }}
      />
    </div>
  );
}

export function ServiceStatusBar({ className }: { className?: string }) {
  const { data: status, isLoading } = useServiceStatus();

  if (isLoading || !status) {
    return null;
  }

  return (
    <div className={cn(className)}>
      <ServiceStatusContent status={status} />
    </div>
  );
}
