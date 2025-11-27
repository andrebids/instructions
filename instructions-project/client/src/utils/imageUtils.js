/**
 * Utility to construct image URLs consistently across environments (Dev/Prod).
 * Handles proxying and absolute/relative paths.
 */

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
 */
export const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;

    // Filter temporary URLs that might not exist anymore
    if (trimmed.includes('temp_nightImage_') ||
        trimmed.includes('temp_dayImage_') ||
        (trimmed.includes('temp_') && trimmed.includes('/uploads/'))) {
        return false;
    }

    return true;
};
