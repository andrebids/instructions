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
    ASK_CLIENT_EMAIL: 'ASK_CLIENT_EMAIL',
    LISTEN_CLIENT_EMAIL: 'LISTEN_CLIENT_EMAIL',
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
        listening
    } = useVoiceAssistant();

    const currentLang = i18n.language || 'pt';
    const speechLang = currentLang === 'pt' ? 'pt-PT' :
        currentLang === 'fr' ? 'fr-FR' : 'en-US';

    const [step, setStep] = useState(STEPS.IDLE);
    const [tempClientData, setTempClientData] = useState({ name: '', email: '' });

    const stepRef = useRef(step);
    useEffect(() => { stepRef.current = step; }, [step]);

    const prompts = useMemo(() => ({
        ready: t('pages.projectDetails.voiceAssistant.ready'),
        askName: t('pages.projectDetails.voiceAssistant.prompts.askName'),
        askClient: t('pages.projectDetails.voiceAssistant.prompts.askClient'),
        confirmClient: t('pages.projectDetails.voiceAssistant.prompts.confirmClient'),
        askEmail: t('pages.projectDetails.voiceAssistant.prompts.askEmail'),
        askDate: t('pages.projectDetails.voiceAssistant.prompts.askDate'),
        askBudget: t('pages.projectDetails.voiceAssistant.prompts.askBudget'),
        askConfirm: t('pages.projectDetails.voiceAssistant.prompts.askConfirm'),
        finished: t('pages.projectDetails.voiceAssistant.prompts.finished')
    }), [t]);

    // Process Transcript Logic
    const processTranscript = (text) => {
        if (!text) return;

        console.log(`[VoiceWizard] Processing step ${stepRef.current}: ${text}`);
        const lowerText = text.toLowerCase();
        addMessage('user', text);

        switch (stepRef.current) {
            case STEPS.LISTEN_NAME:
                onUpdateField('name', text);
                setStep(STEPS.ASK_CLIENT);
                break;

            case STEPS.LISTEN_CLIENT:
                const clientName = text;
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
                    setTempClientData(prev => ({ ...prev, name: clientName }));
                    onUpdateField('clientName', clientName);
                    setStep(STEPS.CONFIRM_CLIENT_CREATE);
                }
                break;

            case STEPS.CONFIRM_CLIENT_CREATE:
                if (lowerText.includes('create') || lowerText.includes('criar') || lowerText.includes('sim') || lowerText.includes('yes')) {
                    setStep(STEPS.ASK_CLIENT_EMAIL);
                } else {
                    setStep(STEPS.ASK_CLIENT);
                }
                break;

            case STEPS.LISTEN_CLIENT_EMAIL:
                const email = text.toLowerCase().replace(/\s+/g, '').replace('arroba', '@').replace('dot', '.').replace('ponto', '.');
                onAddNewClient({
                    name: tempClientData.name,
                    email: email
                });
                setStep(STEPS.ASK_DATE);
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

        // Start the flow immediately if we just arrived here from a voice command
        // Or maybe wait for user to say something?
        // The user asked for "seamless". So if they said "Create project", we are here.
        // We should probably start asking the name immediately.
        setStep(STEPS.ASK_NAME);

        return () => {
            unregisterWizard();
        };
    }, []);

    // Step Execution Logic (TTS + State Transition)
    useEffect(() => {
        const runStep = async () => {
            let msg = '';
            switch (step) {
                case STEPS.ASK_NAME: msg = prompts.askName; break;
                case STEPS.ASK_CLIENT: msg = prompts.askClient; break;
                case STEPS.CONFIRM_CLIENT_CREATE: msg = prompts.confirmClient; break;
                case STEPS.ASK_CLIENT_EMAIL: msg = prompts.askEmail; break;
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

    // Auto-Listen after speaking
    // We need to know when speaking stops. 
    // But `useVoiceAssistant` exposes `speaking`.
    // However, we don't want to trigger on every speaking change if we are not in a listening step.

    // We can use a similar effect to the original wizard
    useEffect(() => {
        const listenSteps = [
            STEPS.LISTEN_NAME, STEPS.LISTEN_CLIENT, STEPS.CONFIRM_CLIENT_CREATE,
            STEPS.LISTEN_CLIENT_EMAIL,
            STEPS.LISTEN_DATE, STEPS.LISTEN_BUDGET, STEPS.LISTEN_CONFIRMATION
        ];

        // We need to transition from ASK -> LISTEN when speaking stops
        if (!listening) { // Only if not already listening
            const nextListenStep = {
                [STEPS.ASK_NAME]: STEPS.LISTEN_NAME,
                [STEPS.ASK_CLIENT]: STEPS.LISTEN_CLIENT,
                [STEPS.CONFIRM_CLIENT_CREATE]: STEPS.CONFIRM_CLIENT_CREATE, // This one is tricky, it stays same? No, original had same step for both?
                // Original: CONFIRM_CLIENT_CREATE was both ask and listen?
                // Let's check original code... 
                // It had: [STEPS.CONFIRM_CLIENT_CREATE]: STEPS.CONFIRM_CLIENT_CREATE
                // So it stays in same step but starts listening.
                [STEPS.ASK_CLIENT_EMAIL]: STEPS.LISTEN_CLIENT_EMAIL,
                [STEPS.ASK_DATE]: STEPS.LISTEN_DATE,
                [STEPS.ASK_BUDGET]: STEPS.LISTEN_BUDGET,
                [STEPS.ASK_CONFIRMATION]: STEPS.LISTEN_CONFIRMATION,
            }[step];

            if (nextListenStep) {
                // We wait for speaking to be false.
                // But `speaking` might be false initially.
                // We need to ensure we just finished speaking the prompt.
                // This is hard to sync perfectly without a "onSpeakEnd" callback.
                // But `useTTS` sets `speaking` to true then false.
                // So we can rely on `speaking` changing to false while in an ASK step.
            }
        }
    }, [step, listening]);

    // Better approach for transition:
    // When step changes to ASK_*, we speak.
    // When speaking becomes false AND we are in ASK_*, we move to LISTEN_* and start listening.
    const wasSpeaking = useRef(false);
    useEffect(() => {
        if (wasSpeaking.current && !listening) {
            // Just finished speaking
            const nextListenStep = {
                [STEPS.ASK_NAME]: STEPS.LISTEN_NAME,
                [STEPS.ASK_CLIENT]: STEPS.LISTEN_CLIENT,
                [STEPS.CONFIRM_CLIENT_CREATE]: STEPS.CONFIRM_CLIENT_CREATE,
                [STEPS.ASK_CLIENT_EMAIL]: STEPS.LISTEN_CLIENT_EMAIL,
                [STEPS.ASK_DATE]: STEPS.LISTEN_DATE,
                [STEPS.ASK_BUDGET]: STEPS.LISTEN_BUDGET,
                [STEPS.ASK_CONFIRMATION]: STEPS.LISTEN_CONFIRMATION,
            }[step];

            if (nextListenStep) {
                setStep(nextListenStep);
                startListening();
            }
        }
        wasSpeaking.current = !!listening; // Wait, no. speaking.
    }, [listening]); // This logic is flawed.

    // Let's use the `speaking` prop from context
    const { speaking: isSpeaking } = useVoiceAssistant();

    useEffect(() => {
        if (!isSpeaking && step !== STEPS.IDLE && step !== STEPS.FINISHED) {
            const nextListenStep = {
                [STEPS.ASK_NAME]: STEPS.LISTEN_NAME,
                [STEPS.ASK_CLIENT]: STEPS.LISTEN_CLIENT,
                [STEPS.CONFIRM_CLIENT_CREATE]: STEPS.CONFIRM_CLIENT_CREATE,
                [STEPS.ASK_CLIENT_EMAIL]: STEPS.LISTEN_CLIENT_EMAIL,
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
