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
    const { t } = useTranslation();
    const {
        registerWizard,
        unregisterWizard,
        speak,
        addMessage,
        startListening,
        listening,
        speaking: isSpeaking,
        currentLang,
        isOpen,
        cancelSpeech // Destructure cancelSpeech
    } = useVoiceAssistant();

    const [step, setStep] = useState(STEPS.IDLE);
    const tempClientDataRef = useRef({ name: '' });

    // Keep track of step in ref for effects if needed, though mostly we use state
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

    // Handle Transcript Logic
    const handleTranscript = (text) => {
        const lower = text.toLowerCase();

        // --- STEP: NAME ---
        if (step === STEPS.LISTEN_NAME) {
            let name = text.replace(/^(o nome é|chama-se|o projeto é|é|it is|the name is|my project is)\s+/i, '').trim();

            if (!name) {
                const response = t('pages.projectDetails.voiceAssistant.responses.nameInvalid', { defaultValue: "Não percebi o nome. Pode repetir?" });
                addMessage('bot', response);
                speak(response);
                // Stay in LISTEN_NAME, but maybe we need to re-trigger listening? 
                // The effect depends on step change or completion. 
                // If we don't change step, listening might not restart automatically if it just stopped.
                // Actually, the effect in useProjectFormVoiceLogic depends on [step]. 
                // If step doesn't change, it won't re-run startListening.
                // But wait, listening stopped (that's why we are here).
                // We need to restart listening.
                setTimeout(() => startListening(), 1500);
                return;
            }

            name = name.charAt(0).toUpperCase() + name.slice(1);

            cancelSpeech(); // Stop speaking if user answers
            onUpdateField('name', name);

            const response = t('pages.projectDetails.voiceAssistant.responses.nameReceived', { name });
            addMessage('bot', response);
            speak(response);

            setTimeout(() => setStep(STEPS.ASK_CLIENT), 1500);
        }

        // --- STEP: CLIENT ---
        else if (step === STEPS.LISTEN_CLIENT) {
            let clientName = text.replace(/^(o cliente é|é|it is|the client is)\s+/i, '').trim();

            if (!clientName) {
                const response = t('pages.projectDetails.voiceAssistant.responses.clientInvalid', { defaultValue: "Não percebi o nome do cliente. Pode repetir?" });
                addMessage('bot', response);
                speak(response);
                setTimeout(() => startListening(), 1500);
                return;
            }

            // Fix: Add optional chaining or check for label existence
            const foundClient = clients.find(c => c.label && c.label.toLowerCase().includes(clientName.toLowerCase()));

            if (foundClient) {
                cancelSpeech(); // Stop speaking
                onClientSelect(foundClient.key);
                onUpdateField('clientName', foundClient.label);

                const response = t('pages.projectDetails.voiceAssistant.responses.clientFound', { client: foundClient.label, defaultValue: `Cliente ${foundClient.label} selecionado.` });
                addMessage('bot', response);
                speak(response);

                setTimeout(() => setStep(STEPS.ASK_DATE), 1500);
            } else {
                cancelSpeech(); // Stop speaking
                tempClientDataRef.current.clientName = clientName;
                onUpdateField('clientName', clientName);

                const response = t('pages.projectDetails.voiceAssistant.responses.clientNotFound', { client: clientName, defaultValue: `Não encontrei o cliente ${clientName}. Deseja criar um novo?` });
                addMessage('bot', response);
                speak(response);

                setTimeout(() => setStep(STEPS.CONFIRM_CLIENT_CREATE), 1500);
            }
        }

        // --- STEP: CONFIRM NEW CLIENT ---
        else if (step === STEPS.CONFIRM_CLIENT_CREATE) {
            if (lower.includes('sim') || lower.includes('yes') || lower.includes('ok') || lower.includes('pode ser')) {
                cancelSpeech();
                onAddNewClient();

                const response = t('pages.projectDetails.voiceAssistant.responses.newClient', { defaultValue: "Ok, vamos continuar." });
                addMessage('bot', response);
                speak(response);
                setTimeout(() => setStep(STEPS.ASK_DATE), 1500);
            } else {
                cancelSpeech();
                const response = t('pages.projectDetails.voiceAssistant.responses.retryClient', { defaultValue: "Ok, qual é o nome do cliente então?" });
                addMessage('bot', response);
                speak(response);
                setTimeout(() => setStep(STEPS.ASK_CLIENT), 1500);
            }
        }

        // --- STEP: DATE ---
        else if (step === STEPS.LISTEN_DATE) {
            let date = new Date();
            if (lower.includes('amanhã') || lower.includes('tomorrow')) {
                date.setDate(date.getDate() + 1);
            } else if (lower.includes('semana que vem') || lower.includes('next week')) {
                date.setDate(date.getDate() + 7);
            } else if (lower.includes('hoje') || lower.includes('today')) {
                // keep today
            } else {
                date.setMonth(date.getMonth() + 1);
            }

            const dateStr = date.toISOString().split('T')[0];
            cancelSpeech();
            onUpdateField('endDate', dateStr);

            const response = t('pages.projectDetails.voiceAssistant.responses.dateReceived', { date: date.toLocaleDateString() });
            addMessage('bot', response);
            speak(response);

            setTimeout(() => setStep(STEPS.ASK_BUDGET), 1500);
        }

        // --- STEP: BUDGET ---
        else if (step === STEPS.LISTEN_BUDGET) {
            const numbers = text.match(/\d+/g);
            if (numbers) {
                const budget = numbers.join('');
                cancelSpeech();
                onUpdateField('budget', budget);

                const response = t('pages.projectDetails.voiceAssistant.responses.budgetReceived', { budget });
                addMessage('bot', response);
                speak(response);

                setTimeout(() => setStep(STEPS.ASK_CONFIRMATION), 1500);
            } else {
                const response = t('pages.projectDetails.voiceAssistant.responses.budgetInvalid', { defaultValue: "Não percebi o valor. Pode repetir?" });
                addMessage('bot', response);
                speak(response);
                setTimeout(() => speak(prompts.askBudget), 1500);
            }
        }

        // --- STEP: CONFIRMATION ---
        else if (step === STEPS.LISTEN_CONFIRMATION) {
            if (lower.includes('sim') || lower.includes('yes') || lower.includes('ok') || lower.includes('confirmar')) {
                cancelSpeech();
                const response = t('pages.projectDetails.voiceAssistant.responses.finished', { defaultValue: "Projeto criado com sucesso!" });
                addMessage('bot', response);
                speak(response);

                onNext();
                setStep(STEPS.FINISHED);
            } else {
                cancelSpeech();
                const response = t('pages.projectDetails.voiceAssistant.responses.cancelled', { defaultValue: "Cancelado." });
                addMessage('bot', response);
                speak(response);
                setStep(STEPS.FINISHED);
            }
        }
    };

    // Keep ref to latest handleTranscript to avoid re-registering wizard
    const handleTranscriptRef = useRef(handleTranscript);
    useEffect(() => {
        handleTranscriptRef.current = handleTranscript;
    });

    // Register Wizard Logic
    useEffect(() => {
        if (isOpen) {
            registerWizard({
                onTranscript: (text) => {
                    addMessage('user', text);
                    if (handleTranscriptRef.current) {
                        handleTranscriptRef.current(text);
                    }
                }
            });
        }
        return () => {
            unregisterWizard();
        };
    }, [isOpen, registerWizard, unregisterWizard, addMessage]);

    // Auto-start conversation if assistant is open
    useEffect(() => {
        if (isOpen && step === STEPS.IDLE) {
            const timer = setTimeout(() => {
                setStep(STEPS.ASK_NAME);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, step]);

    // Speak prompts when entering ASK steps
    useEffect(() => {
        if (!isOpen) return;

        const stepPrompts = {
            [STEPS.ASK_NAME]: prompts.askName,
            [STEPS.ASK_CLIENT]: prompts.askClient,
            [STEPS.CONFIRM_CLIENT_CREATE]: prompts.confirmClient,
            [STEPS.ASK_DATE]: prompts.askDate,
            [STEPS.ASK_BUDGET]: prompts.askBudget,
            [STEPS.ASK_CONFIRMATION]: prompts.askConfirm,
            [STEPS.FINISHED]: prompts.finished
        };

        const textToSpeak = stepPrompts[step];
        if (textToSpeak) {
            addMessage('bot', textToSpeak);
            speak(textToSpeak);
        }
    }, [step, isOpen, speak, prompts, addMessage]);

    // Handle listening state transitions
    // Handle listening state transitions
    useEffect(() => {
        let timeoutId;

        // Removed !isSpeaking check to allow barge-in
        if (isOpen && step !== STEPS.IDLE && step !== STEPS.FINISHED) {

            const nextListenStep = {
                [STEPS.ASK_NAME]: STEPS.LISTEN_NAME,
                [STEPS.ASK_CLIENT]: STEPS.LISTEN_CLIENT,
                [STEPS.CONFIRM_CLIENT_CREATE]: STEPS.CONFIRM_CLIENT_CREATE,
                [STEPS.ASK_DATE]: STEPS.LISTEN_DATE,
                [STEPS.ASK_BUDGET]: STEPS.LISTEN_BUDGET,
                [STEPS.ASK_CONFIRMATION]: STEPS.LISTEN_CONFIRMATION,
            }[step];

            if (nextListenStep) {
                // Start listening almost immediately (small delay to ensure state update)
                // We want to listen WHILE speaking (barge-in)
                timeoutId = setTimeout(() => {
                    if (nextListenStep !== step) {
                        setStep(nextListenStep);
                    }
                    startListening();
                }, 100); // Reduced delay from 1000ms to 100ms
            }
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [step, startListening, isOpen]); // Removed isSpeaking dependency

    return { step };
}
