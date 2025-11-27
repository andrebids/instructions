/**
 * Product Utilities
 * Centralized exports for all product-related utilities
 */

// Constants
export {
    VALID_PRINT_COLORS,
    VALID_LED_EFFECTS,
    VALID_SPARKLES,
    VALID_ALUMINIUM_COLORS,
    VALID_SOFT_XLED,
    TAG_CONFIGS,
    DEFAULT_COLORS,
    DEFAULT_COLORS_ORDER,
    TAG_NORMALIZATION_MAP
} from './productConstants';

// Color Validation
export {
    getValidPrintColors,
    getValidLEDEffects,
    getValidSparkles,
    getValidAluminiumColors,
    getValidSoftXLED
} from './colorValidation';

// Color Mapping
export {
    getPrintColorStyle,
    getColorHex
} from './colorMapping';
