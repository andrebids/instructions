/**
 * useProductManagement Hook
 * Manages product CRUD operations and bulk actions
 */

import { useState, useCallback, useEffect } from 'react';
import { productsAPI } from '../../services/api';
import { useShop } from '../../context/ShopContext';
import {
    getValidPrintColors,
    getValidLEDEffects,
    getValidSparkles,
    getValidAluminiumColors,
    getValidSoftXLED,
    DEFAULT_COLORS,
    DEFAULT_COLORS_ORDER,
    TAG_NORMALIZATION_MAP
} from '../../utils/products';

/**
 * Get initial form data structure
 * @returns {Object} Initial form data
 */
function getInitialFormData() {
    return {
        name: '',
        stock: '',
        usedStock: '',
        prices: {
            new: {
                price: '',
                oldPrice: '',
                rentalPrice: '',
            },
            used: {
                price: '',
                rentalPrice: '',
            },
        },
        type: '',
        location: '',
        mount: '',
        tags: [],
        isActive: true,
        specs: {
            descricao: '',
            tecnicas: '',
            weight: '',
            effects: '',
            materiais: '',
            stockPolicy: '',
            printType: '',
            printColor: '',
            aluminium: '',
            softXLED: '',
            sparkle: '',
            sparkles: '',
        },
        availableColors: {},
        videoFile: '',
        releaseYear: '',
        season: '',
        height: '',
        width: '',
        depth: '',
        diameter: '',
    };
}

/**
 * Initialize years list (current year down to 2020)
 * @returns {number[]} Array of years
 */
function initializeYears() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 2020; year--) {
        years.push(year);
    }
    return years;
}

/**
 * Custom hook for managing products
 * @param {Function} onModalOpen - Function to open modal
 * @param {Function} onModalClose - Function to close modal
 * @param {Object} imageHandlers - Image handling functions
 * @param {Set} selectedProducts - Selected products for bulk operations
 * @param {Function} clearSelection - Function to clear selection
 * @returns {Object} Product management state and handlers
 */
export function useProductManagement(
    onModalOpen,
    onModalClose,
    imageHandlers,
    selectedProducts,
    clearSelection
) {
    const { fetchProducts } = useShop();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState(getInitialFormData());
    const [availableYears, setAvailableYears] = useState(initializeYears());
    const [availableColorsList, setAvailableColorsList] = useState({});

    /**
     * Load products from API
     */
    const loadProducts = useCallback((filters = {}, showArchived = false) => {
        console.log('🔄 [useProductManagement] loadProducts chamado');

        // Remove empty filters
        const cleanedFilters = {};
        for (const key in filters) {
            if (filters.hasOwnProperty(key)) {
                const value = filters[key];
                if (value !== '' && value !== null && value !== undefined) {
                    cleanedFilters[key] = value;
                }
            }
        }

        if (showArchived) {
            cleanedFilters.showArchived = 'true';
        }

        console.log('🔄 [useProductManagement] Filtros limpos:', cleanedFilters);
        setLoading(true);
        setError(null);

        productsAPI.getAll(cleanedFilters)
            .then((data) => {
                console.log('✅ [useProductManagement] Produtos recebidos:', data.length);
                setProducts(data);

                // Update available years
                const currentYear = new Date().getFullYear();
                const yearsSet = {};

                // Add years from current year to 2020
                for (let year = currentYear; year >= 2020; year--) {
                    yearsSet[year] = true;
                }

                // Add years from products
                for (let i = 0; i < data.length; i++) {
                    const productYear = data[i].releaseYear;
                    if (productYear) {
                        const yearValue = typeof productYear === 'number' ? productYear : parseInt(productYear, 10);
                        if (!isNaN(yearValue)) {
                            yearsSet[yearValue] = true;
                        }
                    }
                }

                // Create sorted years array (descending)
                const allYears = Object.keys(yearsSet).map((y) => parseInt(y, 10));
                allYears.sort((a, b) => b - a);
                setAvailableYears(allYears);
                setLoading(false);
            })
            .catch((err) => {
                console.error('❌ [useProductManagement] Erro ao carregar produtos:', err);
                setError(err.message || 'Error loading products');
                setLoading(false);
            });
    }, []);

    /**
     * Load available colors from API
     */
    const loadAvailableColors = useCallback(() => {
        productsAPI.getAvailableColors()
            .then((colors) => {
                // Merge default colors with database colors
                const mergedColors = Object.assign({}, DEFAULT_COLORS, colors || {});

                // Create ordered colors object
                const orderedColors = {};
                for (let i = 0; i < DEFAULT_COLORS_ORDER.length; i++) {
                    const colorKey = DEFAULT_COLORS_ORDER[i];
                    if (mergedColors.hasOwnProperty(colorKey)) {
                        orderedColors[colorKey] = mergedColors[colorKey];
                    }
                }

                // Add other colors not in default list
                for (const key in mergedColors) {
                    if (mergedColors.hasOwnProperty(key) && !orderedColors.hasOwnProperty(key)) {
                        orderedColors[key] = mergedColors[key];
                    }
                }

                setAvailableColorsList(orderedColors);
            })
            .catch((err) => {
                console.error('Erro ao carregar cores disponíveis:', err);
                setAvailableColorsList(DEFAULT_COLORS);
            });
    }, []);

    /**
     * Handle create new product
     */
    const handleCreateNew = useCallback(() => {
        setEditingProduct(null);
        const initialData = getInitialFormData();
        setFormData(initialData);
        imageHandlers.resetImages();
        loadAvailableColors();
        onModalOpen();
    }, [imageHandlers, loadAvailableColors, onModalOpen]);

    /**
     * Handle edit product
     */
    const handleEdit = useCallback((product) => {
        setEditingProduct(product);

        // Add product year to available years if needed
        let updatedYears = availableYears.slice();
        if (product.releaseYear) {
            const yearValue = typeof product.releaseYear === 'number'
                ? product.releaseYear
                : parseInt(product.releaseYear, 10);

            if (!isNaN(yearValue) && !updatedYears.includes(yearValue)) {
                updatedYears.push(yearValue);
                updatedYears.sort((a, b) => b - a);
                setAvailableYears(updatedYears);
            }
        }

        // Filter and validate specs
        const productSpecs = product.specs || {};

        const filteredPrintColor = productSpecs.printColor
            ? Array.from(getValidPrintColors(productSpecs.printColor))
            : [];
        const filteredEffects = productSpecs.effects
            ? Array.from(getValidLEDEffects(productSpecs.effects))
            : [];
        const filteredAluminium = productSpecs.aluminium
            ? Array.from(getValidAluminiumColors(productSpecs.aluminium))
            : [];
        const filteredSoftXLED = productSpecs.softXLED
            ? Array.from(getValidSoftXLED(productSpecs.softXLED))
            : [];
        const filteredSparkles = productSpecs.sparkles
            ? Array.from(getValidSparkles(productSpecs.sparkles))
            : [];

        // Sync materials field
        let syncedMateriais = productSpecs.materiais || '';

        // Add effects to materials
        filteredEffects.forEach((effect) => {
            if (effect && syncedMateriais.indexOf(effect) === -1) {
                syncedMateriais = syncedMateriais.trim();
                syncedMateriais += syncedMateriais ? `, ${effect}` : effect;
            }
        });

        // Add sparkles to materials
        filteredSparkles.forEach((sparkle) => {
            if (sparkle) {
                const pattern = `ANIMATED SPARKLES ${sparkle}`;
                if (syncedMateriais.indexOf(pattern) === -1) {
                    syncedMateriais = syncedMateriais.trim();
                    syncedMateriais += syncedMateriais ? `, ${pattern}` : pattern;
                }
            }
        });

        // Extract prices
        const usedPrice = productSpecs.usedPrice || '';
        const usedStock = productSpecs.usedStock || '';
        const newRentalPrice = productSpecs.newRentalPrice || '';
        const usedRentalPrice = productSpecs.usedRentalPrice || '';

        // Normalize tags
        const normalizedTags = (product.tags || []).map((tag) => {
            const tagLower = String(tag).toLowerCase().trim();
            return TAG_NORMALIZATION_MAP[tagLower] || tag;
        });

        // Remove duplicates
        const uniqueTags = Array.from(new Set(normalizedTags));

        setFormData({
            name: product.name || '',
            stock: product.stock || '',
            usedStock: usedStock,
            prices: {
                new: {
                    price: product.price || '',
                    oldPrice: product.oldPrice || '',
                    rentalPrice: newRentalPrice,
                },
                used: {
                    price: usedPrice,
                    rentalPrice: usedRentalPrice,
                },
            },
            type: product.type || '',
            location: product.location || '',
            mount: product.mount || '',
            tags: uniqueTags,
            isActive: product.isActive !== false,
            specs: {
                ...productSpecs,
                printColor: filteredPrintColor.length > 0
                    ? (filteredPrintColor.length === 1 ? filteredPrintColor[0] : filteredPrintColor)
                    : '',
                effects: filteredEffects.length > 0
                    ? (filteredEffects.length === 1 ? filteredEffects[0] : filteredEffects)
                    : null,
                aluminium: filteredAluminium.length > 0
                    ? (filteredAluminium.length === 1 ? filteredAluminium[0] : filteredAluminium)
                    : null,
                softXLED: filteredSoftXLED.length > 0
                    ? (filteredSoftXLED.length === 1 ? filteredSoftXLED[0] : filteredSoftXLED)
                    : null,
                sparkles: filteredSparkles.length > 0
                    ? (filteredSparkles.length === 1 ? filteredSparkles[0] : filteredSparkles)
                    : null,
                materiais: syncedMateriais,
            },
            availableColors: product.availableColors || {},
            videoFile: product.videoFile || '',
            releaseYear: product.releaseYear ? String(product.releaseYear) : '',
            season: product.season || '',
            height: product.height || '',
            width: product.width || '',
            depth: product.depth || '',
            diameter: product.diameter || '',
        });

        imageHandlers.setPreviewsFromUrls({
            dayImage: product.imagesDayUrl || null,
            nightImage: product.imagesNightUrl || null,
            animation: product.animationUrl || null,
            animationSimulation: product.animationSimulationUrl || null,
        });

        loadAvailableColors();
        onModalOpen();
    }, [availableYears, imageHandlers, loadAvailableColors, onModalOpen]);

    /**
     * Handle archive product
     */
    const handleArchive = useCallback((productId) => {
        if (!confirm('Are you sure you want to archive this product?')) return;

        productsAPI.archive(productId)
            .then(() => {
                loadProducts();
                fetchProducts();
            })
            .catch((err) => {
                console.error('Error archiving product:', err);
                setError(err.message || 'Error archiving product');
            });
    }, [loadProducts, fetchProducts]);

    /**
     * Handle unarchive product
     */
    const handleUnarchive = useCallback((productId) => {
        productsAPI.unarchive(productId)
            .then(() => {
                loadProducts();
                fetchProducts();
            })
            .catch((err) => {
                console.error('Error unarchiving product:', err);
                setError(err.message || 'Error unarchiving product');
            });
    }, [loadProducts, fetchProducts]);

    /**
     * Handle delete product
     */
    const handleDelete = useCallback((productId) => {
        if (!confirm('Are you sure you want to permanently delete this product? This action cannot be undone.')) return;

        productsAPI.delete(productId)
            .then(() => {
                loadProducts();
                fetchProducts();
            })
            .catch((err) => {
                console.error('Error deleting product:', err);
                setError(err.message || 'Error deleting product');
            });
    }, [loadProducts, fetchProducts]);

    /**
     * Handle bulk archive
     */
    const handleBulkArchive = useCallback(() => {
        if (selectedProducts.size === 0) return;
        if (!confirm(`Archive ${selectedProducts.size} product(s)?`)) return;

        const promises = Array.from(selectedProducts).map((id) => productsAPI.archive(id));

        Promise.all(promises)
            .then(() => {
                loadProducts();
                fetchProducts();
                clearSelection();
            })
            .catch((err) => {
                console.error('Error archiving products:', err);
                setError(err.message || 'Error archiving products');
            });
    }, [selectedProducts, loadProducts, fetchProducts, clearSelection]);

    /**
     * Handle bulk unarchive
     */
    const handleBulkUnarchive = useCallback(() => {
        if (selectedProducts.size === 0) return;
        if (!confirm(`Unarchive ${selectedProducts.size} product(s)?`)) return;

        const promises = Array.from(selectedProducts).map((id) => productsAPI.unarchive(id));

        Promise.all(promises)
            .then(() => {
                loadProducts();
                fetchProducts();
                clearSelection();
            })
            .catch((err) => {
                console.error('Error unarchiving products:', err);
                setError(err.message || 'Error unarchiving products');
            });
    }, [selectedProducts, loadProducts, fetchProducts, clearSelection]);

    /**
     * Handle bulk delete
     */
    const handleBulkDelete = useCallback(() => {
        if (selectedProducts.size === 0) return;
        if (!confirm(`Permanently delete ${selectedProducts.size} product(s)? This action cannot be undone.`)) return;

        const promises = Array.from(selectedProducts).map((id) => productsAPI.delete(id));

        Promise.all(promises)
            .then(() => {
                loadProducts();
                fetchProducts();
                clearSelection();
            })
            .catch((err) => {
                console.error('Error deleting products:', err);
                setError(err.message || 'Error deleting products');
            });
    }, [selectedProducts, loadProducts, fetchProducts, clearSelection]);

    /**
     * Handle add color
     */
    const handleAddColor = useCallback((colorName) => {
        if (!availableColorsList.hasOwnProperty(colorName)) return;

        setFormData((prev) => ({
            ...prev,
            availableColors: {
                ...prev.availableColors,
                [colorName]: availableColorsList[colorName],
            },
        }));
    }, [availableColorsList]);

    /**
     * Handle remove color
     */
    const handleRemoveColor = useCallback((colorName) => {
        setFormData((prev) => {
            const newColors = { ...prev.availableColors };
            delete newColors[colorName];
            return {
                ...prev,
                availableColors: newColors,
            };
        });
    }, []);

    /**
     * Handle submit (create or update product)
     */
    const handleSubmit = useCallback((formik) => {
        // Validate using Formik
        formik.validateForm().then((errors) => {
            if (Object.keys(errors).length > 0) {
                const firstError = Object.values(errors)[0];
                setError(typeof firstError === 'string' ? firstError : 'Please fix the form errors before submitting');
                formik.setTouched({
                    name: true,
                    stock: true,
                    'prices.new.price': true,
                    'prices.new.oldPrice': true,
                });
                return;
            }

            // Manual validation for required fields
            if (!formData.name || formData.name.trim() === '') {
                setError("The 'Name' field is required");
                return;
            }

            // Helper to convert empty values to null
            const toNullIfEmpty = (value) => {
                if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
                    return null;
                }
                return value;
            };

            // Process tags and auto-add/remove "sale" tag based on oldPrice
            let finalTags = formData.tags || [];
            const newPrice = formData.prices.new.price || '';
            const newOldPrice = formData.prices.new.oldPrice || '';
            const hasOldPrice = newOldPrice && parseFloat(newOldPrice) > 0;
            const hasPrice = newPrice && parseFloat(newPrice) > 0;
            const isOnSale = hasOldPrice && hasPrice && parseFloat(newOldPrice) > parseFloat(newPrice);

            // Normalize tags
            const normalizedFinalTags = [];
            for (let i = 0; i < finalTags.length; i++) {
                const tag = String(finalTags[i]).toLowerCase().trim();
                const normalizedTag = TAG_NORMALIZATION_MAP[tag] || tag;
                if (!normalizedFinalTags.includes(normalizedTag)) {
                    normalizedFinalTags.push(normalizedTag);
                }
            }
            finalTags = normalizedFinalTags;

            // Add/remove "sale" tag
            const hasSaleTag = finalTags.includes('sale');
            if (isOnSale && !hasSaleTag) {
                finalTags.push('sale');
            } else if (!isOnSale && hasSaleTag) {
                finalTags = finalTags.filter((t) => t !== 'sale');
            }

            // Clean specs (remove empty values)
            const cleanedSpecs = {};
            if (formData.specs) {
                Object.keys(formData.specs).forEach((key) => {
                    const value = formData.specs[key];
                    if (typeof value === 'string') {
                        if (value.trim() !== '') {
                            cleanedSpecs[key] = value;
                        }
                    } else if (value !== '' && value !== null && value !== undefined) {
                        if (Array.isArray(value)) {
                            if (value.length > 0) {
                                cleanedSpecs[key] = value;
                            }
                        } else {
                            cleanedSpecs[key] = value;
                        }
                    }
                });
            }

            // Add price-related fields to specs
            const usedPriceValue = formData.prices.used.price || '';
            const usedStockValue = formData.usedStock || '';
            const newRentalPriceValue = formData.prices.new.rentalPrice || '';
            const usedRentalPriceValue = formData.prices.used.rentalPrice || '';

            if (usedPriceValue && usedPriceValue.trim() !== '') {
                cleanedSpecs.usedPrice = usedPriceValue;
            } else {
                delete cleanedSpecs.usedPrice;
            }

            if (usedStockValue && usedStockValue.trim() !== '') {
                cleanedSpecs.usedStock = usedStockValue;
            } else {
                delete cleanedSpecs.usedStock;
            }

            if (newRentalPriceValue && newRentalPriceValue.trim() !== '') {
                cleanedSpecs.newRentalPrice = newRentalPriceValue;
            } else {
                delete cleanedSpecs.newRentalPrice;
            }

            if (usedRentalPriceValue && usedRentalPriceValue.trim() !== '') {
                cleanedSpecs.usedRentalPrice = usedRentalPriceValue;
            } else {
                delete cleanedSpecs.usedRentalPrice;
            }

            // Prepare data object
            const data = {
                name: formData.name,
                price: formData.prices.new.price || 0,
                stock: formData.stock || 0,
                oldPrice: toNullIfEmpty(newOldPrice),
                type: toNullIfEmpty(formData.type),
                location: toNullIfEmpty(formData.location),
                mount: toNullIfEmpty(formData.mount),
                videoFile: toNullIfEmpty(formData.videoFile),
                tags: finalTags,
                specs: Object.keys(cleanedSpecs).length > 0 ? cleanedSpecs : null,
                availableColors: formData.availableColors || {},
                variantProductByColor: formData.variantProductByColor || null,
                isActive: formData.isActive !== undefined ? formData.isActive : true,
                season: toNullIfEmpty(formData.season),
                isTrending: formData.isTrending || false,
                releaseYear: formData.releaseYear ? parseInt(formData.releaseYear, 10) : null,
                isOnSale: isOnSale,
                height: formData.height ? parseFloat(formData.height) : null,
                width: formData.width ? parseFloat(formData.width) : null,
                depth: formData.depth ? parseFloat(formData.depth) : null,
                diameter: formData.diameter ? parseFloat(formData.diameter) : null,
            };

            // Add image files if they exist
            if (imageHandlers.imageFiles.dayImage) data.dayImage = imageHandlers.imageFiles.dayImage;
            if (imageHandlers.imageFiles.nightImage) data.nightImage = imageHandlers.imageFiles.nightImage;
            if (imageHandlers.imageFiles.animation) data.animation = imageHandlers.imageFiles.animation;
            if (imageHandlers.imageFiles.animationSimulation) data.animationSimulation = imageHandlers.imageFiles.animationSimulation;

            console.log('📦 [useProductManagement] Enviando dados:', data);

            setLoading(true);
            setError(null);

            const promise = editingProduct
                ? productsAPI.update(editingProduct.id, data)
                : productsAPI.create(data);

            promise
                .then((saved) => {
                    console.log('🟢 [useProductManagement] Produto salvo:', saved);
                    setLoading(false);
                    onModalClose();
                    loadProducts();
                    fetchProducts();
                })
                .catch((err) => {
                    console.error('❌ [useProductManagement] Erro ao salvar produto:', err);
                    const errorMessage = err.response?.data?.error || err.message || 'Error saving product';
                    setError(errorMessage);
                    setLoading(false);
                });
        });
    }, [formData, editingProduct, imageHandlers, onModalClose, loadProducts, fetchProducts]);

    return {
        products,
        loading,
        error,
        setError,
        editingProduct,
        setEditingProduct,
        formData,
        setFormData,
        availableYears,
        availableColorsList,
        loadProducts,
        loadAvailableColors,
        handleCreateNew,
        handleEdit,
        handleArchive,
        handleUnarchive,
        handleDelete,
        handleBulkArchive,
        handleBulkUnarchive,
        handleBulkDelete,
        handleAddColor,
        handleRemoveColor,
        handleSubmit,
    };
}
