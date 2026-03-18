/**
 * UploadFilesStep.tsx
 *
 * Step 2 of the import wizard — Upload Files.
 * Shows dynamic file upload slots based on the selected brand's expectedFileTypes.
 * Each slot supports drag-drop or file picker, .csv only.
 */

import { useState, useCallback, useRef } from 'react';
import {
  Button,
  Badge,
  Spinner,
} from '@hnc-partners/ui-components';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Check,
  AlertTriangle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUploadFile } from '../api';
import { ApiError } from '@/features/revenue/api';
import type { BatchFile, BrandConfig } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FILE_SIZE_WARN_BYTES = 10 * 1024 * 1024; // 10 MB

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFileTypeLabel(fileType: string): string {
  return fileType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FileSlotState {
  fileType: string;
  file: File | null;
  uploadedFile: BatchFile | null;
  status: 'idle' | 'uploading' | 'uploaded' | 'error';
  errorMessage?: string;
}

interface UploadFilesStepProps {
  batchId: string;
  brandConfig: BrandConfig;
  onContinue: () => void;
  onSkip: () => void;
}

// ---------------------------------------------------------------------------
// File Upload Slot
// ---------------------------------------------------------------------------

interface FileSlotProps {
  slot: FileSlotState;
  onFileSelect: (fileType: string, file: File) => void;
  onRemove: (fileType: string) => void;
}

function FileSlot({ slot, onFileSelect, onRemove }: FileSlotProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        if (!file.name.endsWith('.csv')) {
          toast.error('Only .csv files are accepted');
          return;
        }
        onFileSelect(slot.fileType, file);
      }
    },
    [slot.fileType, onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(slot.fileType, file);
      }
      // Reset input so the same file can be re-selected
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [slot.fileType, onFileSelect]
  );

  const label = formatFileTypeLabel(slot.fileType);

  // Uploaded state
  if (slot.status === 'uploaded' && slot.uploadedFile) {
    const fileSize = Number(slot.uploadedFile.fileSizeBytes);
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-success/10 p-2">
              <Check className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">
                {slot.uploadedFile.originalFilename} ({formatFileSize(fileSize)})
              </p>
            </div>
          </div>
          <Badge variant="success" className="text-xs">Uploaded</Badge>
        </div>
      </div>
    );
  }

  // Uploading state
  if (slot.status === 'uploading') {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Spinner size="sm" />
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">
              Uploading {slot.file?.name}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (slot.status === 'error') {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-destructive">
                {slot.errorMessage || 'Upload failed'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(slot.fileType)}
            title="Clear and retry"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Idle — drop zone
  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer',
        isDragOver
          ? 'border-mf-accent bg-mf-accent/5'
          : 'border-border hover:border-mf-accent/50 hover:bg-muted/50'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      aria-label={`Upload ${label} file`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <div className="flex flex-col items-center gap-2">
        <Upload className="h-8 w-8 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            Drag & drop a .csv file or click to browse
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function UploadFilesStep({
  batchId,
  brandConfig,
  onContinue,
  onSkip,
}: UploadFilesStepProps) {
  const uploadFile = useUploadFile();

  // Determine file slots from brand config
  const fileTypes = brandConfig.expectedFileTypes?.length
    ? brandConfig.expectedFileTypes
    : ['single'];

  const [slots, setSlots] = useState<FileSlotState[]>(
    fileTypes.map((ft) => ({
      fileType: ft,
      file: null,
      uploadedFile: null,
      status: 'idle',
    }))
  );

  const uploadedCount = slots.filter((s) => s.status === 'uploaded').length;
  const hasUploads = uploadedCount > 0;

  const handleFileSelect = useCallback(
    (fileType: string, file: File) => {
      // Warn if file is approaching 10MB
      if (file.size >= FILE_SIZE_WARN_BYTES) {
        toast.warning(
          `File "${file.name}" is ${formatFileSize(file.size)}. Maximum allowed is 10 MB.`
        );
      }

      // Update slot to uploading
      setSlots((prev) =>
        prev.map((s) =>
          s.fileType === fileType
            ? { ...s, file, status: 'uploading' as const, errorMessage: undefined }
            : s
        )
      );

      // Trigger upload
      uploadFile.mutate(
        { batchId, file, fileType },
        {
          onSuccess: (uploadedFile) => {
            setSlots((prev) =>
              prev.map((s) =>
                s.fileType === fileType
                  ? { ...s, uploadedFile, status: 'uploaded' as const }
                  : s
              )
            );
            toast.success(`${formatFileTypeLabel(fileType)} file uploaded`);
          },
          onError: (error) => {
            let errorMessage = 'Upload failed. Please try again.';
            if (error instanceof ApiError && error.status === 409) {
              errorMessage = 'This file has already been uploaded (duplicate hash)';
            }
            setSlots((prev) =>
              prev.map((s) =>
                s.fileType === fileType
                  ? { ...s, status: 'error' as const, errorMessage }
                  : s
              )
            );
            toast.error(errorMessage);
            console.error('Upload error:', error);
          },
        }
      );
    },
    [batchId, uploadFile]
  );

  const handleRemove = useCallback((fileType: string) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.fileType === fileType
          ? { ...s, file: null, uploadedFile: null, status: 'idle' as const, errorMessage: undefined }
          : s
      )
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* File info */}
      <div className="rounded-md bg-muted p-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{brandConfig.brandName}</span>
          {' '}expects{' '}
          <span className="font-medium text-foreground">{fileTypes.length}</span>
          {' '}file{fileTypes.length !== 1 ? 's' : ''}.
          Upload at least 1 to continue.
        </p>
      </div>

      {/* File slots */}
      <div className="space-y-3">
        {slots.map((slot) => (
          <FileSlot
            key={slot.fileType}
            slot={slot}
            onFileSelect={handleFileSelect}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {/* Upload progress summary */}
      {hasUploads && (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {uploadedCount} of {fileTypes.length} file{fileTypes.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onSkip}>
          Skip Upload
        </Button>
        <Button onClick={onContinue} disabled={!hasUploads}>
          Continue to Process
        </Button>
      </div>
    </div>
  );
}
