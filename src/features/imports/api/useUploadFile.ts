/**
 * useUploadFile.ts
 *
 * TanStack Query mutation hook for uploading a file to an import batch.
 * POST /batches/:id/files (multipart/form-data)
 *
 * Note: Does NOT set Content-Type header — browser sets it with boundary
 * for multipart uploads. The apiFetch helper auto-sets Content-Type for
 * JSON bodies, so we use raw fetch here.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthItem } from '@hnc-partners/auth-context';
import { ApiError } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type { BatchFile, UploadFileResponse } from '../types';

interface UploadFileParams {
  batchId: string;
  file: File;
  fileType: string;
}

/**
 * Upload a file to an import batch.
 * POST /batches/:id/files (multipart/form-data)
 */
async function uploadFile(params: UploadFileParams): Promise<BatchFile> {
  const { batchId, file, fileType } = params;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileType', fileType);

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  // Add JWT Bearer token
  const token = getAuthItem('access_token', 'hnc_');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do NOT set Content-Type — browser sets multipart boundary automatically
  const response = await fetch(
    `${REVENUE_API_URL}/batches/${batchId}/files`,
    {
      method: 'POST',
      headers,
      body: formData,
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      data.detail || data.message || `HTTP ${response.status}`,
      response.status,
      data
    );
  }

  const result: UploadFileResponse = await response.json();
  return result.data;
}

/**
 * Mutation hook for uploading a file to an import batch.
 *
 * On success:
 * - Invalidates import batches queries so file counts refresh
 *
 * @example
 * ```tsx
 * const upload = useUploadFile();
 * upload.mutate({ batchId: '...', file: csvFile, fileType: 'commission' });
 * ```
 */
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UploadFileParams) => uploadFile(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['revenue', 'imports', 'batches'],
      });
    },
  });
}
