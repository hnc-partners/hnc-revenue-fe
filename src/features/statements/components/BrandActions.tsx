/**
 * BrandActions.tsx
 *
 * Context-dependent action buttons for the brand detail panel.
 * Actions change based on brand acquisition mode and state.
 */

import { useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Button,
  ConfirmDialog,
  toast,
  TOAST_MESSAGES,
} from '@hnc-partners/ui-components';
import {
  Play,
  Pause,
  Upload,
  PenLine,
  Settings,
  Download,
} from 'lucide-react';
import {
  useEnableBrand,
  useDisableBrand,
  useTriggerDownload,
  useUploadCSV,
} from '../api';
import type { RMBrandConfigWithActivity } from '../types';

interface BrandActionsProps {
  brand: RMBrandConfigWithActivity;
  /** Called when Edit Config button is clicked */
  onEditConfig: () => void;
}

export function BrandActions({ brand, onEditConfig }: BrandActionsProps) {
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showResumeConfirm, setShowResumeConfirm] = useState(false);
  const [showTriggerConfirm, setShowTriggerConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const enableMutation = useEnableBrand(brand.brandCode);
  const disableMutation = useDisableBrand(brand.brandCode);
  const triggerMutation = useTriggerDownload(brand.brandCode);
  const uploadMutation = useUploadCSV(brand.brandCode);

  const isAutomated = brand.acquisitionMode === 'automated_download';
  const isManualDownload = brand.acquisitionMode === 'manual_download';
  const isManualInput = brand.acquisitionMode === 'manual_input';

  const handleTrigger = () => {
    triggerMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Download triggered successfully');
        setShowTriggerConfirm(false);
      },
      onError: (err: Error) => {
        toast.error(`Failed to trigger download: ${err.message}`);
        setShowTriggerConfirm(false);
      },
    });
  };

  const handlePause = () => {
    disableMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(TOAST_MESSAGES.UPDATE_SUCCESS('Brand paused'));
        setShowPauseConfirm(false);
      },
      onError: (err: Error) => {
        toast.error(TOAST_MESSAGES.UPDATE_ERROR('brand', err.message));
        setShowPauseConfirm(false);
      },
    });
  };

  const handleResume = () => {
    enableMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(TOAST_MESSAGES.UPDATE_SUCCESS('Brand resumed'));
        setShowResumeConfirm(false);
      },
      onError: (err: Error) => {
        toast.error(TOAST_MESSAGES.UPDATE_ERROR('brand', err.message));
        setShowResumeConfirm(false);
      },
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadMutation.mutate(file, {
      onSuccess: () => {
        toast.success('CSV uploaded successfully');
      },
      onError: (err: Error) => {
        toast.error(`Upload failed: ${err.message}`);
      },
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Automated brands: Trigger Download */}
      {isAutomated && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTriggerConfirm(true)}
            disabled={triggerMutation.isPending || brand.paused}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Trigger Download
          </Button>
          <ConfirmDialog
            isOpen={showTriggerConfirm}
            onClose={() => setShowTriggerConfirm(false)}
            title="Trigger Download"
            message={`This will start an immediate download for ${brand.brandName}. Continue?`}
            confirmText="Trigger"
            onConfirm={handleTrigger}
          />
        </>
      )}

      {/* Manual download brands: Upload CSV */}
      {isManualDownload && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {uploadMutation.isPending ? 'Uploading...' : 'Upload CSV'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
        </>
      )}

      {/* Manual input brands: New Entry → links to manual entry form */}
      {isManualInput && (
        <Link
          to="/revenue/statements/manual-entry"
          search={{ brandCode: brand.brandCode }}
        >
          <Button variant="outline" size="sm">
            <PenLine className="h-3.5 w-3.5 mr-1.5" />
            New Entry
          </Button>
        </Link>
      )}

      {/* Pause/Resume for automated brands */}
      {isAutomated && (
        <>
          {brand.paused || !brand.enabled ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResumeConfirm(true)}
                disabled={enableMutation.isPending}
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Resume
              </Button>
              <ConfirmDialog
                isOpen={showResumeConfirm}
                onClose={() => setShowResumeConfirm(false)}
                title="Resume Brand"
                message={`Resume scheduled acquisitions for ${brand.brandName}?`}
                confirmText="Resume"
                onConfirm={handleResume}
              />
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPauseConfirm(true)}
                disabled={disableMutation.isPending}
              >
                <Pause className="h-3.5 w-3.5 mr-1.5" />
                Pause
              </Button>
              <ConfirmDialog
                isOpen={showPauseConfirm}
                onClose={() => setShowPauseConfirm(false)}
                title="Pause Brand"
                message={`Pause scheduled acquisitions for ${brand.brandName}? You can resume at any time.`}
                confirmText="Pause"
                onConfirm={handlePause}
              />
            </>
          )}
        </>
      )}

      {/* Edit Config (all brands) */}
      <Button variant="outline" size="sm" onClick={onEditConfig}>
        <Settings className="h-3.5 w-3.5 mr-1.5" />
        Edit Config
      </Button>
    </div>
  );
}
