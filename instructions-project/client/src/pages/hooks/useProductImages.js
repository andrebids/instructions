/**
 * useProductImages Hook
 * Manages image and video file uploads and previews for products
 */

import { useState, useCallback } from 'react';

/**
 * Custom hook for managing product images
 * @returns {Object} Image management state and handlers
 */
export function useProductImages() {
    const [imageFiles, setImageFiles] = useState({
        dayImage: null,
        nightImage: null,
        animation: null,
        animationSimulation: null,
    });

    const [imagePreviews, setImagePreviews] = useState({
        dayImage: null,
        nightImage: null,
        animation: null,
        animationSimulation: null,
    });

    /**
     * Handle image/video file change
     * @param {string} field - Field name (dayImage, nightImage, animation, animationSimulation)
     * @param {File} file - File object
     */
    const handleImageChange = useCallback((field, file) => {
        if (!file) return;

        // Update file state
        setImageFiles((prev) => ({
            ...prev,
            [field]: file,
        }));

        // Create preview
        const reader = new FileReader();
        reader.onerror = (error) => {
            console.error(`Error reading ${field}:`, error);
        };
        reader.onload = (e) => {
            setImagePreviews((prev) => ({
                ...prev,
                [field]: e.target.result,
            }));
        };
        reader.readAsDataURL(file);
    }, []);

    /**
     * Reset all images and previews
     */
    const resetImages = useCallback(() => {
        setImageFiles({
            dayImage: null,
            nightImage: null,
            animation: null,
            animationSimulation: null,
        });
        setImagePreviews({
            dayImage: null,
            nightImage: null,
            animation: null,
            animationSimulation: null,
        });
    }, []);

    /**
     * Set image previews (for editing existing products)
     * @param {Object} previews - Preview URLs
     */
    const setPreviewsFromUrls = useCallback((previews) => {
        setImagePreviews(previews);
    }, []);

    /**
     * Clear a specific preview (on error)
     * @param {string} field - Field name to clear
     */
    const clearPreview = useCallback((field) => {
        setImagePreviews((prev) => {
            const newPreviews = { ...prev };
            delete newPreviews[field];
            return newPreviews;
        });
    }, []);

    return {
        imageFiles,
        imagePreviews,
        handleImageChange,
        resetImages,
        setPreviewsFromUrls,
        clearPreview,
    };
}
