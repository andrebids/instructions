/**
 * Canvas utility functions for image annotation
 */

/**
 * Draw a rectangle on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} startX - Starting X coordinate
 * @param {number} startY - Starting Y coordinate
 * @param {number} endX - Ending X coordinate
 * @param {number} endY - Ending Y coordinate
 * @param {string} color - Stroke color
 * @param {number} lineWidth - Line width
 */
export function drawRectangle(ctx, startX, startY, endX, endY, color, lineWidth) {
    const width = endX - startX;
    const height = endY - startY;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(startX, startY, width, height);
}

/**
 * Draw an arrow on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} fromX - Starting X coordinate
 * @param {number} fromY - Starting Y coordinate
 * @param {number} toX - Ending X coordinate
 * @param {number} toY - Ending Y coordinate
 * @param {string} color - Stroke color
 * @param {number} lineWidth - Line width
 */
export function drawArrow(ctx, fromX, fromY, toX, toY, color, lineWidth) {
    const headLength = 15 + lineWidth * 2; // Arrow head length
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;

    // Draw the line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw the arrow head
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
        toX - headLength * Math.cos(angle - Math.PI / 6),
        toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        toX - headLength * Math.cos(angle + Math.PI / 6),
        toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
}

/**
 * Merge an image with canvas annotations
 * @param {string} imageUrl - URL of the original image
 * @param {HTMLCanvasElement} annotationCanvas - Canvas with annotations
 * @returns {Promise<string>} - Data URL of merged image
 */
export async function mergeImageWithAnnotations(imageUrl, annotationCanvas) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            // Create a new canvas for merging
            const mergedCanvas = document.createElement('canvas');
            mergedCanvas.width = annotationCanvas.width;
            mergedCanvas.height = annotationCanvas.height;
            const ctx = mergedCanvas.getContext('2d');

            // Draw the original image
            ctx.drawImage(img, 0, 0, mergedCanvas.width, mergedCanvas.height);

            // Draw the annotations on top
            ctx.drawImage(annotationCanvas, 0, 0);

            // Convert to data URL
            resolve(mergedCanvas.toDataURL('image/png'));
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        img.src = imageUrl;
    });
}

/**
 * Convert canvas to Blob
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} type - MIME type (default: 'image/png')
 * @returns {Promise<Blob>} - Blob of the canvas content
 */
export function canvasToBlob(canvas, type = 'image/png') {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to convert canvas to blob'));
            }
        }, type);
    });
}

/**
 * Calculate canvas dimensions maintaining aspect ratio
 * @param {number} imageWidth - Original image width
 * @param {number} imageHeight - Original image height
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {{width: number, height: number}} - Calculated dimensions
 */
export function calculateCanvasDimensions(imageWidth, imageHeight, maxWidth, maxHeight) {
    let width = imageWidth;
    let height = imageHeight;

    // Calculate aspect ratio
    const aspectRatio = imageWidth / imageHeight;

    // Scale down if needed
    if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
    }

    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
    }

    return {
        width: Math.floor(width),
        height: Math.floor(height)
    };
}
