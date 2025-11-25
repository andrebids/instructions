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
            recognitionRef.current.lang = lang;
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.start();
            setListening(true);
            setTranscript('');

            let silenceTimer = null;

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // Join all results for the current session
                const allText = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');

                setTranscript(allText);

                // Reset silence timer on every result (speech detected)
                if (silenceTimer) clearTimeout(silenceTimer);

                // Set new timer to stop listening after 1 second of silence
                silenceTimer = setTimeout(() => {
                    if (recognitionRef.current) {
                        recognitionRef.current.stop();
                    }
                }, 1000);
            };

            recognitionRef.current.onend = () => {
                setListening(false);
                if (silenceTimer) clearTimeout(silenceTimer);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('STT Error:', event.error);
                setListening(false);
                if (silenceTimer) clearTimeout(silenceTimer);
            };

        } catch (error) {
            if (error.name === 'InvalidStateError') {
                console.warn("STT already started (InvalidStateError), syncing state");
                setListening(true);
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
