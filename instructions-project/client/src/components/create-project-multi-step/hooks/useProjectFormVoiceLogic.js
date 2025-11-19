import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceAssistant } from '../../../context/VoiceAssistantContext';

const STEPS = {
    IDLE: 'IDLE',
    ASK_NAME: 'ASK_NAME',
    LISTEN_NAME: 'LISTEN_NAME',
    ASK_CLIENT: 'ASK_CLIENT',
    LISTEN_CLIENT: 'LISTEN_CLIENT',
    CONFIRM_CLIENT_CREATE: 'CONFIRM_CLIENT_CREATE',
    // Email steps removed as requested
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
    onNext
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
        currentLang, // Use the one from context which is already mapped
        isOpen // Get isOpen state
    } = useVoiceAssistant();

    // Use context language or fallback
    const speechLang = currentLang || 'pt-PT';

    const [step, setStep] = useState(STEPS.IDLE);
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

    // Process Transcript Logic
    const processTranscript = (text) => {
        if (!text) return;

        // Simple Echo Cancellation: If the text is exactly the prompt, ignore it.
        // Or better: rely on the fact that we shouldn't be listening while speaking.

        console.log(`[VoiceWizard] Processing step ${stepRef.current}: ${text}`);
        const lowerText = text.toLowerCase();
        addMessage('user', text);

        switch (stepRef.current) {
            case STEPS.LISTEN_NAME:
                // Clean up the text (remove trailing punctuation if any)
                const cleanName = text.replace(/[?.!]$/, '');
                onUpdateField('name', cleanName);
                setStep(STEPS.ASK_CLIENT);
                break;

            case STEPS.LISTEN_CLIENT:
                const clientName = text.replace(/[?.!]$/, '');
                const foundClients = clients.filter(c => c.name.toLowerCase().includes(lowerText));

                if (foundClients.length > 0) {
                    const bestMatch = foundClients[0];
                    if (onClientSelect) {
                        onClientSelect(bestMatch.id);
                    } else {
                        onUpdateField('selectedClientKey', bestMatch.id);
                        onUpdateField('clientName', bestMatch.name);
                    }
                    setStep(STEPS.ASK_DATE);
                } else {
                    tempClientDataRef.current = { name: clientName };
                    onUpdateField('clientName', clientName);
                    setStep(STEPS.CONFIRM_CLIENT_CREATE);
                }
                break;

            case STEPS.CONFIRM_CLIENT_CREATE:
                if (lowerText.includes('create') || lowerText.includes('criar') || lowerText.includes('sim') || lowerText.includes('yes')) {
                    // Open modal immediately with the captured name
                    onAddNewClient({ name: tempClientDataRef.current.name });
                    // Skip email, go to Date
                    setStep(STEPS.ASK_DATE);
                } else {
                    // If they say no, ask for client again?
                    setStep(STEPS.ASK_CLIENT);
                }
                break;

            case STEPS.LISTEN_DATE:
                let date = null;
                const today = new Date();
                if (lowerText.includes('tomorrow') || lowerText.includes('amanhã')) {
                    date = new Date(today);
                    date.setDate(today.getDate() + 1);
                } else if (lowerText.includes('next week') || lowerText.includes('próxima semana')) {
                    date = new Date(today);
                    date.setDate(today.getDate() + 7);
                } else {
                    date = new Date(text);
                }

                if (!isNaN(date.getTime())) {
                    const isoDate = date.toISOString().split('T')[0];
                    onUpdateField('endDate', isoDate);
                }
                setStep(STEPS.ASK_BUDGET);
                break;

            case STEPS.LISTEN_BUDGET:
                const numbers = text.match(/\d+/g);
                if (numbers) {
                    const budget = numbers.join('');
                    onUpdateField('budget', budget);
                }
                setStep(STEPS.ASK_CONFIRMATION);
                break;

            case STEPS.LISTEN_CONFIRMATION:
                if (lowerText.includes('continuar') || lowerText.includes('continue') || lowerText.includes('next') || lowerText.includes('avançar')) {
                    if (onNext) onNext();
                    setStep(STEPS.FINISHED);
                } else {
                    setStep(STEPS.FINISHED);
                }
                break;

            default:
                break;
        }
    };

    // Register with Context on Mount
    useEffect(() => {
        registerWizard({
            onTranscript: processTranscript
        });

        // Removed immediate start. Now controlled by isOpen.
        // setStep(STEPS.ASK_NAME);

        return () => {
            unregisterWizard();
        };
    }, []);

    // Control Flow based on isOpen
    useEffect(() => {
        if (isOpen && step === STEPS.IDLE) {
            setStep(STEPS.ASK_NAME);
        } else if (!isOpen && step !== STEPS.IDLE) {
            setStep(STEPS.IDLE);
        }
    }, [isOpen, step]);

    // Step Execution Logic (TTS + State Transition)
    useEffect(() => {
        const runStep = async () => {
            let msg = '';
            switch (step) {
                case STEPS.ASK_NAME: msg = prompts.askName; break;
                case STEPS.ASK_CLIENT: msg = prompts.askClient; break;
                case STEPS.CONFIRM_CLIENT_CREATE: msg = prompts.confirmClient; break;
                case STEPS.ASK_DATE: msg = prompts.askDate; break;
                case STEPS.ASK_BUDGET: msg = prompts.askBudget; break;
                case STEPS.ASK_CONFIRMATION: msg = prompts.askConfirm; break;
                case STEPS.FINISHED: msg = prompts.finished; break;
            }

            if (msg) {
                addMessage('bot', msg);
                speak(msg, speechLang);
            }
        };

        runStep();
    }, [step, speak, speechLang, prompts, addMessage]);

    // Auto-Listen after speaking (using context speaking state)
    useEffect(() => {
        if (!isSpeaking && step !== STEPS.IDLE && step !== STEPS.FINISHED) {
            const nextListenStep = {
                [STEPS.ASK_NAME]: STEPS.LISTEN_NAME,
                [STEPS.ASK_CLIENT]: STEPS.LISTEN_CLIENT,
                [STEPS.CONFIRM_CLIENT_CREATE]: STEPS.CONFIRM_CLIENT_CREATE,
                [STEPS.ASK_DATE]: STEPS.LISTEN_DATE,
                [STEPS.ASK_BUDGET]: STEPS.LISTEN_BUDGET,
                [STEPS.ASK_CONFIRMATION]: STEPS.LISTEN_CONFIRMATION,
            }[step];

            if (nextListenStep) {
                setStep(nextListenStep);
                startListening();
            }
        }
    }, [isSpeaking, step, startListening]);

    return { step };
}
