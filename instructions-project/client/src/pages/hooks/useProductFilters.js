/**
 * useProductFilters Hook
 * Manages product filtering, search, and sorting
 */

import { useState, useCallback, useMemo } from 'react';
import {
    compareProductsByTagHierarchy,
    getProductHierarchyIndex,
    getNormalizedProductTags,
    normalizeTag,
} from '../../utils/tagHierarchy';

/**
 * Custom hook for managing product filters
 * @param {Array} products - All products
 * @returns {Object} Filter state, filtered products, and handlers
 */
export function useProductFilters(products = []) {
    const [filters, setFilters] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    /**
     * Get other tags count (excluding priority)
     * @param {Object} product - Product object
     * @returns {number} Count of other tags
     */
    const getOtherTagsCount = useCallback((product) => {
        const normalizedTags = getNormalizedProductTags(product);
        if (!Array.isArray(normalizedTags) || normalizedTags.length === 0) return 0;

        let count = 0;
        for (let i = 0; i < normalizedTags.length; i++) {
            if (normalizedTags[i] !== 'priority') count++;
        }
        return count;
    }, []);

    /**
     * Get stock value (with fallback calculation)
     * @param {Object} product - Product object
     * @returns {number} Stock value
     */
    const getStock = useCallback((product) => {
        if (typeof product.stock === 'number' && Number.isFinite(product.stock)) {
            return product.stock;
        }

        try {
            let sum = 0;
            const id = String(product.id || '');
            for (let idx = 0; idx < id.length; idx++) {
                sum += id.charCodeAt(idx);
            }
            return 5 + (sum % 60);
        } catch (_) {
            return 20;
        }
    }, []);

    /**
     * Filter and sort products based on current filters
     */
    const filteredProducts = useMemo(() => {
        let filtered = Array.isArray(products) ? products.slice() : [];

        // Apply search query
        if (searchQuery) {
            filtered = filtered.filter((p) =>
                p.name.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0
            );
        }

        // Apply type filter
        if (filters.type) {
            filtered = filtered.filter((p) => p.type === filters.type);
        }

        // Apply location filter
        if (filters.location) {
            filtered = filtered.filter((p) => p.location === filters.location);
        }

        // Apply tag filter
        if (filters.tag) {
            const rawTagFilter = String(filters.tag).trim().toLowerCase();
            const normalizedFilter = normalizeTag(filters.tag);

            filtered = filtered.filter((p) => {
                const normalizedTags = getNormalizedProductTags(p);
                if (normalizedFilter && normalizedTags.includes(normalizedFilter)) {
                    return true;
                }
                if (!rawTagFilter) return false;
                return normalizedTags.some((tag) => tag.indexOf(rawTagFilter) >= 0);
            });
        }

        // Sort products by tag hierarchy
        filtered = filtered.sort((a, b) => {
            const hierarchyComparison = compareProductsByTagHierarchy(a, b);
            if (hierarchyComparison !== 0) return hierarchyComparison;

            const hierarchyIndex = getProductHierarchyIndex(a);

            if (hierarchyIndex === 0) {
                // Priority products: sort by other tags count, then stock, then price, then name
                const otherTagsA = getOtherTagsCount(a);
                const otherTagsB = getOtherTagsCount(b);
                if (otherTagsA !== otherTagsB) {
                    return otherTagsB - otherTagsA;
                }

                const stockA = getStock(a);
                const stockB = getStock(b);
                if (stockA !== stockB) {
                    return stockB - stockA;
                }

                const priceA = typeof a.price === 'number' && Number.isFinite(a.price) ? a.price : 0;
                const priceB = typeof b.price === 'number' && Number.isFinite(b.price) ? b.price : 0;
                if (priceA !== priceB) {
                    return priceB - priceA;
                }

                return (a.name || '').localeCompare(b.name || '');
            }

            return (a.name || '').localeCompare(b.name || '');
        });

        return filtered;
    }, [products, searchQuery, filters, getOtherTagsCount, getStock]);

    /**
     * Handle search (can be used for API search if needed)
     */
    const handleSearch = useCallback(() => {
        // Currently using client-side filtering
        // This can be extended to call an API search endpoint if needed
        console.log('Search query:', searchQuery);
    }, [searchQuery]);

    /**
     * Clear all filters
     */
    const clearFilters = useCallback(() => {
        setFilters({});
        setSearchQuery('');
    }, []);

    return {
        filters,
        setFilters,
        searchQuery,
        setSearchQuery,
        showArchived,
        setShowArchived,
        filteredProducts,
        handleSearch,
        clearFilters,
    };
}
