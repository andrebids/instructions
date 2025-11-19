import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, CardBody, Progress } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTTS } from "../../../hooks/useTTS";
import { useSTT } from "../../../hooks/useSTT";
import { useTranslation } from 'react-i18next';

const STEPS = {
  IDLE: 'IDLE',
  ASK_NAME: 'ASK_NAME',
  LISTEN_NAME: 'LISTEN_NAME',
  ASK_CLIENT: 'ASK_CLIENT',
  LISTEN_CLIENT: 'LISTEN_CLIENT',
  CONFIRM_CLIENT_CREATE: 'CONFIRM_CLIENT_CREATE',
  ASK_CLIENT_EMAIL: 'ASK_CLIENT_EMAIL',
  LISTEN_CLIENT_EMAIL: 'LISTEN_CLIENT_EMAIL',
  ASK_CLIENT_PHONE: 'ASK_CLIENT_PHONE',
  LISTEN_CLIENT_PHONE: 'LISTEN_CLIENT_PHONE',
  ASK_DATE: 'ASK_DATE',
  LISTEN_DATE: 'LISTEN_DATE',
  ASK_BUDGET: 'ASK_BUDGET',
  LISTEN_BUDGET: 'LISTEN_BUDGET',
  ASK_CONFIRMATION: 'ASK_CONFIRMATION',
  LISTEN_CONFIRMATION: 'LISTEN_CONFIRMATION',
  FINISHED: 'FINISHED'
};

export function ProjectFormVoiceWizard({ 
  onUpdateField, 
  clients, 
  onAddNewClient,
  onNext
}) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'pt'; 
  
  // Force pt-PT if language is generic 'pt', otherwise use current
  const speechLang = currentLang === 'pt' ? 'pt-PT' : 
                     currentLang === 'fr' ? 'fr-FR' : 'en-US';

  const [step, setStep] = useState(STEPS.IDLE);
  const [message, setMessage] = useState('');
  const [tempClient, setTempClient] = useState({ name: '', email: '', phone: '' });

  const { speak, speaking, cancel: cancelTTS } = useTTS(speechLang);
  const { start: startSTT, stop: stopSTT, transcript, listening } = useSTT(speechLang);
  
  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; }, [step]);

  useEffect(() => {
    console.log(`[VoiceWizard] State: ${step}, Listening: ${listening}, Speaking: ${speaking}, Lang: ${speechLang}`);
  }, [step, listening, speaking, speechLang]);

  const processTranscript = (text) => {
    if (!text) return;
    
    console.log(`[VoiceWizard] Processing step ${stepRef.current}: ${text}`);
    const lowerText = text.toLowerCase();

    switch (stepRef.current) {
      case STEPS.LISTEN_NAME:
        onUpdateField('name', text);
        setStep(STEPS.ASK_CLIENT);
        break;

      case STEPS.LISTEN_CLIENT:
        const clientName = text; // Keep original case for display
        const foundClient = clients.find(c => c.name.toLowerCase().includes(lowerText));
        
        if (foundClient) {
          onUpdateField('selectedClientKey', foundClient.id);
          onUpdateField('clientName', foundClient.name);
          setStep(STEPS.ASK_DATE);
        } else {
          setTempClient(prev => ({ ...prev, name: clientName }));
          onUpdateField('clientName', clientName);
          setStep(STEPS.CONFIRM_CLIENT_CREATE);
        }
        break;

      case STEPS.CONFIRM_CLIENT_CREATE:
        if (lowerText.includes('create') || lowerText.includes('criar') || lowerText.includes('sim') || lowerText.includes('yes')) {
          setStep(STEPS.ASK_CLIENT_EMAIL);
        } else {
          // Retry client name
          setStep(STEPS.ASK_CLIENT); 
        }
        break;

      case STEPS.LISTEN_CLIENT_EMAIL:
        // Basic cleanup for email if spoken (e.g. "at" -> "@") - simple heuristic
        let email = text.toLowerCase().replace(/ at /g, '@').replace(/ ponto /g, '.').replace(/ dot /g, '.').replace(/\s+/g, '');
        setTempClient(prev => ({ ...prev, email }));
        setStep(STEPS.ASK_CLIENT_PHONE);
        break;

      case STEPS.LISTEN_CLIENT_PHONE:
        setTempClient(prev => ({ ...prev, phone: text }));
        // Now trigger the add new client modal with collected data
        onAddNewClient({ 
            name: tempClient.name, 
            email: tempClient.email, 
            phone: text 
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
            // Maybe they want to correct something? For now, just finish or stay here.
            // Let's just finish if they say something else to avoid loop, or ask again?
            // Let's stay in confirmation loop but stop listening after one try if not matched?
            // No, let's just finish.
            setStep(STEPS.FINISHED);
        }
        break;

      default:
        break;
    }
  };

  const getPrompts = (langCode) => {
    const isPt = langCode.startsWith('pt');
    return {
      ready: isPt ? "Pronto. Clique no microfone." : "Ready. Click mic.",
      askName: isPt ? "Qual é o nome do projeto?" : "What is the project name?",
      askClient: isPt ? "Quem é o cliente?" : "Who is the client?",
      confirmClient: isPt ? "Cliente novo. Diga 'Criar' para adicionar dados, ou repita o nome." : "New client. Say 'Create' to add details, or repeat name.",
      askEmail: isPt ? "Qual o email do cliente?" : "What is the client's email?",
      askPhone: isPt ? "Qual o telefone do cliente?" : "What is the client's phone?",
      askDate: isPt ? "Qual a data de entrega?" : "What is the delivery date?",
      askBudget: isPt ? "Qual é o orçamento?" : "What is the budget?",
      askConfirm: isPt ? "Dados preenchidos. Diga 'Continuar' para avançar." : "Data filled. Say 'Continue' to proceed.",
      finished: isPt ? "Assistente finalizado." : "Assistant finished."
    };
  };

  const prompts = getPrompts(speechLang);

  useEffect(() => {
    let timeoutId;

    const runStep = async () => {
      switch (step) {
        case STEPS.IDLE:
          setMessage(prompts.ready);
          break;
        case STEPS.ASK_NAME:
          setMessage(prompts.askName);
          speak(prompts.askName, speechLang);
          break;
        case STEPS.ASK_CLIENT:
          setMessage(prompts.askClient);
          speak(prompts.askClient, speechLang);
          break;
        case STEPS.CONFIRM_CLIENT_CREATE:
          setMessage(prompts.confirmClient);
          speak(prompts.confirmClient, speechLang);
          break;
        case STEPS.ASK_CLIENT_EMAIL:
          setMessage(prompts.askEmail);
          speak(prompts.askEmail, speechLang);
          break;
        case STEPS.ASK_CLIENT_PHONE:
          setMessage(prompts.askPhone);
          speak(prompts.askPhone, speechLang);
          break;
        case STEPS.ASK_DATE:
          setMessage(prompts.askDate);
          speak(prompts.askDate, speechLang);
          break;
        case STEPS.ASK_BUDGET:
          setMessage(prompts.askBudget);
          speak(prompts.askBudget, speechLang);
          break;
        case STEPS.ASK_CONFIRMATION:
          setMessage(prompts.askConfirm);
          speak(prompts.askConfirm, speechLang);
          break;
        case STEPS.FINISHED:
          setMessage(prompts.finished);
          speak(prompts.finished, speechLang);
          break;
      }
    };

    runStep();
    return () => clearTimeout(timeoutId);
  }, [step, speak, speechLang]);

  useEffect(() => {
    if (!speaking && step !== STEPS.IDLE && step !== STEPS.FINISHED) {
      const nextListenStep = {
        [STEPS.ASK_NAME]: STEPS.LISTEN_NAME,
        [STEPS.ASK_CLIENT]: STEPS.LISTEN_CLIENT,
        [STEPS.CONFIRM_CLIENT_CREATE]: STEPS.CONFIRM_CLIENT_CREATE, 
        [STEPS.ASK_CLIENT_EMAIL]: STEPS.LISTEN_CLIENT_EMAIL,
        [STEPS.ASK_CLIENT_PHONE]: STEPS.LISTEN_CLIENT_PHONE,
        [STEPS.ASK_DATE]: STEPS.LISTEN_DATE,
        [STEPS.ASK_BUDGET]: STEPS.LISTEN_BUDGET,
        [STEPS.ASK_CONFIRMATION]: STEPS.LISTEN_CONFIRMATION,
      }[step];

      if (nextListenStep) {
        setStep(nextListenStep);
      }
    }
  }, [speaking, step]);

  useEffect(() => {
    const listenSteps = [
        STEPS.LISTEN_NAME, STEPS.LISTEN_CLIENT, STEPS.CONFIRM_CLIENT_CREATE,
        STEPS.LISTEN_CLIENT_EMAIL, STEPS.LISTEN_CLIENT_PHONE,
        STEPS.LISTEN_DATE, STEPS.LISTEN_BUDGET, STEPS.LISTEN_CONFIRMATION
    ];

    if (listenSteps.includes(step) && !speaking) {
      console.log(`[VoiceWizard] Starting STT for step: ${step}`);
      startSTT(speechLang);
    }
  }, [step, startSTT, speechLang, speaking]);

  useEffect(() => {
    if (!listening && transcript && step !== STEPS.IDLE && step !== STEPS.FINISHED) {
      processTranscript(transcript);
    }
  }, [listening, transcript, step]);

  const handleStart = () => {
    setStep(STEPS.ASK_NAME);
  };

  const handleStop = () => {
    cancelTTS();
    stopSTT();
    setStep(STEPS.IDLE);
  };

  return (
    <Card className="w-full mb-6 bg-content2 dark:bg-content1 border-none shadow-sm">
      <CardBody className="flex flex-row items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3 flex-1">
          <Button
            isIconOnly
            color={step === STEPS.IDLE ? "primary" : "danger"}
            variant="shadow"
            radius="full"
            onClick={step === STEPS.IDLE ? handleStart : handleStop}
            className="w-12 h-12 min-w-12"
          >
            <Icon 
              icon={step === STEPS.IDLE ? "lucide:mic" : "lucide:mic-off"} 
              width={24} 
            />
          </Button>
          
          <div className="flex flex-col flex-1">
            <span className="text-small font-bold text-default-700 uppercase tracking-wider">
              {currentLang === 'pt' ? 'Assistente de Voz' : 'Voice Assistant'}
            </span>
            <span className="text-medium font-medium text-primary truncate">
              {message || (currentLang === 'pt' ? "Clique para iniciar..." : "Click mic to start...")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-[100px] justify-end">
          {speaking && (
            <div className="flex gap-1 items-center">
              <span className="animate-pulse w-2 h-2 bg-primary rounded-full"></span>
              <span className="text-xs text-primary font-medium">
                {currentLang === 'pt' ? 'Falando...' : 'Speaking...'}
              </span>
            </div>
          )}
          {listening && (
            <div className="flex gap-1 items-center">
              <span className="animate-ping w-2 h-2 bg-danger rounded-full"></span>
              <span className="text-xs text-danger font-medium">
                {currentLang === 'pt' ? 'Ouvindo...' : 'Listening...'}
              </span>
            </div>
          )}
        </div>
      </CardBody>
      
      {step !== STEPS.IDLE && (
        <Progress 
          size="sm" 
          isIndeterminate={listening || speaking} 
          value={
            step === STEPS.FINISHED ? 100 :
            step === STEPS.ASK_NAME ? 10 :
            step === STEPS.ASK_CLIENT ? 25 :
            step === STEPS.ASK_CLIENT_EMAIL ? 40 :
            step === STEPS.ASK_CLIENT_PHONE ? 50 :
            step === STEPS.ASK_DATE ? 70 :
            step === STEPS.ASK_BUDGET ? 85 : 
            step === STEPS.ASK_CONFIRMATION ? 95 : 0
          }
          className="max-w-full" 
          color={listening ? "danger" : "primary"}
        />
      )}
    </Card>
  );
}
