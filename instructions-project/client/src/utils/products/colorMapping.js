/**
 * Color Mapping Utilities
 * Functions to map color names to hex values and styles
 */

/**
 * Color map for Print Colors (dark version with soft tones)
 */
const PRINT_COLOR_MAP = {
    "WHITE": { bg: "#8C8780", text: "#FFF9E6" },
    "DARK BLUE": { bg: "#2C4466", text: "#6BAAFF" },
    "ICE BLUE": { bg: "#3A5F6F", text: "#87E5FF" },
    "GREY": { bg: "#5A5A5A", text: "#E6E6E6" },
    "YELLOW": { bg: "#8C7A3C", text: "#FFE44D" },
    "BLACK": { bg: "#4A4A4A", text: "#D0D0D0" },
    "GOLD": { bg: "#8C7A3C", text: "#FFD700" },
    "ORANGE": { bg: "#8C5C3C", text: "#FF9554" },
    "PINK": { bg: "#8C5C6E", text: "#FFB5DA" },
    "RED": { bg: "#8C3C3C", text: "#FF6B6B" },
    "LIGHT GREEN": { bg: "#5C7A5A", text: "#8FFF8F" },
    "DARK GREEN": { bg: "#4A6642", text: "#6BFF6B" },
    "PASTEL GREEN": { bg: "#6A8C6A", text: "#A8FFA8" },
    "PURPLE": { bg: "#6A5C8C", text: "#C47FFF" },
};

/**
 * Get style for Print Color chip
 * @param {string} colorName - Name of the color
 * @param {boolean} isSelected - Whether the color is selected
 * @returns {Object} Style object with backgroundColor and color
 */
export function getPrintColorStyle(colorName, isSelected) {
    // Only apply color if selected
    if (!isSelected) return {};

    const colorData = PRINT_COLOR_MAP[colorName] || { bg: "#8C8780", text: "#E0A830" };
    return {
        backgroundColor: colorData.bg,
        color: colorData.text,
    };
}

/**
 * Get hex color based on color name (for LED colors)
 * @param {string} colorName - Name of the color
 * @returns {string} Hex color code
 */
export function getColorHex(colorName) {
    if (!colorName) return '#cccccc';

    const nameLower = colorName.toLowerCase();

    if (nameLower.indexOf('brancopuro') >= 0 || nameLower === 'brancopuro') {
        return '#ffffff';
    }
    if (nameLower.indexOf('brancoquente') >= 0 || nameLower.indexOf('quente') >= 0 || nameLower === 'brancoquente') {
        return '#f4e1a1';
    }
    if (nameLower.indexOf('vermelho') >= 0) {
        return '#ef4444';
    }
    if (nameLower.indexOf('azul') >= 0) {
        return '#3b82f6';
    }
    if (nameLower.indexOf('verde') >= 0) {
        return '#10b981';
    }
    if (nameLower.indexOf('rgb') >= 0) {
        return '#ef4444'; // RGB gradient, use red as representation
    }

    return '#cccccc';
}
