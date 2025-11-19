import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceAssistant } from '../../../context/VoiceAssistantContext';
import { parseProjectInput, getMissingFields, generateParsingSummary } from '../../../utils/nlp/parseProjectInput';
import { extractDate } from '../../../utils/nlp/dateParser';
import { findBestClientMatch } from '../../../utils/nlp/fuzzyClientMatch';
import { parseDate } from "@internationalized/date";

const STEPS = {
    IDLE: 'IDLE',
    PARSE_INITIAL: 'PARSE_INITIAL', // Try to parse everything from first input
    ASK_NAME: 'ASK_NAME',
    LISTEN_NAME: 'LISTEN_NAME',
    ASK_CLIENT: 'ASK_CLIENT',
    LISTEN_CLIENT: 'LISTEN_CLIENT',
    CONFIRM_CLIENT: 'CONFIRM_CLIENT',
    ASK_DATE: 'ASK_DATE',
    LISTEN_DATE: 'LISTEN_DATE',
    ASK_BUDGET: 'ASK_BUDGET',
    LISTEN_BUDGET: 'LISTEN_BUDGET',
    ASK_CONFIRMATION: 'ASK_CONFIRMATION',
    LISTEN_CONFIRMATION: 'LISTEN_CONFIRMATION',
    FINISHED: 'FINISHED'
};

export function useProjectFormVoiceLogic({
    onUpdateField,
    clients,
    onAddNewClient,
    onClientSelect,
    onNext,
    formData
}) {
    const { t, i18n } = useTranslation();
    const {
        registerWizard,
        unregisterWizard,
        speak,
        addMessage,
        startListening,
        stopListening,
        listening,
        speaking: isSpeaking,
        languageCode,
        conversationMemory,
        resetTranscript,
        transcript
    } = useVoiceAssistant();

    const [step, setStep] = useState(STEPS.IDLE);
    const [parsedData, setParsedData] = useState(null);
    const tempClientDataRef = useRef({ name: '' });

    const stepRef = useRef(step);
    useEffect(() => { stepRef.current = step; }, [step]);

    const prompts = useMemo(() => ({
        ready: t('pages.projectDetails.voiceAssistant.ready'),
        askName: t('pages.projectDetails.voiceAssistant.prompts.askName'),
        askClient: t('pages.projectDetails.voiceAssistant.prompts.askClient'),
        confirmClient: t('pages.projectDetails.voiceAssistant.prompts.confirmClient'),
        askDate: t('pages.projectDetails.voiceAssistant.prompts.askDate'),
        askBudget: t('pages.projectDetails.voiceAssistant.prompts.askBudget'),
        askConfirm: t('pages.projectDetails.voiceAssistant.prompts.askConfirm'),
        finished: t('pages.projectDetails.voiceAssistant.prompts.finished')
    }), [t]);

    // Check what fields are already filled
    const getFilledFields = useCallback(() => {
        return {
            name: !!formData?.name,
            client: !!formData?.selectedClientKey || !!formData?.clientName,
            budget: !!formData?.budget,
            endDate: !!formData?.endDate
        };
    }, [formData]);

    // Start wizard
    const startWizard = useCallback(() => {
        const filled = getFilledFields();

        // If all fields are filled, ask for confirmation
        if (filled.name && filled.client && filled.budget && filled.endDate) {
            setStep(STEPS.ASK_CONFIRMATION);
            const message = prompts.askConfirm;
            addMessage('bot', message);
            speak(message);
            return;
        }

        // Otherwise, start with parsing attempt
        setStep(STEPS.PARSE_INITIAL);
        const message = prompts.ready;
        addMessage('bot', message);
        speak(message);
    }, [getFilledFields, prompts, addMessage, speak]);

    // Handle transcript when it changes
    const handleTranscript = useCallback((transcriptText) => {
        if (!transcriptText || isSpeaking) return;

        const currentStep = stepRef.current;
        console.log('Handling transcript:', transcriptText, 'Step:', currentStep);

        switch (currentStep) {
            case STEPS.PARSE_INITIAL:
            case STEPS.LISTEN_NAME:
            case STEPS.LISTEN_CLIENT:
            case STEPS.LISTEN_DATE:
            case STEPS.LISTEN_BUDGET: {
                // Try to parse the input
                const lastProject = conversationMemory.getLastClient();
                const parsed = parseProjectInput(transcriptText, {
                    clients,
                    lastProject,
                    language: languageCode
                });

                setParsedData(parsed);
                addMessage('user', transcriptText);

                // Apply parsed data to form
                if (parsed.projectName && !formData?.name) {
                    onUpdateField('name', parsed.projectName);
                }
                if (parsed.budget && !formData?.budget) {
                    onUpdateField('budget', parsed.budget);
                }
                if (parsed.endDate && !formData?.endDate) {
                    try {
                        const calendarDate = parseDate(`${parsed.endDate.year}-${String(parsed.endDate.month).padStart(2, '0')}-${String(parsed.endDate.day).padStart(2, '0')}`);
                        onUpdateField('endDate', calendarDate);
                    } catch (e) {
                        console.error('Date parse error:', e);
                    }
                }
                if (parsed.clientId && !formData?.selectedClientKey) {
                    onClientSelect(parsed.clientId);
                } else if (parsed.clientName && !parsed.clientId && !formData?.clientName) {
                    onUpdateField('clientName', parsed.clientName);
                }

                // Generate summary of what was understood
                if (parsed.projectName || parsed.clientName || parsed.budget || parsed.endDate) {
                    const summary = generateParsingSummary(parsed, languageCode);
                    const confirmMessages = {
                        pt: `Entendi: ${summary}`,
                        en: `I understood: ${summary}`,
                        fr: `J'ai compris: ${summary}`
                    };
                    const confirmMessage = confirmMessages[languageCode] || confirmMessages.pt;
                    addMessage('bot', confirmMessage);
                    speak(confirmMessage);
                }

                // Determine next step based on what's missing
                const missing = getMissingFields(parsed);

                if (missing.length === 0) {
                    // Everything filled, ask for confirmation
                    setStep(STEPS.ASK_CONFIRMATION);
                    setTimeout(() => {
                        const message = prompts.askConfirm;
                        addMessage('bot', message);
                        speak(message);
                    }, 2000);
                } else if (missing.includes('projectName')) {
                    setStep(STEPS.ASK_NAME);
                    setTimeout(() => {
                        const message = prompts.askName;
                        addMessage('bot', message);
                        speak(message);
                    }, 2000);
                } else if (missing.includes('client')) {
                    setStep(STEPS.ASK_CLIENT);
                    setTimeout(() => {
                        const message = prompts.askClient;
                        addMessage('bot', message);
                        speak(message);
                    }, 2000);
                } else if (missing.includes('endDate')) {
                    setStep(STEPS.ASK_DATE);
                    setTimeout(() => {
                        const message = prompts.askDate;
                        addMessage('bot', message);
                        speak(message);
                    }, 2000);
                } else if (missing.includes('budget')) {
                    setStep(STEPS.ASK_BUDGET);
                    setTimeout(() => {
                        const message = prompts.askBudget;
                        addMessage('bot', message);
                        speak(message);
                    }, 2000);
                }

                resetTranscript();
                break;
            }

            case STEPS.LISTEN_CONFIRMATION: {
                addMessage('user', transcriptText);
                const lowerText = transcriptText.toLowerCase();

                // Check for affirmative responses
                const affirmatives = ['sim', 'yes', 'oui', 'continuar', 'continue', 'continuer', 'ok', 'confirmar', 'confirm'];
                const isAffirmative = affirmatives.some(word => lowerText.includes(word));

                if (isAffirmative) {
                    setStep(STEPS.FINISHED);
                    const message = prompts.finished;
                    addMessage('bot', message);
                    speak(message);

                    // Proceed to next step
                    setTimeout(() => {
                        onNext();
                    }, 1500);
                } else {
                    // User wants to change something, go back to parsing
                    setStep(STEPS.PARSE_INITIAL);
                    const changeMessages = {
                        pt: 'O que quer alterar?',
                        en: 'What would you like to change?',
                        fr: 'Que voulez-vous changer?'
                    };
                    const message = changeMessages[languageCode] || changeMessages.pt;
                    addMessage('bot', message);
                    speak(message);
                }

                resetTranscript();
                break;
            }

            default:
                break;
        }
    }, [isSpeaking, clients, languageCode, conversationMemory, formData, onUpdateField, onClientSelect, onNext, prompts, addMessage, speak, resetTranscript]);

    // Register wizard with voice assistant
    useEffect(() => {
        const wizardLogic = {
            onTranscript: handleTranscript
        };
        registerWizard(wizardLogic);

        return () => {
            unregisterWizard();
        };
    }, [registerWizard, unregisterWizard, handleTranscript]);

    // Auto-transition to listening after speaking
    useEffect(() => {
        if (!isSpeaking && step !== STEPS.IDLE && step !== STEPS.FINISHED) {
            const listenSteps = [
                STEPS.PARSE_INITIAL,
                STEPS.LISTEN_NAME,
                STEPS.LISTEN_CLIENT,
                STEPS.LISTEN_DATE,
                STEPS.LISTEN_BUDGET,
                STEPS.LISTEN_CONFIRMATION
            ];

            if (listenSteps.includes(step)) {
                setTimeout(() => {
                    startListening();
                }, 500);
            }
        }
    }, [isSpeaking, step, startListening]);

    // Process transcript when it changes
    useEffect(() => {
        if (transcript && !listening && !isSpeaking) {
            handleTranscript(transcript);
        }
    }, [transcript, listening, isSpeaking, handleTranscript]);

    return {
        step,
        listening,
        startWizard,
        parsedData
    };
}
