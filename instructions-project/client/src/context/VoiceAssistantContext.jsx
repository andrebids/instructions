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
  // Map i18n language to Speech API language
  const getSpeechLang = (lang) => {
    if (lang.startsWith('pt')) return 'pt-PT';
    if (lang.startsWith('fr')) return 'fr-FR';
    return 'en-US';
  };
  const currentLang = getSpeechLang(i18n.language || 'en-US');
  
  // Core Hooks - now reactive to language changes
  const { speak: speakBase, cancel: cancelSpeech, speaking } = useTTS(currentLang);
  const { start: startBase, stop, listening, transcript, supported, resetTranscript } = useSTT(currentLang);
  
  // Wrap speak and start to always use current language
  const speak = useCallback((text) => {
    speakBase(text, currentLang);
  }, [speakBase, currentLang]);
  
  const start = useCallback(() => {
    startBase(currentLang);
  }, [startBase, currentLang]);

  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  
  // Mode Management (Global vs Form Wizard)
  const [mode, setMode] = useState('GLOBAL'); // 'GLOBAL' | 'WIZARD'
  const [wizardState, setWizardState] = useState(null); // To hold wizard specific data/callbacks
  
  // Message Handling
  const addMessage = useCallback((sender, text) => {
    setMessages(prev => [...prev, { sender, text, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Actions
  const openAssistant = useCallback(() => {
    setIsOpen(true);
    // If we are in GLOBAL mode, say greeting
    if (mode === 'GLOBAL') {
      // Get greetings array and pick a random one
      const greetings = t('pages.dashboard.voiceAssistant.greetings', { 
        returnObjects: true,
        defaultValue: ["Olá, onde posso ser útil?"] 
      });
      
      const randomGreeting = Array.isArray(greetings) 
        ? greetings[Math.floor(Math.random() * greetings.length)]
        : greetings;
      
      addMessage('bot', randomGreeting);
      speak(randomGreeting);
      start();
    }
  }, [mode, t, speak, start, addMessage]);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
    stop();
    cancelSpeech();
  }, [stop, cancelSpeech]);

  // Register Wizard Handler
  const registerWizard = useCallback((wizardLogic) => {
    setMode('WIZARD');
    setWizardState(wizardLogic);
    // Reset transcript when entering wizard mode to avoid processing previous commands
    resetTranscript();
  }, [resetTranscript]);

  const unregisterWizard = useCallback(() => {
    setMode('GLOBAL');
    setWizardState(null);
  }, []);

  // Global Command Logic (only active if mode === 'GLOBAL')
  useEffect(() => {
    if (mode !== 'GLOBAL' || !transcript || !listening) return;

    const lower = transcript.toLowerCase();
    const createKeywords = [
      'criar projeto', 'novo projeto', 'adicionar projeto', 'iniciar obra', 'criar novo',
      'create project', 'new project', 'add project', 'create new',
      'créer un projet', 'nouveau projet', 'ajouter un projet'
    ];

    if (createKeywords.some(k => lower.includes(k))) {
      stop();
      resetTranscript(); // Clear the command so it doesn't persist
      const response = t('pages.dashboard.voiceAssistant.openingProject', { defaultValue: "A abrir novo projeto..." });
      addMessage('user', transcript);
      addMessage('bot', response);
      speak(response);
      
      if (window.handleCreateProjectGlobal) {
        setTimeout(() => {
           window.handleCreateProjectGlobal();
        }, 1500);
      }
    }
  }, [mode, transcript, listening, t, speak, stop, addMessage, resetTranscript]);

  // Wizard Logic Proxy
  useEffect(() => {
    if (mode === 'WIZARD' && wizardState && transcript && !listening) {
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
      resetTranscript,
      listening,
      transcript,
      supported,
      mode,
      registerWizard,
      unregisterWizard,
      cancelSpeech, // Expose cancelSpeech
      currentLang // Expose the calculated speech lang
    }}>
      {children}
    </VoiceAssistantContext.Provider>
  );
};
