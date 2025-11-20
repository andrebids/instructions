import { useState, useEffect, useCallback, useRef } from 'react';
import { EdgeSpeechTTS } from '@lobehub/tts';

const VOICE_MAPPING = {
    'pt-PT': ['pt-PT-DuarteNeural', 'pt-PT-RaquelNeural'],
    'fr-FR': ['fr-FR-HenriNeural', 'fr-FR-DeniseNeural'],
    'en-US': ['en-US-ChristopherNeural', 'en-US-JennyNeural']
};

export const useTTS = (defaultLang = 'en-US') => {
    const [speaking, setSpeaking] = useState(false);
    const [supported, setSupported] = useState(true); // Assumed true for EdgeTTS
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
    }, [defaultLang]);

    const speak = useCallback(async (text, lang = defaultLang) => {
        // Cancel any current speech
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        window.speechSynthesis.cancel();
        setSpeaking(true);

        try {
            // 1. Try Edge Speech TTS first
            const voiceOptions = VOICE_MAPPING[lang] || VOICE_MAPPING['en-US'];
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
                speakBrowserFallback(text, lang);
            };

            await audio.play();

        } catch (error) {
            console.error("Edge TTS Error, falling back to browser:", error);
            speakBrowserFallback(text, lang);
        }
    }, [defaultLang]);

    const speakBrowserFallback = (text, lang) => {
        if (!window.speechSynthesis) {
            setSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        // Try to find a matching voice for fallback
        const voices = window.speechSynthesis.getVoices();
        let voice = voices.find(v => v.lang === lang);
        if (!voice && lang === 'pt-PT') {
            voice = voices.find(v => v.lang === 'pt-PT' || v.name.includes('Portuguese (Portugal)'));
        }
        if (voice) utterance.voice = voice;

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

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
