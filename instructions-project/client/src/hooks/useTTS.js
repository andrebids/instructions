import { useState, useEffect, useCallback } from 'react';
import { detectLanguage } from '../utils/nlp/languageDetector';
import { determineSpeechLanguage, selectBestVoice, getCachedVoices, clearVoiceCache } from '../utils/voiceAssistant/speechLanguageMapper';

export const useTTS = (defaultLang = 'en-US') => {
    const [speaking, setSpeaking] = useState(false);
    const [supported, setSupported] = useState(false);
    const [voices, setVoices] = useState([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            setSupported(true);

            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                setVoices(voices);
                clearVoiceCache(); // Clear cache when voices change

                // Uncomment for debugging:
                // console.log("TTS Available Voices:", voices.map(v => `${v.name} (${v.lang})`));
            };

            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, [defaultLang]);

    /**
     * Speak text with automatic language detection
     * @param {string} text - Text to speak
     * @param {string|Object} langOrOptions - Language code or options object
     *   - If string: explicit language override (e.g., 'pt-PT')
     *   - If object: { lang, autoDetect, confidenceThreshold }
     */
    const speak = useCallback((text, langOrOptions = null) => {
        if (!supported || !text) return;

        // Cancel any current speech
        window.speechSynthesis.cancel();

        // Parse options
        let finalLang = defaultLang;
        let autoDetect = true;
        let confidenceThreshold = 0.5;

        if (typeof langOrOptions === 'string') {
            // Backward compatibility: direct language override
            finalLang = langOrOptions;
            autoDetect = false;
        } else if (langOrOptions && typeof langOrOptions === 'object') {
            // New options object format
            finalLang = langOrOptions.lang || defaultLang;
            autoDetect = langOrOptions.autoDetect !== false; // Default true
            confidenceThreshold = langOrOptions.confidenceThreshold || 0.5;
        }

        // Auto-detect language if enabled and no explicit override
        if (autoDetect && !langOrOptions?.lang) {
            const result = determineSpeechLanguage(
                text,
                defaultLang,
                detectLanguage,
                { autoDetect: true, confidenceThreshold }
            );

            finalLang = result.speechLang;

            // Debug logging (can be removed in production)
            if (result.source === 'detected' && result.confidence > 0.6) {
                console.log(`[TTS] Auto-detected ${result.detectedLang} (confidence: ${result.confidence}) for: "${text.substring(0, 50)}..."`);
            }
        }

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = finalLang;

        // Select best voice for the language
        const availableVoices = getCachedVoices();
        const selectedVoice = selectBestVoice(finalLang, availableVoices);

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            // console.log(`[TTS] Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
        } else {
            console.warn(`[TTS] No suitable voice found for ${finalLang}`);
        }

        // Event handlers
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            setSpeaking(false);
        };

        // Speak
        window.speechSynthesis.speak(utterance);
    }, [supported, defaultLang]);

    const cancel = useCallback(() => {
        if (supported) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
        }
    }, [supported]);

    return {
        speak,
        cancel,
        speaking,
        supported
    };
};
