import { useState, useEffect, useCallback, useRef } from 'react';

export const useSTT = (defaultLang = 'en-US') => {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [supported, setSupported] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                setSupported(true);
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.maxAlternatives = 1;
            }

            // Request microphone permission explicitly for Firefox
            const requestMic = async () => {
                try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    console.log("Microphone permission granted");
                } catch (err) {
                    console.error("Microphone permission denied:", err);
                }
            };
            requestMic();
        }
    }, []);

    const start = useCallback((lang = defaultLang) => {
        if (!supported || !recognitionRef.current) return;

        // If already listening, do nothing or stop first
        if (listening) {
            console.warn("STT already listening, ignoring start request");
            return;
        }

        try {
            // Ensure we are stopped before starting to avoid InvalidStateError
            // However, 'listening' state might be out of sync with actual recognition object
            // So we wrap start in try/catch specifically for this error

            recognitionRef.current.lang = lang;
            recognitionRef.current.start();
            setListening(true);
            setTranscript('');

            recognitionRef.current.onresult = (event) => {
                const last = event.results.length - 1;
                const text = event.results[last][0].transcript;
                setTranscript(text);
            };

            recognitionRef.current.onend = () => {
                setListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('STT Error:', event.error);
                // If error is 'no-speech', we might want to just stop listening
                setListening(false);
            };

        } catch (error) {
            if (error.name === 'InvalidStateError') {
                console.warn("STT already started (InvalidStateError), syncing state");
                setListening(true); // Sync state if it was actually running
            } else {
                console.error('Failed to start STT:', error);
                setListening(false);
            }
        }
    }, [supported, defaultLang, listening]);

    const stop = useCallback(() => {
        if (supported && recognitionRef.current) {
            recognitionRef.current.stop();
            setListening(false);
        }
    }, [supported]);

    const abort = useCallback(() => {
        if (supported && recognitionRef.current) {
            recognitionRef.current.abort();
            setListening(false);
        }
    }, [supported]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        start,
        stop,
        abort,
        resetTranscript,
        listening,
        transcript,
        supported
    };
};
