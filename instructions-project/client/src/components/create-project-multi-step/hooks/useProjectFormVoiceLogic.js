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
                if (nextListenStep !== step) {
                    setStep(nextListenStep);
                }
                startListening();
            }
        }
    }, [isSpeaking, step, startListening]);

    return { step };
}
