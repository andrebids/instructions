/**
 * Product Constants
 * Centralized constants for product management
 */

// Valid Print Colors
export const VALID_PRINT_COLORS = [
    "WHITE",
    "DARK BLUE",
    "ICE BLUE",
    "GREY",
    "YELLOW",
    "BLACK",
    "GOLD",
    "ORANGE",
    "PINK",
    "RED",
    "LIGHT GREEN",
    "DARK GREEN",
    "PASTEL GREEN",
    "PURPLE"
];

// Valid LED Effects
export const VALID_LED_EFFECTS = [
    "LED AMBER",
    "LED WARM WHITE",
    "LED WARM WHITE + WARM WHITE FLASH",
    "LED WARM WHITE + PURE WHITE FLASH",
    "LED WARM WHITE + PURE WHITE SLOW FLASH",
    "LED PURE WHITE",
    "LED PURE WHITE + PURE WHITE FLASH",
    "LED PURE WHITE + WARM WHITE SLOW FLASH",
    "LED PURE WHITE + PURE WHITE SLOW FLASH",
    "LED BLUE",
    "LED BLUE + PURE WHITE FLASH",
    "LED BLUE + PURE WHITE SLOW FLASH",
    "LED PINK",
    "LED PINK + PURE WHITE FLASH",
    "LED RED",
    "LED RED + PURE WHITE FLASH",
    "LED RED + PURE WHITE SLOW FLASH",
    "LED GREEN",
    "LED GREEN + PURE WHITE FLASH",
    "RGB"
];

// Valid Sparkles (Animated Sparkles)
export const VALID_SPARKLES = [
    "WARM WHITE",
    "WARM WHITE/PURE WHITE",
    "PURE WHITE",
    "RGB"
];

// Valid Aluminium Colors (same as Print Colors)
export const VALID_ALUMINIUM_COLORS = VALID_PRINT_COLORS;

// Valid Soft XLED options
export const VALID_SOFT_XLED = ["PURE WHITE"];

// Tag Configurations
export const TAG_CONFIGS = {
    sale: {
        label: "Sale",
        color: "#ef4444",
        bgColor: "#ef444420",
        icon: "lucide:tag",
        priority: 2
    },
    priority: {
        label: "PRIORITY",
        color: "#f59e0b",
        bgColor: "#f59e0b20",
        icon: "lucide:star",
        priority: 1
    },
    new: {
        label: "New",
        color: "#10b981",
        bgColor: "#10b98120",
        icon: "lucide:sparkles",
        priority: 3
    },
    trending: {
        label: "Trending",
        color: "#8b5cf6",
        bgColor: "#8b5cf620",
        icon: "lucide:trending-up",
        priority: 4
    },
    summer: {
        label: "Summer",
        color: "#f59e0b",
        bgColor: "#f59e0b20",
        icon: "lucide:sun",
        priority: 4
    },
    christmas: {
        label: "Christmas",
        color: "#ef4444",
        bgColor: "#ef444420",
        icon: "lucide:gift",
        priority: 4
    }
};

// Default LED Colors
export const DEFAULT_COLORS = {
    brancoQuente: "#f4e1a1",
    brancoPuro: "#ffffff",
    rgb: "linear-gradient(135deg,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6)",
    vermelho: "#ef4444",
    verde: "#10b981",
    azul: "#3b82f6"
};

// Default Colors Order (for display)
export const DEFAULT_COLORS_ORDER = [
    'brancoQuente',
    'brancoPuro',
    'rgb',
    'vermelho',
    'verde',
    'azul'
];

// Tag normalization map
export const TAG_NORMALIZATION_MAP = {
    "sale": "sale",
    "priority": "priority",
    "priori": "priority",
    "new": "new",
    "trending": "trending",
    "summer": "summer",
    "christmas": "christmas",
    "xmas": "christmas"
};
