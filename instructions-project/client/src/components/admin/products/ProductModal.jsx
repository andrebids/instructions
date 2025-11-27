/**
 * ProductModal Component
 * Main modal for creating/editing products
 */

import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { ProductFormBasicFields } from './ProductFormBasicFields';
import { ProductFormPrices } from './ProductFormPrices';
import { ProductFormImages } from './ProductFormImages';
import { ProductFormColors } from './ProductFormColors';
import { ProductFormSpecs } from './ProductFormSpecs';

export function ProductModal({
  isOpen,
  onClose,
  editingProduct,
  formik,
  formData,
  setFormData,
  availableYears,
  imageFiles,
  imagePreviews,
  onImageChange,
  onClearPreview,
  availableColors,
  onAddColor,
  onRemoveColor,
  onSubmit,
  loading
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              {editingProduct ? 'Edit Product' : 'Create New Product'}
            </ModalHeader>
            
            <ModalBody>
              <div className="space-y-4">
                {/* Basic Fields */}
                <ProductFormBasicFields
                  formik={formik}
                  formData={formData}
                  setFormData={setFormData}
                  availableYears={availableYears}
                />

                {/* Prices */}
                <ProductFormPrices
                  formik={formik}
                  formData={formData}
                  setFormData={setFormData}
                />

                {/* Images */}
                <ProductFormImages
                  imageFiles={imageFiles}
                  imagePreviews={imagePreviews}
                  onImageChange={onImageChange}
                  onClearPreview={onClearPreview}
                />

                {/* LED Colors */}
                <ProductFormColors
                  availableColors={availableColors}
                  selectedColors={formData.availableColors}
                  onAddColor={onAddColor}
                  onRemoveColor={onRemoveColor}
                />

                {/* Specs */}
                <ProductFormSpecs
                  formData={formData}
                  setFormData={setFormData}
                />
              </div>
            </ModalBody>
            
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button 
                color="primary" 
                onPress={onSubmit}
                isLoading={loading}
              >
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
