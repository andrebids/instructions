/**
 * Color Validation Utilities
 * Functions to validate and filter color values for products
 */

import {
    VALID_PRINT_COLORS,
    VALID_LED_EFFECTS,
    VALID_SPARKLES,
    VALID_ALUMINIUM_COLORS,
    VALID_SOFT_XLED
} from './productConstants';

/**
 * Validate and filter Print Color values
 * @param {string|string[]} printColor - Print color value(s)
 * @returns {Set<string>} Set of valid print colors
 */
export function getValidPrintColors(printColor) {
    if (!printColor) {
        return new Set();
    }

    const selectedColors = Array.isArray(printColor) ? printColor : [printColor];
    const validSelectedColors = selectedColors.filter((color) => {
        if (!color || typeof color !== 'string') {
            return false;
        }

        const isValid = VALID_PRINT_COLORS.includes(color);
        if (!isValid && color.trim() !== '') {
            console.warn("⚠️ [PRINT COLOR] Valor inválido filtrado:", color);
        }
        return isValid;
    });

    return new Set(validSelectedColors);
}

/**
 * Validate and filter LED Effects values
 * @param {string|string[]} effects - LED effects value(s)
 * @returns {Set<string>} Set of valid LED effects
 */
export function getValidLEDEffects(effects) {
    if (!effects) {
        return new Set();
    }

    const selectedEffects = Array.isArray(effects) ? effects : [effects];
    const validSelectedEffects = selectedEffects.filter((effect) => {
        if (!effect || typeof effect !== 'string') {
            return false;
        }

        const isValid = VALID_LED_EFFECTS.includes(effect);
        if (!isValid && effect.trim() !== '') {
            console.warn("⚠️ [LED EFFECTS] Valor inválido filtrado:", effect);
        }
        return isValid;
    });

    return new Set(validSelectedEffects);
}

/**
 * Validate and filter Sparkles values
 * @param {string|string[]} sparkles - Sparkles value(s)
 * @returns {Set<string>} Set of valid sparkles
 */
export function getValidSparkles(sparkles) {
    if (!sparkles) {
        return new Set();
    }

    const selectedSparkles = Array.isArray(sparkles) ? sparkles : [sparkles];
    const validSelectedSparkles = selectedSparkles.filter((sparkle) => {
        if (!sparkle || typeof sparkle !== 'string') {
            return false;
        }

        const isValid = VALID_SPARKLES.includes(sparkle);
        if (!isValid && sparkle.trim() !== '') {
            console.warn("⚠️ [SPARKLES] Valor inválido filtrado:", sparkle);
        }
        return isValid;
    });

    return new Set(validSelectedSparkles);
}

/**
 * Validate and filter Aluminium Color values
 * @param {string|string[]} aluminium - Aluminium color value(s)
 * @returns {Set<string>} Set of valid aluminium colors
 */
export function getValidAluminiumColors(aluminium) {
    if (!aluminium) {
        return new Set();
    }

    const selectedColors = Array.isArray(aluminium) ? aluminium : [aluminium];
    const validSelectedColors = selectedColors.filter((color) => {
        if (!color || typeof color !== 'string') {
            return false;
        }

        const isValid = VALID_ALUMINIUM_COLORS.includes(color);
        if (!isValid && color.trim() !== '') {
            console.warn("⚠️ [ALUMINIUM] Valor inválido filtrado:", color);
        }
        return isValid;
    });

    return new Set(validSelectedColors);
}

/**
 * Validate and filter Soft XLED values
 * @param {string|string[]} softXLED - Soft XLED value(s)
 * @returns {Set<string>} Set of valid Soft XLED options
 */
export function getValidSoftXLED(softXLED) {
    if (!softXLED) {
        return new Set();
    }

    const selectedOptions = Array.isArray(softXLED) ? softXLED : [softXLED];
    const validSelectedOptions = selectedOptions.filter((option) => {
        if (!option || typeof option !== 'string') {
            return false;
        }

        const isValid = VALID_SOFT_XLED.includes(option);
        if (!isValid && option.trim() !== '') {
            console.warn("⚠️ [SOFT XLED] Valor inválido filtrado:", option);
        }
        return isValid;
    });

    return new Set(validSelectedOptions);
}
