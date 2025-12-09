import React from 'react';
import { Select, SelectItem, Button, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';

export function SmartProjectTableFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  statusLabelMap,
  filteredCount
}) {
  const { t } = useTranslation();

  const hasActiveFilters = filters.status.length > 0 || filters.contract.length > 0 || filters.design.length > 0;

  const statusOptions = [
    { key: "draft", label: statusLabelMap["draft"] || "Draft" },
    { key: "created", label: statusLabelMap["created"] || "Created" },
    { key: "in_progress", label: statusLabelMap["in_progress"] || "In Progress" },
    { key: "finished", label: statusLabelMap["finished"] || "Finished" },
    { key: "approved", label: statusLabelMap["approved"] || "Approved" },
    { key: "cancelled", label: statusLabelMap["cancelled"] || "Cancelled" },
    { key: "in_queue", label: statusLabelMap["in_queue"] || "In Queue" },
    { key: "to_order", label: statusLabelMap["to_order"] || "To Order" },
    { key: "ordered", label: statusLabelMap["ordered"] || "Ordered" }
  ];

  const contractOptions = [
    { key: "sale", label: t('pages.dashboard.smartProjectTable.contractTypes.sale') },
    { key: "rent1y", label: t('pages.dashboard.smartProjectTable.contractTypes.rent1y') },
    { key: "rent3y", label: t('pages.dashboard.smartProjectTable.contractTypes.rent3y') }
  ];

  const designOptions = [
    { key: "ready", label: t('pages.dashboard.smartProjectTable.designStatus.ready') },
    { key: "pending", label: t('pages.dashboard.smartProjectTable.designStatus.pending') }
  ];

  const handleStatusChange = (keys) => {
    const selected = Array.from(keys);
    onFiltersChange({ ...filters, status: selected });
  };

  const handleContractChange = (keys) => {
    const selected = Array.from(keys);
    onFiltersChange({ ...filters, contract: selected });
  };

  const handleDesignChange = (keys) => {
    const selected = Array.from(keys);
    onFiltersChange({ ...filters, design: selected });
  };

  return (
    <div className="p-4 border-b border-default-200/50 bg-default-50/50">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Chip size="sm" variant="flat" color="primary">
              {filteredCount} {filteredCount === 1 ? t('pages.dashboard.smartProjectTable.filters.result') : t('pages.dashboard.smartProjectTable.filters.results')}
            </Chip>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:filter" className="text-default-500" />
            <Select
              placeholder={t('pages.dashboard.smartProjectTable.filters.status')}
              aria-label={t('pages.dashboard.smartProjectTable.filters.status')}
              selectedKeys={filters.status.length > 0 ? new Set(filters.status) : new Set()}
              onSelectionChange={handleStatusChange}
              selectionMode="multiple"
              className="w-48"
              size="sm"
            >
              {statusOptions.map((option) => (
                <SelectItem key={option.key} textValue={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <Select
            placeholder={t('pages.dashboard.smartProjectTable.filters.contract')}
            aria-label={t('pages.dashboard.smartProjectTable.filters.contract')}
            selectedKeys={filters.contract.length > 0 ? new Set(filters.contract) : new Set()}
            onSelectionChange={handleContractChange}
            selectionMode="multiple"
            className="w-40"
            size="sm"
          >
            {contractOptions.map((option) => (
              <SelectItem key={option.key} textValue={option.label}>
                {option.label}
              </SelectItem>
            ))}
          </Select>

          <Select
            placeholder={t('pages.dashboard.smartProjectTable.filters.design')}
            aria-label={t('pages.dashboard.smartProjectTable.filters.design')}
            selectedKeys={filters.design.length > 0 ? new Set(filters.design) : new Set()}
            onSelectionChange={handleDesignChange}
            selectionMode="multiple"
            className="w-40"
            size="sm"
          >
            {designOptions.map((option) => (
              <SelectItem key={option.key} textValue={option.label}>
                {option.label}
              </SelectItem>
            ))}
          </Select>

          {hasActiveFilters && (
            <Button
              variant="flat"
              size="sm"
              onPress={onClearFilters}
              startContent={<Icon icon="lucide:x" className="text-sm" />}
            >
              {t('pages.dashboard.smartProjectTable.filters.clearAll')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

