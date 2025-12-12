import React, { useEffect, useRef } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceAssistant } from "../../context/VoiceAssistantContext";
import { useTranslation } from "react-i18next";

export const DashboardVoiceAssistant = () => {
  const { t } = useTranslation();
  const {
    isOpen,
    openAssistant,
    closeAssistant,
    messages,
    listening,
    supported,
    startListening,
    stopListening
  } = useVoiceAssistant();

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const toggleOpen = () => {
    if (isOpen) {
      closeAssistant();
    } else {
      openAssistant();
    }
  };

  if (!supported) return null;

  return (
    <>
      {/* FAB */}
      <Button
        isIconOnly
        color="primary"
        className={`fixed bottom-6 right-6 shadow-lg w-14 h-14 rounded-full transition-transform duration-200 hover:scale-105 z-50 bg-blue-600 text-white ${listening ? 'animate-pulse ring-4 ring-primary/30' : ''}`}
        onPress={toggleOpen}
        aria-label={isOpen ? t('common.close') : t('pages.dashboard.voiceAssistant.title')}
      >
        <Icon
          icon={isOpen ? "lucide:x" : "lucide:mic"}
          className="text-2xl"
        />
      </Button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-80 sm:w-96 shadow-2xl rounded-2xl overflow-hidden border border-divider bg-content1 dark:bg-content1"
          >
            {/* Header */}
            <div className="bg-primary/10 p-4 border-b border-divider flex items-center gap-3">
              <div className={`p-2 rounded-full ${listening ? 'bg-success/20 text-success animate-pulse' : 'bg-primary/20 text-primary'}`}>
                <Icon icon="lucide:bot" className="text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{t('pages.dashboard.voiceAssistant.title')}</h3>
                <p className="text-xs text-default-500">
                  {listening ? t('pages.dashboard.voiceAssistant.status.listening') : t('pages.dashboard.voiceAssistant.status.idle')}
                </p>
              </div>
              {listening && (
                <div className="ml-auto flex gap-1">
                  {[1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      className="w-1 bg-primary-500 rounded-full"
                      animate={{ height: [4, 12, 4] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-background/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user'
                      ? 'bg-primary-500 text-primary-foreground rounded-tr-none'
                      : 'bg-default-100 text-foreground rounded-tl-none'
                      }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer / Status */}
            <div className="p-3 bg-content2/50 border-t border-divider flex items-center justify-center">
              <div className="text-xs text-default-400">
                {listening ? t('pages.dashboard.voiceAssistant.footer.listening') : t('pages.dashboard.voiceAssistant.footer.clickToSpeak')}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
