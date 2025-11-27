/**
 * ProductFilters Component
 * Filter bar with search, dropdowns, and archived checkbox
 */

import React from 'react';
import { Input, Select, SelectItem, Button, Checkbox } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';

export function ProductFilters({
  searchQuery,
  onSearchChange,
  onSearch,
  filters,
  onFilterChange,
  showArchived,
  onShowArchivedChange,
  onClearFilters
}) {
  const { t } = useTranslation();

  return (
    <div className="mb-5 flex flex-col gap-4">
      {/* Search and Create Button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder={t('pages.dashboard.adminProducts.searchPlaceholder')}
            value={searchQuery}
            onValueChange={onSearchChange}
            startContent={<Icon icon="lucide:search" className="text-default-400" />}
            className="max-w-xs"
          />
          <Button onPress={onSearch} color="primary">
            {t('pages.dashboard.adminProducts.search')}
          </Button>
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex gap-2 flex-wrap">
        <Select
          placeholder={t('pages.dashboard.adminProducts.filters.type')}
          aria-label={t('pages.dashboard.adminProducts.filters.ariaLabels.filterByType')}
          selectedKeys={filters.type ? new Set([filters.type]) : new Set()}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] || '';
            onFilterChange({ ...filters, type: selected });
          }}
          className="w-40"
        >
          <SelectItem key="2D" textValue="2D">2D</SelectItem>
          <SelectItem key="3D" textValue="3D">3D</SelectItem>
        </Select>

        <Select
          placeholder={t('pages.dashboard.adminProducts.filters.location')}
          aria-label={t('pages.dashboard.adminProducts.filters.ariaLabels.filterByLocation')}
          selectedKeys={filters.location ? new Set([filters.location]) : new Set()}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] || '';
            onFilterChange({ ...filters, location: selected });
          }}
          className="w-40"
        >
          <SelectItem key="Exterior" textValue="Exterior">Exterior</SelectItem>
          <SelectItem key="Interior" textValue="Interior">Interior</SelectItem>
        </Select>

        <Select
          placeholder={t('pages.dashboard.adminProducts.filters.tag')}
          aria-label={t('pages.dashboard.adminProducts.filters.ariaLabels.filterByTag')}
          selectedKeys={filters.tag ? new Set([filters.tag]) : new Set()}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] || '';
            onFilterChange({ ...filters, tag: selected });
          }}
          className="w-40"
        >
          <SelectItem key="priority" textValue="PRIORITY">{t('pages.dashboard.adminProducts.tags.priority')}</SelectItem>
          <SelectItem key="sale" textValue="Sale">{t('pages.dashboard.adminProducts.tags.sale')}</SelectItem>
          <SelectItem key="new" textValue="New">{t('pages.dashboard.adminProducts.tags.new')}</SelectItem>
          <SelectItem key="trending" textValue="Trending">{t('pages.dashboard.adminProducts.tags.trending')}</SelectItem>
          <SelectItem key="summer" textValue="Summer">{t('pages.dashboard.adminProducts.tags.summer')}</SelectItem>
          <SelectItem key="christmas" textValue="Christmas">{t('pages.dashboard.adminProducts.tags.christmas')}</SelectItem>
        </Select>

        <Button variant="flat" onPress={onClearFilters}>
          {t('pages.dashboard.adminProducts.filters.clearFilters')}
        </Button>

        <Checkbox isSelected={showArchived} onValueChange={onShowArchivedChange}>
          {t('pages.dashboard.adminProducts.filters.showArchived')}
        </Checkbox>
      </div>
    </div>
  );
}
