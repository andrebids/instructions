/**
 * Language Detection Utility
 * Detects the language of text content for proper TTS voice selection
 * Supports: Portuguese (PT), English (EN), French (FR)
 */

/**
 * Language-specific keyword dictionaries
 * These are high-frequency words that are unique to each language
 */
const LANGUAGE_KEYWORDS = {
    pt: [
        // Articles and prepositions
        'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
        'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
        'para', 'pelo', 'pela', 'com', 'por', 'ao', 'à', 'aos', 'às',
        // Common verbs
        'é', 'são', 'está', 'estão', 'foi', 'foram', 'ser', 'estar',
        'ter', 'tem', 'têm', 'fazer', 'faz', 'fazem',
        // Question words
        'que', 'qual', 'quais', 'quando', 'onde', 'como', 'porque', 'porquê',
        // Common words
        'não', 'sim', 'mais', 'muito', 'bem', 'já', 'ainda', 'também',
        'esse', 'essa', 'isso', 'este', 'esta', 'isto',
        // Portuguese-specific
        'você', 'vocês', 'senhor', 'senhora', 'obrigado', 'obrigada',
        'entendi', 'entendido', 'projeto', 'cliente', 'orçamento'
    ],
    en: [
        // Articles and prepositions
        'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for',
        'with', 'by', 'from', 'about', 'into', 'through',
        // Common verbs
        'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did',
        // Question words
        'what', 'which', 'when', 'where', 'how', 'why', 'who', 'whom',
        // Common words
        'not', 'yes', 'no', 'more', 'very', 'well', 'just', 'also',
        'this', 'that', 'these', 'those',
        // English-specific
        'you', 'your', 'thank', 'thanks', 'please', 'understood',
        'project', 'client', 'budget'
    ],
    fr: [
        // Articles and prepositions
        'le', 'la', 'les', 'un', 'une', 'des', 'du',
        'de', 'à', 'au', 'aux', 'dans', 'pour', 'avec', 'par', 'sur',
        // Common verbs
        'est', 'sont', 'était', 'étaient', 'être', 'été',
        'avoir', 'a', 'ont', 'avait', 'faire', 'fait', 'font',
        // Question words
        'que', 'quel', 'quelle', 'quels', 'quelles', 'quand', 'où',
        'comment', 'pourquoi', 'qui',
        // Common words
        'pas', 'ne', 'oui', 'non', 'plus', 'très', 'bien', 'déjà', 'aussi',
        'ce', 'cet', 'cette', 'ces',
        // French-specific
        'vous', 'votre', 'merci', 's\'il', 'compris', 'entendu',
        'projet', 'client', 'budget'
    ]
};

/**
 * Common words that appear in multiple languages (to be weighted less)
 */
const COMMON_ACROSS_LANGUAGES = new Set([
    'ok', 'email', 'internet', 'online', 'web', 'app', 'design',
    'euro', 'euros', 'café', 'hotel', 'restaurant', 'taxi'
]);

/**
 * Detect the language of a text string
 * @param {string} text - Text to analyze
 * @param {string} fallbackLang - Language to use if detection is uncertain (default: 'pt')
 * @returns {Object} - { language: 'pt'|'en'|'fr', confidence: 0-1 }
 */
export function detectLanguage(text, fallbackLang = 'pt') {
    if (!text || typeof text !== 'string') {
        return { language: fallbackLang, confidence: 0 };
    }

    // Normalize text: lowercase and remove punctuation
    const normalizedText = text.toLowerCase()
        .replace(/[.,!?;:()[\]{}"""'']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!normalizedText) {
        return { language: fallbackLang, confidence: 0 };
    }

    // Split into words
    const words = normalizedText.split(' ').filter(w => w.length > 0);

    if (words.length === 0) {
        return { language: fallbackLang, confidence: 0 };
    }

    // Count matches for each language
    const scores = {
        pt: 0,
        en: 0,
        fr: 0
    };

    words.forEach(word => {
        // Skip common cross-language words
        if (COMMON_ACROSS_LANGUAGES.has(word)) {
            return;
        }

        // Check against each language's keywords
        Object.keys(LANGUAGE_KEYWORDS).forEach(lang => {
            if (LANGUAGE_KEYWORDS[lang].includes(word)) {
                scores[lang] += 1;
            }
        });
    });

    // Calculate total matches
    const totalMatches = scores.pt + scores.en + scores.fr;

    // If no matches found, return fallback with low confidence
    if (totalMatches === 0) {
        return { language: fallbackLang, confidence: 0.3 };
    }

    // Find language with highest score
    let detectedLang = fallbackLang;
    let maxScore = 0;

    Object.entries(scores).forEach(([lang, score]) => {
        if (score > maxScore) {
            maxScore = score;
            detectedLang = lang;
        }
    });

    // Calculate confidence based on:
    // 1. Percentage of words matched
    // 2. Dominance of winning language
    const matchPercentage = totalMatches / words.length;
    const dominance = maxScore / totalMatches;

    // Confidence formula: weighted average
    const confidence = Math.min(
        (matchPercentage * 0.6) + (dominance * 0.4),
        1.0
    );

    return {
        language: detectedLang,
        confidence: parseFloat(confidence.toFixed(2))
    };
}

/**
 * Detect if text is primarily in a specific language
 * @param {string} text - Text to analyze
 * @param {string} expectedLang - Expected language code
 * @param {number} threshold - Confidence threshold (default: 0.5)
 * @returns {boolean} - True if text matches expected language
 */
export function isLanguage(text, expectedLang, threshold = 0.5) {
    const detection = detectLanguage(text, expectedLang);
    return detection.language === expectedLang && detection.confidence >= threshold;
}

/**
 * Get the dominant language from a list of texts
 * Useful for analyzing conversation history
 * @param {string[]} texts - Array of text strings
 * @param {string} fallbackLang - Fallback language
 * @returns {string} - Dominant language code
 */
export function getDominantLanguage(texts, fallbackLang = 'pt') {
    if (!texts || texts.length === 0) {
        return fallbackLang;
    }

    const languageCounts = {
        pt: 0,
        en: 0,
        fr: 0
    };

    texts.forEach(text => {
        const detection = detectLanguage(text, fallbackLang);
        if (detection.confidence > 0.4) {
            languageCounts[detection.language]++;
        }
    });

    let dominantLang = fallbackLang;
    let maxCount = 0;

    Object.entries(languageCounts).forEach(([lang, count]) => {
        if (count > maxCount) {
            maxCount = count;
            dominantLang = lang;
        }
    });

    return dominantLang;
}
