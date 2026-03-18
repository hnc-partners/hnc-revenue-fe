/**
 * BatchFilesTab.tsx
 *
 * Files tab for the Batch Detail page (FES-03).
 * Displays a table of files belonging to the batch.
 */

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from '@hnc-partners/ui-components';
import { FileText } from 'lucide-react';
import type { BatchFile } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format file size from string (BigInt) to human-readable KB/MB.
 * fileSizeBytes comes as a string from the API.
 */
function formatFileSize(sizeStr: string): string {
  const bytes = Number(sizeStr);
  if (isNaN(bytes) || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function fileStatusVariant(
  status: string
): 'success' | 'warning' | 'destructive' | 'info' | 'secondary' {
  switch (status) {
    case 'uploaded':
      return 'success';
    case 'processing':
      return 'info';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'destructive';
    default:
      return 'secondary';
  }
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

function getColumns(): ColumnDef<BatchFile>[] {
  return [
    {
      accessorKey: 'fileType',
      header: 'File Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs capitalize">
          {row.original.fileType}
        </Badge>
      ),
    },
    {
      accessorKey: 'originalFilename',
      header: 'Original Filename',
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.originalFilename}
        </span>
      ),
    },
    {
      accessorKey: 'fileSizeBytes',
      header: () => <div className="text-right">Size</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm font-mono tabular-nums">
          {formatFileSize(row.original.fileSizeBytes)}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={fileStatusVariant(row.original.status)}
          className="text-xs capitalize"
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Uploaded At',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BatchFilesTabProps {
  files: BatchFile[];
}

export function BatchFilesTab({ files }: BatchFilesTabProps) {
  const columns = useMemo(() => getColumns(), []);

  const table = useReactTable({
    data: files,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-1">
          No files uploaded yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Upload files to this batch to begin processing revenue data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-medium uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        {files.length} file{files.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
