import React from 'react';
import { Chip, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Componente visual de status de salvamento
 * Mantém espaço reservado mesmo quando idle para evitar movimento da barra
 */
export function SaveStatus({ status }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          color: 'warning',
          text: 'Saving...',
          icon: null, // Usar Spinner ao invés de ícone
          showSpinner: true,
        };
      case 'saved':
        return {
          color: 'success',
          text: 'Saved',
          icon: 'lucide:check',
          showSpinner: false,
        };
      case 'error':
        return {
          color: 'danger',
          text: 'Save error',
          icon: 'lucide:alert-circle',
          showSpinner: false,
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  return (
    <div className="min-w-[100px] h-8 flex items-center justify-end">
      <AnimatePresence mode="wait">
        {config && (
          <motion.div
            key={status}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
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
        )}
      </AnimatePresence>
    </div>
  );
}

