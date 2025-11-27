/**
 * ProductFormSpecs Component
 * Technical specifications and dimensions
 * Note: This is a simplified version. The full specs with all material options
 * are kept in the original AdminProducts.jsx for reference.
 */

import React from 'react';
import { Input, Textarea, Select, SelectItem, Accordion, AccordionItem, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { 
  VALID_PRINT_COLORS, 
  VALID_LED_EFFECTS,
  getValidPrintColors,
  getValidLEDEffects,
  getPrintColorStyle,
  TAG_CONFIGS
} from '../../../utils/products';

export function ProductFormSpecs({ formData, setFormData }) {
  return (
    <div className="space-y-4">
      {/* Description and Basic Specs */}
      <div className="space-y-2">
        <h4 className="font-medium">Technical Specifications</h4>
        <Textarea
          label="Description"
          placeholder="Product description"
          value={formData.specs.descricao}
          onValueChange={(val) => {
            setFormData((prev) => ({
              ...prev,
              specs: { ...prev.specs, descricao: val }
            }));
          }}
          minRows={2}
          classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
        />
        
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Technical"
            placeholder="Ex: 230V AC, IP65, 48W"
            value={formData.specs.tecnicas}
            onValueChange={(val) => {
              setFormData((prev) => ({
                ...prev,
                specs: { ...prev.specs, tecnicas: val }
              }));
            }}
            classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
          />
          
          <Input
            label="Weight (kg)"
            placeholder="Ex: 11"
            value={formData.specs.weight}
            onValueChange={(val) => {
              setFormData((prev) => ({
                ...prev,
                specs: { ...prev.specs, weight: val }
              }));
            }}
            classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
          />
        </div>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-2">
        <h4 className="font-medium col-span-2">Dimensions (in meters)</h4>
        <Input
          label="Height (H)"
          type="number"
          step="0.01"
          placeholder="Ex: 2.4"
          value={formData.height}
          onValueChange={(val) => {
            setFormData((prev) => ({ ...prev, height: val }));
          }}
          classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
        />
        
        <Input
          label="Width (W)"
          type="number"
          step="0.01"
          placeholder="Ex: 2.0"
          value={formData.width}
          onValueChange={(val) => {
            setFormData((prev) => ({ ...prev, width: val }));
          }}
          classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
        />
        
        <Input
          label="Depth (D)"
          type="number"
          step="0.01"
          placeholder="Ex: 0.5"
          value={formData.depth}
          onValueChange={(val) => {
            setFormData((prev) => ({ ...prev, depth: val }));
          }}
          classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
        />
        
        <Input
          label="Diameter"
          type="number"
          step="0.01"
          placeholder="Ex: 1.2"
          value={formData.diameter}
          onValueChange={(val) => {
            setFormData((prev) => ({ ...prev, diameter: val }));
          }}
          classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
        />
      </div>

      {/* Materials - Simplified version */}
      <Accordion>
        <AccordionItem key="materials" title="Materials">
          <div className="space-y-2">
            <Textarea
              label="Materials"
              placeholder="Ex: LED WARM WHITE, ANIMATED SPARKLES PURE WHITE"
              value={formData.specs.materiais}
              onValueChange={(val) => {
                setFormData((prev) => ({
                  ...prev,
                  specs: { ...prev.specs, materiais: val }
                }));
              }}
              minRows={2}
              classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
              description="Enter materials separated by commas"
            />
            
            <Input
              label="Stock Policy"
              placeholder="Stock policy details"
              value={formData.specs.stockPolicy}
              onValueChange={(val) => {
                setFormData((prev) => ({
                  ...prev,
                  specs: { ...prev.specs, stockPolicy: val }
                }));
              }}
              classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
            />
          </div>
        </AccordionItem>
      </Accordion>

      {/* Tags */}
      <div>
        <Select
          label="Tags"
          placeholder="Select tags"
          selectionMode="multiple"
          selectedKeys={new Set(formData.tags || [])}
          onSelectionChange={(keys) => {
            const selectedTags = Array.from(keys);
            setFormData((prev) => ({ ...prev, tags: selectedTags }));
          }}
          classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
          renderValue={(items) => {
            if (items.length === 0) return 'No tags selected';
            return items.map((item) => {
              const config = TAG_CONFIGS[item.key] || { label: item.key, color: '#6b7280' };
              return (
                <Chip
                  key={item.key}
                  size="sm"
                  style={{ backgroundColor: config.color + '20', color: config.color }}
                  className="mr-1"
                >
                  {config.label}
                </Chip>
              );
            });
          }}
        >
          {Object.entries(TAG_CONFIGS).map(([key, config]) => (
            <SelectItem
              key={key}
              textValue={config.label}
              startContent={
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: config.color }}>
                  <Icon icon={config.icon} className="text-white text-xs" />
                </div>
              }
            >
              {config.label}
            </SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );
}
