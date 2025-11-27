/**
 * useProductSelection Hook
 * Manages multiple product selection for bulk operations
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing product selection
 * @param {Array} filteredProducts - Currently filtered products
 * @returns {Object} Selection state and handlers
 */
export function useProductSelection(filteredProducts = []) {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState(new Set());

    /**
     * Toggle selection mode on/off
     */
    const toggleSelectionMode = useCallback(() => {
        setIsSelectionMode((prev) => {
            const newMode = !prev;
            // Clear selection when exiting selection mode
            if (!newMode) {
                setSelectedProducts(new Set());
            }
            return newMode;
        });
    }, []);

    /**
     * Toggle selection of a single product
     * @param {number|string} productId - Product ID to toggle
     */
    const toggleProductSelection = useCallback((productId) => {
        setSelectedProducts((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    }, []);

    /**
     * Select or deselect all filtered products
     * @param {Array} products - Products to select/deselect
     */
    const toggleSelectAll = useCallback((products) => {
        setSelectedProducts((prev) => {
            const allSelected = prev.size === products.length && products.length > 0;
            if (allSelected) {
                // Deselect all
                return new Set();
            } else {
                // Select all
                return new Set(products.map((p) => p.id));
            }
        });
    }, []);

    /**
     * Clear all selections
     */
    const clearSelection = useCallback(() => {
        setSelectedProducts(new Set());
    }, []);

    /**
     * Clean up selections when filtered products change
     * Remove selected products that are no longer in the filtered list
     */
    useEffect(() => {
        if (!isSelectionMode || selectedProducts.size === 0 || filteredProducts.length === 0) {
            return;
        }

        setSelectedProducts((prevSelected) => {
            const filteredIds = new Set(filteredProducts.map((p) => p.id));
            const validSelected = new Set();

            prevSelected.forEach((id) => {
                if (filteredIds.has(id)) {
                    validSelected.add(id);
                }
            });

            return validSelected.size !== prevSelected.size ? validSelected : prevSelected;
        });
    }, [filteredProducts, isSelectionMode, selectedProducts.size]);

    return {
        isSelectionMode,
        selectedProducts,
        toggleSelectionMode,
        toggleProductSelection,
        toggleSelectAll,
        clearSelection,
    };
}
