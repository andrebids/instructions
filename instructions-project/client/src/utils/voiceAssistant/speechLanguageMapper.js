/**
 * Speech Language Mapper
 * Maps detected language codes to Web Speech API language codes
 * Handles voice selection and regional preferences
 */

/**
 * Map language codes to Speech Synthesis API language codes
 * @param {string} languageCode - Short language code ('pt', 'en', 'fr')
 * @param {string} preferredRegion - Preferred regional variant (default: auto)
 * @returns {string} - Speech API language code (e.g., 'pt-PT', 'en-US', 'fr-FR')
 */
export function mapToSpeechLang(languageCode, preferredRegion = null) {
    const mapping = {
        // Portuguese: Always prefer pt-PT (European Portuguese)
        // pt-BR only used if explicitly requested via preferredRegion
        pt: 'pt-PT',
        en: preferredRegion === 'GB' ? 'en-GB' : 'en-US',
        fr: 'fr-FR'
    };

    // Override for Brazilian Portuguese if explicitly requested
    if (languageCode === 'pt' && preferredRegion === 'BR') {
        return 'pt-BR';
    }

    return mapping[languageCode] || 'en-US';
}

/**
 * Get the base language code from a speech API language code
 * @param {string} speechLang - Speech API language code (e.g., 'pt-PT', 'en-US')
 * @returns {string} - Base language code ('pt', 'en', 'fr')
 */
export function getBaseLanguage(speechLang) {
    if (!speechLang) return 'en';
    return speechLang.split('-')[0].toLowerCase();
}

/**
 * Select the best voice for a given language from available voices
 * @param {string} targetLang - Target speech language (e.g., 'pt-PT')
 * @param {SpeechSynthesisVoice[]} availableVoices - Available voices from speechSynthesis.getVoices()
 * @returns {SpeechSynthesisVoice|null} - Best matching voice or null
 */
export function selectBestVoice(targetLang, availableVoices) {
    if (!availableVoices || availableVoices.length === 0) {
        return null;
    }

    // Priority 1: Exact match (e.g., 'pt-PT' === 'pt-PT')
    let voice = availableVoices.find(v => v.lang === targetLang);
    if (voice) return voice;

    // Priority 2: Regional variant match for Portuguese
    if (targetLang === 'pt-PT') {
        voice = availableVoices.find(v =>
            v.lang === 'pt-PT' ||
            v.name.includes('Portuguese (Portugal)') ||
            v.name.includes('European Portuguese')
        );
        if (voice) return voice;
    }

    // Priority 3: Same base language (e.g., 'pt-PT' matches 'pt-BR')
    const baseLang = getBaseLanguage(targetLang);
    voice = availableVoices.find(v => v.lang.startsWith(baseLang));
    if (voice) return voice;

    // Priority 4: Google voices for the base language
    voice = availableVoices.find(v =>
        v.name.includes('Google') &&
        v.lang.startsWith(baseLang)
    );
    if (voice) return voice;

    // No suitable voice found
    return null;
}

/**
 * Determine the best speech language for a given text
 * Combines language detection with user preferences
 * @param {string} text - Text to be spoken
 * @param {string} interfaceLang - User's interface language (from i18n)
 * @param {Function} detectLanguageFn - Language detection function
 * @param {Object} options - Additional options
 * @returns {Object} - { speechLang: string, detectedLang: string, confidence: number, source: string }
 */
export function determineSpeechLanguage(text, interfaceLang, detectLanguageFn, options = {}) {
    const {
        autoDetect = true,
        confidenceThreshold = 0.5,
        preferredRegion = null
    } = options;

    // Map interface language to speech language
    const baseLang = getBaseLanguage(interfaceLang);
    const fallbackSpeechLang = mapToSpeechLang(baseLang, preferredRegion);

    // If auto-detection is disabled, use interface language
    if (!autoDetect) {
        return {
            speechLang: fallbackSpeechLang,
            detectedLang: baseLang,
            confidence: 1.0,
            source: 'interface'
        };
    }

    // Detect language from text
    const detection = detectLanguageFn(text, baseLang);

    // If confidence is too low, use interface language
    if (detection.confidence < confidenceThreshold) {
        return {
            speechLang: fallbackSpeechLang,
            detectedLang: detection.language,
            confidence: detection.confidence,
            source: 'fallback'
        };
    }

    // If detected language matches interface language, use interface language
    if (detection.language === baseLang) {
        return {
            speechLang: fallbackSpeechLang,
            detectedLang: detection.language,
            confidence: detection.confidence,
            source: 'matched'
        };
    }

    // Use detected language
    const detectedSpeechLang = mapToSpeechLang(detection.language, preferredRegion);
    return {
        speechLang: detectedSpeechLang,
        detectedLang: detection.language,
        confidence: detection.confidence,
        source: 'detected'
    };
}

/**
 * Cache for available voices (to avoid repeated calls to getVoices())
 */
let voiceCache = null;
let voiceCacheTimestamp = 0;
const VOICE_CACHE_DURATION = 60000; // 1 minute

/**
 * Get available voices with caching
 * @returns {SpeechSynthesisVoice[]} - Available voices
 */
export function getCachedVoices() {
    const now = Date.now();

    // Return cached voices if still valid
    if (voiceCache && (now - voiceCacheTimestamp) < VOICE_CACHE_DURATION) {
        return voiceCache;
    }

    // Refresh cache
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        voiceCache = window.speechSynthesis.getVoices();
        voiceCacheTimestamp = now;
    } else {
        voiceCache = [];
    }

    return voiceCache;
}

/**
 * Clear the voice cache (useful when voices are updated)
 */
export function clearVoiceCache() {
    voiceCache = null;
    voiceCacheTimestamp = 0;
}
