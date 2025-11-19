import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTTS } from '../hooks/useTTS';
import { useSTT } from '../hooks/useSTT';

const VoiceAssistantContext = createContext();

export const useVoiceAssistant = () => {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error('useVoiceAssistant must be used within a VoiceAssistantProvider');
  }
  return context;
};

export const VoiceAssistantProvider = ({ children }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en-US';
  
  // Core Hooks
  const { speak, cancel: cancelSpeech, speaking } = useTTS(currentLang);
  const { start, stop, listening, transcript, supported } = useSTT(currentLang);

  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  
  // Mode Management (Global vs Form Wizard)
  const [mode, setMode] = useState('GLOBAL'); // 'GLOBAL' | 'WIZARD'
  const [wizardState, setWizardState] = useState(null); // To hold wizard specific data/callbacks
  
  // Message Handling
  const addMessage = useCallback((sender, text) => {
    setMessages(prev => [...prev, { sender, text, id: Date.now() }]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Actions
  const openAssistant = useCallback(() => {
    setIsOpen(true);
    // If we are in GLOBAL mode, say greeting
    if (mode === 'GLOBAL') {
      const greeting = t('dashboard.voiceAssistant.greeting', { 
        defaultValue: "Olá, onde posso ser útil?" 
      });
      addMessage('bot', greeting);
      speak(greeting);
      start();
    }
  }, [mode, t, speak, start, addMessage]);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
    stop();
    cancelSpeech();
    // Don't reset mode here, as we might want to resume? 
    // Actually, usually closing means stop everything.
    // But if user just minimizes? Let's keep mode but stop listening.
  }, [stop, cancelSpeech]);

  // Register Wizard Handler
  // This allows a component to "take over" the assistant logic
  const registerWizard = useCallback((wizardLogic) => {
    setMode('WIZARD');
    setWizardState(wizardLogic);
    // Clear previous messages or keep them? Maybe keep them.
    // But usually wizard starts fresh.
    // setMessages([]); 
  }, []);

  const unregisterWizard = useCallback(() => {
    setMode('GLOBAL');
    setWizardState(null);
  }, []);

  // Global Command Logic (only active if mode === 'GLOBAL')
  useEffect(() => {
    if (mode !== 'GLOBAL' || !transcript || !listening) return;

    const lower = transcript.toLowerCase();
    const createKeywords = [
      'criar projeto', 'novo projeto', 'adicionar projeto', 'iniciar obra',
      'create project', 'new project', 'add project',
      'créer un projet', 'nouveau projet', 'ajouter un projet'
    ];

    if (createKeywords.some(k => lower.includes(k))) {
      stop();
      const response = t('dashboard.voiceAssistant.openingProject', { defaultValue: "A abrir novo projeto..." });
      addMessage('user', transcript);
      addMessage('bot', response);
      speak(response);
      
      // Trigger global action if registered (e.g. navigation)
      // We can use a custom event or callback stored in context
      if (window.handleCreateProjectGlobal) {
        setTimeout(() => {
           window.handleCreateProjectGlobal();
           // Note: The wizard component will mount and call registerWizard
        }, 1500);
      }
    }
  }, [mode, transcript, listening, t, speak, stop, addMessage]);

  // Wizard Logic Proxy
  // When in WIZARD mode, we pass transcript to the registered wizard handler
  useEffect(() => {
    if (mode === 'WIZARD' && wizardState && transcript && !listening) {
        // We only pass "final" transcripts (when listening stops or we detect silence/final result)
        // Actually useSTT might update transcript continuously. 
        // The wizard logic usually expects final text.
        // For now, let's pass it and let wizard decide.
        // BUT, we need to know when to "process" it.
        // The original wizard processed on "useEffect [listening, transcript]".
        wizardState.onTranscript(transcript);
    }
  }, [mode, wizardState, transcript, listening]);

  return (
    <VoiceAssistantContext.Provider value={{
      isOpen,
      openAssistant,
      closeAssistant,
      messages,
      addMessage,
      clearMessages,
      speak,
      speaking,
      startListening: start,
      stopListening: stop,
      listening,
      transcript,
      supported,
      mode,
      registerWizard,
      unregisterWizard
    }}>
      {children}
    </VoiceAssistantContext.Provider>
  );
};
