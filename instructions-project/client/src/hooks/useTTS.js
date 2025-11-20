import { useState, useEffect, useCallback, useRef } from 'react';
import { EdgeSpeechTTS } from '@lobehub/tts';
import { detectLanguage } from '../utils/nlp/languageDetector';
import { determineSpeechLanguage, selectBestVoice, getCachedVoices, clearVoiceCache } from '../utils/voiceAssistant/speechLanguageMapper';

const VOICE_MAPPING = {
    'pt-PT': ['pt-PT-DuarteNeural', 'pt-PT-RaquelNeural'],
    'fr-FR': ['fr-FR-HenriNeural', 'fr-FR-DeniseNeural'],
    'en-US': ['en-US-ChristopherNeural', 'en-US-JennyNeural']
};

export const useTTS = (defaultLang = 'en-US') => {
    const [speaking, setSpeaking] = useState(false);
    const [supported, setSupported] = useState(true); // Assumed true for EdgeTTS
    const [voices, setVoices] = useState([]);
    const audioRef = useRef(null);
    const ttsRef = useRef(null);

    // Initialize TTS instance
    useEffect(() => {
        try {
            ttsRef.current = new EdgeSpeechTTS({ locale: defaultLang });
        } catch (error) {
            console.error("Failed to initialize EdgeSpeechTTS:", error);
            // Fallback to browser TTS if initialization fails
        }

        // Also initialize browser TTS voices for fallback
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            setSupported(true);

            const loadVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                setVoices(availableVoices);
                clearVoiceCache(); // Clear cache when voices change
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
    const speak = useCallback(async (text, langOrOptions = null) => {
        if (!supported || !text) return;

        // Cancel any current speech
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        window.speechSynthesis.cancel();
        setSpeaking(true);

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

        try {
            // 1. Try Edge Speech TTS first
            const voiceOptions = VOICE_MAPPING[finalLang] || VOICE_MAPPING['en-US'];
            const voice = voiceOptions[0]; // Default to first voice (Male) for now

            const payload = {
                input: text,
                options: {
                    voice: voice,
                },
            };

            const response = await ttsRef.current.create(payload);
            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: 'audio/mp3' });
            const url = URL.createObjectURL(blob);

            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onended = () => {
                setSpeaking(false);
                URL.revokeObjectURL(url); // Cleanup
                audioRef.current = null;
            };

            audio.onerror = (e) => {
                console.error("Audio Playback Error:", e);
                setSpeaking(false);
                // Fallback to browser TTS on audio error
                speakBrowserFallback(text, finalLang);
            };

            await audio.play();

        } catch (error) {
            console.error("Edge TTS Error, falling back to browser:", error);
            speakBrowserFallback(text, finalLang);
        }
    }, [defaultLang, supported]);

    const speakBrowserFallback = (text, lang) => {
        if (!window.speechSynthesis) {
            setSpeaking(false);
            return;
        }

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        // Select best voice for the language
        const availableVoices = getCachedVoices();
        const selectedVoice = selectBestVoice(lang, availableVoices);

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        } else {
            console.warn(`[TTS] No suitable voice found for ${lang}`);
        }

        // Event handlers
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        // Speak
        window.speechSynthesis.speak(utterance);
    };

    const cancel = useCallback(() => {
        // Stop Audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        // Stop Browser TTS
        window.speechSynthesis.cancel();
        setSpeaking(false);
    }, []);

    return {
        speak,
        cancel,
        speaking,
        supported
    };
};
