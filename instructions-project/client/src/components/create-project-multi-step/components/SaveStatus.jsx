import React from 'react';
import { Chip, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Componente visual de status de salvamento
 * Aparece apenas quando está salvando ou acabou de salvar
 */
export function SaveStatus({ status }) {
  // Não renderizar quando idle
  if (status === 'idle') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          color: 'warning',
          text: 'Salvando...',
          icon: null, // Usar Spinner ao invés de ícone
          showSpinner: true,
        };
      case 'saved':
        return {
          color: 'success',
          text: 'Salvo',
          icon: 'lucide:check',
          showSpinner: false,
        };
      case 'error':
        return {
          color: 'danger',
          text: 'Erro ao salvar',
          icon: 'lucide:alert-circle',
          showSpinner: false,
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center"
      >
        <Chip
          color={config.color}
          variant="flat"
          size="md"
          className="flex items-center gap-2"
          startContent={
            config.showSpinner ? (
              <Spinner 
                size="sm" 
                color={config.color}
                className="w-4 h-4"
              />
            ) : config.icon ? (
              <Icon icon={config.icon} className="text-sm" />
            ) : null
          }
        >
          {config.text}
        </Chip>
      </motion.div>
    </AnimatePresence>
  );
}

