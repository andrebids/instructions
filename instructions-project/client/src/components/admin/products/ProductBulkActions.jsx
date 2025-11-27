/**
 * ProductBulkActions Component
 * Bulk selection and actions bar
 */

import React from 'react';
import { Button, Checkbox } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';

export function ProductBulkActions({
  isSelectionMode,
  selectedProducts,
  filteredProducts,
  onToggleSelectionMode,
  onSelectAll,
  onClearSelection,
  onBulkArchive,
  onBulkUnarchive,
  onBulkDelete
}) {
  const { t } = useTranslation();

  if (filteredProducts.length === 0) return null;

  return (
    <div className="flex items-center gap-4 mt-4 p-4 bg-content2 rounded-lg border border-default-200 w-fit self-start">
      {!isSelectionMode ? (
        <Button
          size="sm"
          variant="flat"
          onPress={onToggleSelectionMode}
          startContent={<Icon icon="lucide:check-square" />}
        >
          {t('pages.dashboard.adminProducts.bulkActions.selectProducts')}
        </Button>
      ) : (
        <>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            onPress={() => onSelectAll(filteredProducts)}
            startContent={<Icon icon={selectedProducts.size === filteredProducts.length ? 'lucide:square' : 'lucide:check-square'} />}
          >
            {selectedProducts.size === filteredProducts.length 
              ? t('pages.dashboard.adminProducts.bulkActions.deselectAll') 
              : t('pages.dashboard.adminProducts.bulkActions.selectAll')}
          </Button>
          
          <span className="text-sm text-default-500">
            ({selectedProducts.size} {selectedProducts.size === 1 
              ? t('pages.dashboard.adminProducts.bulkActions.selected') 
              : t('pages.dashboard.adminProducts.bulkActions.selectedPlural')})
          </span>

          {selectedProducts.size > 0 && (
            <>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="flat"
                color="warning"
                onPress={onBulkArchive}
                startContent={<Icon icon="lucide:archive" />}
                isDisabled={Array.from(selectedProducts).every((id) => {
                  const product = filteredProducts.find((p) => p.id === id);
                  return product && !product.isActive;
                })}
              >
                {t('pages.dashboard.adminProducts.bulkActions.archive')} ({selectedProducts.size})
              </Button>
              
              <Button
                size="sm"
                variant="flat"
                color="success"
                onPress={onBulkUnarchive}
                startContent={<Icon icon="lucide:archive-restore" />}
                isDisabled={Array.from(selectedProducts).every((id) => {
                  const product = filteredProducts.find((p) => p.id === id);
                  return product && product.isActive;
                })}
              >
                {t('pages.dashboard.adminProducts.bulkActions.unarchive')} ({selectedProducts.size})
              </Button>
              
              <Button
                size="sm"
                variant="flat"
                color="danger"
                onPress={onBulkDelete}
                startContent={<Icon icon="lucide:trash-2" />}
              >
                {t('pages.dashboard.adminProducts.bulkActions.delete')} ({selectedProducts.size})
              </Button>
            </>
          )}
          
          <Button
            size="sm"
            variant="light"
            onPress={onClearSelection}
            startContent={<Icon icon="lucide:x" />}
          >
            {t('pages.dashboard.adminProducts.bulkActions.cancel')}
          </Button>
        </>
      )}
    </div>
  );
}
