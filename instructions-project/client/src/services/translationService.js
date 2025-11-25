/**
 * Translation Service
 * Uses MyMemory Translation API for automatic text translation
 */

const TRANSLATION_API_URL = 'https://api.mymemory.translated.net/get';

// Language codes mapping
export const LANGUAGES = {
    PT: { code: 'pt', label: 'Português', flag: '🇵🇹' },
    EN: { code: 'en', label: 'English', flag: '🇬🇧' },
    FR: { code: 'fr', label: 'Français', flag: '🇫🇷' },
};

/**
 * Translate text to target language
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (pt, en, fr)
 * @param {string} sourceLang - Source language code (optional, auto-detect if not provided)
 * @returns {Promise<{translatedText: string, detectedSourceLang: string}>}
 */
export async function translateText(text, targetLang, sourceLang = null) {
    if (!text || !text.trim()) {
        throw new Error('Text to translate is required');
    }

    if (!targetLang) {
        throw new Error('Target language is required');
    }

    try {
        // Build language pair - MyMemory requires source|target format
        // Default to 'en' as source if not provided, as most content is English
        const langPair = sourceLang ? `${sourceLang}|${targetLang}` : `en|${targetLang}`;

        // Encode text for URL
        const encodedText = encodeURIComponent(text);

        // Build API URL
        const url = `${TRANSLATION_API_URL}?q=${encodedText}&langpair=${langPair}`;

        console.log('🌐 [Translation] Requesting:', { text: text.substring(0, 50), langPair, url });

        // Make request
        const response = await fetch(url);

        if (!response.ok) {
            console.error('❌ [Translation] HTTP error:', response.status, response.statusText);
            throw new Error(`Translation API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('📥 [Translation] Response:', data);

        // Check for API errors
        if (data.responseStatus !== 200) {
            // Handle "same language" or invalid pair errors gracefully
            // If the API complains about the pair (e.g. en|en), just return original text
            if (data.responseDetails && (
                data.responseDetails.includes('INVALID TARGET LANGUAGE') ||
                data.responseDetails.includes('same language') ||
                data.responseDetails.includes('IS AN INVALID')
            )) {
                console.warn('⚠️ [Translation] Same language or invalid pair detected, returning original text.');
                return {
                    translatedText: text,
                    detectedSourceLang: sourceLang || 'en'
                };
            }

            console.error('❌ [Translation] API error:', data.responseStatus, data.responseDetails);
            throw new Error(data.responseDetails || 'Translation failed');
        }

        console.log('✅ [Translation] Success:', data.responseData.translatedText);

        // Extract source language from match field
        let detectedLang = sourceLang || 'unknown';
        if (data.responseData.match && typeof data.responseData.match === 'string') {
            detectedLang = data.responseData.match.split('|')[0];
        }

        return {
            translatedText: data.responseData.translatedText,
            detectedSourceLang: detectedLang,
        };
    } catch (error) {
        console.error('❌ [Translation] Error:', error);
        throw new Error(`Failed to translate: ${error.message}`);
    }
}

/**
 * Detect language of text
 * @param {string} text - Text to analyze
 * @returns {Promise<string>} - Detected language code
 */
export async function detectLanguage(text) {
    if (!text || !text.trim()) {
        return 'unknown';
    }

    try {
        // Use translation API with a dummy target to detect source language
        const result = await translateText(text, 'en');
        return result.detectedSourceLang;
    } catch (error) {
        console.error('Language detection error:', error);
        return 'unknown';
    }
}

/**
 * Get language label from code
 * @param {string} code - Language code
 * @returns {string} - Language label with flag
 */
export function getLanguageLabel(code) {
    const lang = Object.values(LANGUAGES).find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.label}` : code;
}
