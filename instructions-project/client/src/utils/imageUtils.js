/**
 * Utility to construct image URLs consistently across environments (Dev/Prod).
 * Handles proxying and absolute/relative paths.
 */

/**
 * SVG placeholder image as base64 data URL
 * Reusable placeholder for product images when no image is available
 */
export const PLACEHOLDER_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';

export const getImageUrl = (path) => {
    if (!path) return null;

    // If it's already a full URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }

    // Clean the path
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // If it's an upload path, we need to ensure it's served correctly
    if (cleanPath.startsWith('/uploads/')) {
        // In development, we might have VITE_API_URL defined
        const apiUrl = import.meta.env.VITE_API_URL;

        if (apiUrl) {
            // Remove trailing slash from API URL if present
            const base = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
            // Remove /api suffix if present, as uploads are usually served from root or /api/uploads depending on server config
            // Based on server/src/app.js: app.use('/api/uploads', express.static(...))
            // So we should prepend /api if we want to go through the proxy or direct to server

            // If VITE_API_URL includes /api, we can use it directly if the server serves uploads at /api/uploads
            // The server app.js has: app.use('/api/uploads', express.static(...))
            // So /uploads/file.jpg becomes /api/uploads/file.jpg

            // However, the previous logic in AdminProducts was:
            // abs = baseApi ? (baseApi + choose) : ('/api' + choose);

            // Let's standardize:
            // If path is /uploads/image.png
            // And we want to hit http://localhost:5000/api/uploads/image.png

            // If VITE_API_URL is http://localhost:5000/api
            // We want http://localhost:5000/api/uploads/image.png

            // If we are using proxy (VITE_API_URL undefined), we want /api/uploads/image.png

            // Check if path already includes /api/
            if (cleanPath.startsWith('/api/')) {
                return `${base}${cleanPath.replace('/api', '')}`;
            }

            return `${base}${cleanPath}`;
        } else {
            // No VITE_API_URL (likely using Vite proxy or production same-origin)
            // If we are using Vite proxy, /api requests are forwarded
            // Server serves uploads at /api/uploads

            // If path is /uploads/image.png, we want /api/uploads/image.png to go through proxy/server
            if (!cleanPath.startsWith('/api/')) {
                return `/api${cleanPath}`;
            }
            return cleanPath;
        }
    }

    // For other static assets (not uploads), return as is (relative to public)
    return cleanPath;
};

/**
 * Helper to validate if an image URL is a temporary/invalid one
 * IMPORTANTE: Permitir arquivos WebP com prefixo temp_ porque são arquivos convertidos válidos
 */
export const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;

    // IMPORTANTE: Permitir arquivos WebP com prefixo temp_ porque são arquivos convertidos válidos
    // O processImageToWebP converte para WebP mas mantém o prefixo temp_ no nome
    const isWebP = trimmed.toLowerCase().endsWith('.webp');
    const hasTemp = trimmed.includes('temp_');
    
    // Filtrar apenas arquivos temporários que NÃO são WebP
    // Estes são uploads em progresso que nunca foram convertidos
    if (hasTemp && !isWebP) {
        return false;
    }

    return true;
};
