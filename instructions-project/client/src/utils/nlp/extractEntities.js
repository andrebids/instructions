/**
 * Extract entities (names, numbers, dates) from voice input
 */

/**
 * Extract budget/monetary values from text
 * Supports: "5000", "5000 euros", "€5000", "five thousand"
 */
export function extractBudget(text) {
    const lowerText = text.toLowerCase();

    // Pattern 1: Direct numbers with optional currency
    const numberPattern = /(\d+(?:[.,]\d+)?)\s*(?:euros?|€|eur)?/gi;
    const matches = [...lowerText.matchAll(numberPattern)];

    if (matches.length > 0) {
        // Return the first number found
        const value = matches[0][1].replace(',', '.');
        return parseFloat(value);
    }

    // Pattern 2: Written numbers (basic support)
    const writtenNumbers = {
        'mil': 1000,
        'thousand': 1000,
        'mille': 1000,
        'dois mil': 2000,
        'two thousand': 2000,
        'deux mille': 2000,
        'três mil': 3000,
        'three thousand': 3000,
        'trois mille': 3000,
        'cinco mil': 5000,
        'five thousand': 5000,
        'cinq mille': 5000,
        'dez mil': 10000,
        'ten thousand': 10000,
        'dix mille': 10000
    };

    for (const [written, value] of Object.entries(writtenNumbers)) {
        if (lowerText.includes(written)) {
            return value;
        }
    }

    return null;
}

/**
 * Extract client/person names from text
 * Looks for patterns like "for [Name]", "client [Name]", "para [Name]"
 */
export function extractClientName(text) {
    const patterns = [
        // English
        /(?:for|client(?:\s+is)?)\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþß]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþß]+)*)/i,
        // Portuguese
        /(?:para|cliente)\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþß]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþß]+)*)/i,
        // French
        /(?:pour|client)\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþß]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþß]+)*)/i,
        // Just capitalized names (fallback)
        /\b([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþß]+\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþß]+)\b/
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }

    return null;
}

/**
 * Extract project name from text
 * Usually the first noun phrase or after keywords like "projeto", "project", "projet"
 */
export function extractProjectName(text) {
    const lowerText = text.toLowerCase();

    // Remove common prefixes
    const prefixPatterns = [
        /^(?:criar?|create|créer)\s+(?:um?|a|novo?|new|nouveau)?\s*(?:projeto|project|projet)?\s*/i,
        /^(?:novo?|new|nouveau)\s+(?:projeto|project|projet)?\s*/i
    ];

    let cleanedText = text;
    for (const pattern of prefixPatterns) {
        cleanedText = cleanedText.replace(pattern, '');
    }

    // Look for project type keywords
    const projectTypes = [
        'kitchen', 'cozinha', 'cuisine',
        'bathroom', 'casa de banho', 'banheiro', 'salle de bain',
        'bedroom', 'quarto', 'chambre',
        'living room', 'sala', 'salon',
        'renovation', 'renovação', 'rénovation',
        'design', 'decoração', 'décoration',
        'interior', 'interiores'
    ];

    // Find the first project type mentioned
    for (const type of projectTypes) {
        const regex = new RegExp(`\\b(${type}(?:\\s+\\w+)*)`, 'i');
        const match = cleanedText.match(regex);
        if (match) {
            // Extract up to 4 words starting from the match
            const words = cleanedText.substring(match.index).split(/\s+/).slice(0, 4);
            return words.join(' ').replace(/[,;.].*$/, '').trim();
        }
    }

    // Fallback: take first few words (up to first comma or "for"/"para"/"pour")
    const fallbackMatch = cleanedText.match(/^([^,]+?)(?:\s+(?:for|para|pour|client|budget|€|\d)|\s*,|$)/i);
    if (fallbackMatch && fallbackMatch[1].trim()) {
        return fallbackMatch[1].trim();
    }

    return null;
}

/**
 * Extract all entities from a voice input
 */
export function extractAllEntities(text) {
    return {
        projectName: extractProjectName(text),
        clientName: extractClientName(text),
        budget: extractBudget(text)
    };
}
