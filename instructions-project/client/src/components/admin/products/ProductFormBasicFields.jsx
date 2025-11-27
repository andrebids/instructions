/**
 * ProductFormBasicFields Component
 * Basic fields for product form (Name, Stock, Type, Location, Mount, Year, Season, Tags)
 */

import React from 'react';
import { Input, Select, SelectItem } from '@heroui/react';
import { useTranslation } from 'react-i18next';

export function ProductFormBasicFields({ formik, formData, setFormData, availableYears }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Name and Stock */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Name"
          placeholder="Ex: IPL317R"
          value={formik.values.name}
          onValueChange={(val) => {
            formik.setFieldValue('name', val);
            setFormData((prev) => ({ ...prev, name: val }));
          }}
          onBlur={formik.handleBlur}
          isRequired
          isInvalid={formik.touched.name && !!formik.errors.name}
          errorMessage={formik.touched.name && formik.errors.name}
          classNames={{
            label: 'text-primary-700 dark:text-primary-400',
            inputWrapper: formik.touched.name && formik.errors.name ? 'border-danger' : ''
          }}
        />
        <div></div>
        
        <Input
          label="Stock"
          type="number"
          placeholder="32"
          value={formik.values.stock}
          onValueChange={(val) => {
            formik.setFieldValue('stock', val);
            setFormData((prev) => ({ ...prev, stock: val }));
          }}
          onBlur={formik.handleBlur}
          isInvalid={formik.touched.stock && !!formik.errors.stock}
          errorMessage={formik.touched.stock && formik.errors.stock}
          classNames={{
            label: 'text-primary-700 dark:text-primary-400',
            inputWrapper: formik.touched.stock && formik.errors.stock ? 'border-danger' : ''
          }}
        />
        
        <Input
          label="Used Stock"
          type="number"
          placeholder="10"
          value={formik.values.usedStock}
          onValueChange={(val) => {
            formik.setFieldValue('usedStock', val);
            setFormData((prev) => ({ ...prev, usedStock: val }));
          }}
          onBlur={formik.handleBlur}
          isInvalid={formik.touched.usedStock && !!formik.errors.usedStock}
          errorMessage={formik.touched.usedStock && formik.errors.usedStock}
          classNames={{
            label: 'text-primary-700 dark:text-primary-400',
            inputWrapper: formik.touched.usedStock && formik.errors.usedStock ? 'border-danger' : ''
          }}
        />
      </div>

      {/* Type, Location, Mount, Year, Season */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Type"
          placeholder="Select type"
          selectedKeys={formData.type ? new Set([formData.type]) : new Set()}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] || '';
            setFormData((prev) => ({ ...prev, type: selected }));
          }}
          classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
        >
          <SelectItem key="2D" textValue="2D">2D</SelectItem>
          <SelectItem key="3D" textValue="3D">3D</SelectItem>
        </Select>

        <Select
          label="Location"
          placeholder="Select location"
          selectedKeys={formData.location ? new Set([formData.location]) : new Set()}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] || '';
            setFormData((prev) => ({ ...prev, location: selected }));
          }}
          classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
        >
          <SelectItem key="Exterior" textValue="Exterior">Exterior</SelectItem>
          <SelectItem key="Interior" textValue="Interior">Interior</SelectItem>
        </Select>

        <Select
          label="Mount"
          placeholder="Select mount"
          selectedKeys={formData.mount ? new Set([formData.mount]) : new Set()}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] || '';
            setFormData((prev) => ({ ...prev, mount: selected }));
          }}
          classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
        >
          <SelectItem key="Poste" textValue="Pole">Pole</SelectItem>
          <SelectItem key="Chão" textValue="Floor">Floor</SelectItem>
          <SelectItem key="Transversal" textValue="Transversal">Transversal</SelectItem>
        </Select>

        <Select
          label="Collection Year"
          placeholder="Select year"
          selectedKeys={formData.releaseYear ? new Set([String(formData.releaseYear)]) : new Set()}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] || '';
            setFormData((prev) => ({ ...prev, releaseYear: selected }));
          }}
          classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
        >
          {availableYears.map((year) => (
            <SelectItem key={String(year)} textValue={String(year)}>
              {year}
            </SelectItem>
          ))}
        </Select>

        <Select
          label="Season"
          placeholder="Select season"
          selectedKeys={formData.season ? new Set([formData.season]) : new Set()}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] || '';
            setFormData((prev) => ({ ...prev, season: selected }));
          }}
          classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
        >
          <SelectItem key="xmas" textValue="Xmas">Xmas</SelectItem>
          <SelectItem key="summer" textValue="Summer">Summer</SelectItem>
        </Select>
      </div>
    </div>
  );
}
