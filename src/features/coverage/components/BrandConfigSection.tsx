/**
 * BrandConfigSection.tsx
 *
 * Displays list of configured brands with add/edit functionality.
 * Reuses useBrandConfigs from imports feature for the list.
 */

import { useState } from 'react';
import { Plus, Pencil, Settings } from 'lucide-react';
import { Button, Badge, Skeleton } from '@hnc-partners/ui-components';
import { useBrandConfigs } from '@/features/imports/api/useBrandConfigs';
import { BrandConfigForm } from './BrandConfigForm';
import type { BrandConfigFull } from '../types';

export function BrandConfigSection() {
  const { data: configs, isLoading, error } = useBrandConfigs();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<BrandConfigFull | undefined>();

  const handleAdd = () => {
    setEditingConfig(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (config: BrandConfigFull) => {
    setEditingConfig(config as BrandConfigFull);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingConfig(undefined);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-medium">Brand Configurations</h3>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Config
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {error && (
        <div className="p-4 text-destructive">
          <p className="text-sm">Failed to load brand configurations.</p>
        </div>
      )}

      {!isLoading && !error && (!configs || configs.length === 0) && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Settings className="h-12 w-12 text-muted-foreground mb-4" />
          <h4 className="text-sm font-medium mb-1">No Brand Configurations</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Add a brand configuration to start tracking coverage.
          </p>
          <Button onClick={handleAdd} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add First Config
          </Button>
        </div>
      )}

      {!isLoading && configs && configs.length > 0 && (
        <div className="space-y-2">
          {configs.map((config) => {
            // Cast to BrandConfigFull since configs from useBrandConfigs
            // may have a subset of fields
            const fullConfig = config as BrandConfigFull;
            return (
              <div
                key={fullConfig.brandId}
                className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">
                      {fullConfig.brandName}
                    </span>
                    {fullConfig.brandCode && (
                      <Badge variant="outline">{fullConfig.brandCode}</Badge>
                    )}
                    {fullConfig.active === false && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {fullConfig.periodGranularity && (
                      <Badge variant="info">{fullConfig.periodGranularity}</Badge>
                    )}
                    {fullConfig.expectedFileTypes?.map((ft) => (
                      <Badge key={ft} variant="secondary">
                        {ft.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {fullConfig.autoCalculateCommission && (
                      <Badge variant="success">Auto-commission</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(fullConfig)}
                  title="Edit configuration"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <BrandConfigForm
        open={isFormOpen}
        onClose={handleFormClose}
        config={editingConfig}
      />
    </div>
  );
}
