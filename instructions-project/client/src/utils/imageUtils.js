/**
 * Utility to construct image URLs consistently across environments (Dev/Prod).
 * Handles proxying and absolute/relative paths.
 */

import { getServerBaseUrl } from './serverUrl.js';

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
        // Usar getServerBaseUrl() para detectar automaticamente se está sendo acessado via IP da rede
        const serverBaseUrl = getServerBaseUrl();
        
        if (serverBaseUrl) {
            // Se temos uma URL base do servidor (acesso via IP da rede ou VITE_API_URL definido)
            // Garantir que o caminho inclui /api se necessário
            if (cleanPath.startsWith('/api/')) {
                return `${serverBaseUrl}${cleanPath}`;
            } else {
                // Se o caminho é /uploads/..., adicionar /api
                return `${serverBaseUrl}/api${cleanPath}`;
            }
        } else {
            // Sem URL base (usando proxy do Vite em localhost ou produção)
            // Server serves uploads at /api/uploads
            // Se path é /uploads/image.png, queremos /api/uploads/image.png
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
