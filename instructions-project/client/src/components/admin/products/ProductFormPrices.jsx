/**
 * ProductFormPrices Component
 * Price fields for new and used products
 */

import React from 'react';
import { Input, Accordion, AccordionItem } from '@heroui/react';

export function ProductFormPrices({ formik, formData, setFormData }) {
  return (
    <Accordion>
      <AccordionItem key="prices" title="Prices" subtitle="Configure prices for new and used products">
        <div className="space-y-4 pt-2">
          {/* New Product Prices */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">New Product</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price (€)"
                type="number"
                placeholder="1299"
                value={formik.values.prices.new.price}
                onValueChange={(val) => {
                  const newPrices = { ...formik.values.prices };
                  const newPrice = parseFloat(val) || 0;
                  const currentOldPrice = parseFloat(newPrices.new.oldPrice) || 0;

                  if (newPrices.new.oldPrice && currentOldPrice > 0 && newPrice > currentOldPrice) {
                    newPrices.new = { ...newPrices.new, price: val, oldPrice: '' };
                  } else {
                    newPrices.new = { ...newPrices.new, price: val };
                  }

                  formik.setFieldValue('prices', newPrices);
                  setFormData((prev) => ({ ...prev, prices: newPrices }));
                }}
                onBlur={() => formik.setFieldTouched('prices.new.price', true)}
                isInvalid={formik.isNestedTouched('prices.new.price') && !!formik.getNestedError('prices.new.price')}
                errorMessage={formik.isNestedTouched('prices.new.price') && formik.getNestedError('prices.new.price')}
                classNames={{
                  label: 'text-primary-700 dark:text-primary-400',
                  inputWrapper: formik.isNestedTouched('prices.new.price') && formik.getNestedError('prices.new.price') ? 'border-danger' : ''
                }}
              />
              
              <Input
                label="Old Price (€)"
                type="number"
                placeholder="Optional"
                value={formik.values.prices.new.oldPrice}
                onValueChange={(val) => {
                  const newPrices = { ...formik.values.prices };
                  const currentPrice = parseFloat(newPrices.new.price) || 0;
                  const newOldPrice = parseFloat(val) || 0;

                  if (val && newOldPrice > 0 && newOldPrice < currentPrice) {
                    return;
                  }

                  newPrices.new = { ...newPrices.new, oldPrice: val };
                  formik.setFieldValue('prices', newPrices);
                  setFormData((prev) => ({ ...prev, prices: newPrices }));
                }}
                onBlur={() => formik.setFieldTouched('prices.new.oldPrice', true)}
                isInvalid={formik.isNestedTouched('prices.new.oldPrice') && !!formik.getNestedError('prices.new.oldPrice')}
                errorMessage={formik.isNestedTouched('prices.new.oldPrice') && formik.getNestedError('prices.new.oldPrice')}
                classNames={{
                  label: 'text-primary-700 dark:text-primary-400',
                  inputWrapper: formik.isNestedTouched('prices.new.oldPrice') && formik.getNestedError('prices.new.oldPrice') ? 'border-danger' : ''
                }}
              />
              
              <Input
                label="Rental Price (€)"
                type="number"
                placeholder="299"
                value={formData.prices.new.rentalPrice}
                onValueChange={(val) => {
                  setFormData((prev) => ({
                    ...prev,
                    prices: {
                      ...prev.prices,
                      new: { ...prev.prices.new, rentalPrice: val }
                    }
                  }));
                }}
                classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
              />
            </div>
          </div>

          {/* Used Product Prices */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Used Product</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Used Price (€)"
                type="number"
                placeholder="899"
                value={formData.prices.used.price}
                onValueChange={(val) => {
                  setFormData((prev) => ({
                    ...prev,
                    prices: {
                      ...prev.prices,
                      used: { ...prev.prices.used, price: val }
                    }
                  }));
                }}
                classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
              />
              
              <Input
                label="Used Rental Price (€)"
                type="number"
                placeholder="199"
                value={formData.prices.used.rentalPrice}
                onValueChange={(val) => {
                  setFormData((prev) => ({
                    ...prev,
                    prices: {
                      ...prev.prices,
                      used: { ...prev.prices.used, rentalPrice: val }
                    }
                  }));
                }}
                classNames={{ label: 'text-primary-700 dark:text-primary-400' }}
              />
            </div>
          </div>
        </div>
      </AccordionItem>
    </Accordion>
  );
}
