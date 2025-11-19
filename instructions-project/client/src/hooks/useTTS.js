import { useState, useEffect, useCallback } from 'react';

export const useTTS = (defaultLang = 'en-US') => {
    const [speaking, setSpeaking] = useState(false);
    const [supported, setSupported] = useState(false);
    const [voices, setVoices] = useState([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            setSupported(true);

            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                // console.log("TTS Available Voices:", voices.map(v => `${v.name} (${v.lang})`));

                // Try to find a voice that matches the requested language exactly (e.g., 'pt-PT')
                let voice = voices.find(v => v.lang === defaultLang);

                // If not found, try to find a voice that starts with the language code (e.g., 'pt')
                // But prioritize 'pt-PT' over 'pt-BR' if defaultLang is 'pt-PT'
                if (!voice) {
                    if (defaultLang === 'pt-PT') {
                        voice = voices.find(v => v.lang === 'pt-PT' || v.name.includes('Portuguese (Portugal)') || v.name.includes('European Portuguese'));
                    }

                    if (!voice) {
                        voice = voices.find(v => v.lang.startsWith(defaultLang.split('-')[0]));
                    }
                }

                // Fallback to Google voices if available and matching broad language
                if (!voice) {
                    voice = voices.find(v => v.name.includes('Google') && v.lang.startsWith(defaultLang.split('-')[0]));
                }

                // We don't store the voice in state to avoid re-renders, we just use it in speak
            };

            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, [defaultLang]);

    const speak = useCallback((text, lang = defaultLang) => {
        if (!supported) return;

        // Cancel any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        // Select voice again to be sure
        const voices = window.speechSynthesis.getVoices();
        let voice = voices.find(v => v.lang === lang);

        if (!voice && lang === 'pt-PT') {
            voice = voices.find(v => v.lang === 'pt-PT' || v.name.includes('Portuguese (Portugal)') || v.name.includes('European Portuguese'));
        }

        if (!voice) {
            voice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
        }

        if (voice) {
            utterance.voice = voice;
        }

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            setSpeaking(false);
        };

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
