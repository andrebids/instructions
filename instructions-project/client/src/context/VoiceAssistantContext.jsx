import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTTS } from '../hooks/useTTS';
import { useSTT } from '../hooks/useSTT';
import { fuzzyContains } from '../utils/stringUtils';
import { getConversationMemory } from '../utils/voiceAssistant/conversationMemory';
import { analyzeDashboardContext, getContextPriority } from '../utils/voiceAssistant/contextAnalyzer';
import { generateSmartGreeting, generateActionSuggestions } from '../utils/voiceAssistant/suggestionEngine';

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

  // Get language code for utilities (pt, en, fr)
  const getLanguageCode = (lang) => {
    if (lang.startsWith('pt')) return 'pt';
    if (lang.startsWith('fr')) return 'fr';
    return 'en';
  };
  const languageCode = getLanguageCode(i18n.language || 'en');

  // Core Hooks - now reactive to language changes
  const { speak: speakBase, cancel: cancelSpeech, speaking } = useTTS(currentLang);
  const { start: startBase, stop, listening, transcript, supported, resetTranscript } = useSTT(currentLang);

  // Wrap speak to enable auto-detection by default
  // Text will be auto-detected unless explicitly overridden
  const speak = useCallback((text, options = {}) => {
    // If options is a string (backward compatibility), pass it through
    if (typeof options === 'string') {
      speakBase(text, options);
    } else {
      // Enable auto-detection by default
      speakBase(text, {
        autoDetect: true,
        confidenceThreshold: 0.5,
        ...options
      });
    }
  }, [speakBase]);

  const start = useCallback(() => {
    startBase(currentLang);
  }, [startBase, currentLang]);

  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  // Mode Management (Global vs Form Wizard)
  const [mode, setMode] = useState('GLOBAL'); // 'GLOBAL' | 'WIZARD'
  const [wizardState, setWizardState] = useState(null); // To hold wizard specific data/callbacks

  // Context State
  const [dashboardContext, setDashboardContext] = useState(null);
  const conversationMemory = useRef(getConversationMemory());

  // Page tracking
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' | 'createProject' | 'projectDetails'

  // Message Handling
  const addMessage = useCallback((sender, text) => {
    const message = { sender, text, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    setMessages(prev => [...prev, message]);
    // Also add to conversation memory
    conversationMemory.current.addMessage(sender, text);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    conversationMemory.current.clearSession();
  }, []);

  // Helper function to speak and then listen for response
  const speakAndListen = useCallback((text) => {
    speak(text);
    // Listening will start automatically via the useEffect that monitors 'speaking' state
  }, [speak]);

  // Update dashboard context
  const updateDashboardContext = useCallback((projects, user) => {
    const context = analyzeDashboardContext(projects, user);
    setDashboardContext(context);
  }, []);

  // Actions
  const openAssistant = useCallback(() => {
    setIsOpen(true);
    // If we are in GLOBAL mode, say greeting
    if (mode === 'GLOBAL') {
      let greeting;

      // Use smart greeting if we have dashboard context
      if (dashboardContext) {
        greeting = generateSmartGreeting(dashboardContext, languageCode);
      } else {
        // Fallback to random greeting
        const greetings = t('pages.dashboard.voiceAssistant.greetings', {
          returnObjects: true,
          defaultValue: ["Olá, onde posso ser útil?"]
        });
        greeting = Array.isArray(greetings)
          ? greetings[Math.floor(Math.random() * greetings.length)]
          : greetings;
      }

      addMessage('bot', greeting);
      speak(greeting);

      // Note: We'll start listening after speech finishes (handled by useEffect below)
    }
  }, [mode, t, speak, addMessage, dashboardContext, languageCode]);

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

  // Auto-start listening after bot finishes speaking
  const speakingRef = useRef(speaking);
  const wasJustSpeaking = useRef(false);

  useEffect(() => {
    // Track when speaking transitions from true to false
    if (speakingRef.current && !speaking) {
      wasJustSpeaking.current = true;

      // Start listening after a small delay when bot finishes speaking
      if (isOpen && mode === 'GLOBAL' && !listening) {
        setTimeout(() => {
          start();
          wasJustSpeaking.current = false;
        }, 300); // Small buffer to ensure smooth transition
      }
    }
    speakingRef.current = speaking;
  }, [speaking, isOpen, mode, listening, start]);

  // Global Command Logic (only active if mode === 'GLOBAL')
  useEffect(() => {
    if (mode !== 'GLOBAL' || !transcript || !listening) return;

    // Expanded keyword list with synonyms and colloquialisms
    const createKeywords = [
      // PT
      'criar projeto', 'novo projeto', 'adicionar projeto', 'iniciar obra', 'criar novo',
      'abrir projeto', 'nova obra', 'começar obra', 'fazer projeto', 'novo registo',
      // EN
      'create project', 'new project', 'add project', 'create new',
      'start project', 'open project', 'make new project', 'begin project',
      // FR
      'créer un projet', 'nouveau projet', 'ajouter un projet',
      'commencer un projet', 'ouvrir un projet', 'faire un projet'
    ];

    // Use fuzzy matching instead of strict includes
    const isMatch = createKeywords.some(k => fuzzyContains(transcript, k, 0.75));

    if (isMatch) {
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
      speakAndListen, // Helper that speaks and waits for response
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
      currentLang, // Expose the calculated speech lang
      languageCode, // Expose language code for utilities
      // Context and memory
      dashboardContext,
      updateDashboardContext,
      conversationMemory: conversationMemory.current,
      currentPage,
      setCurrentPage
    }}>
      {children}
    </VoiceAssistantContext.Provider>
  );
};
