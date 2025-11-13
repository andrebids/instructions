import { useState, useRef, useCallback } from 'react';

/**
 * Hook para gerenciar estado global de salvamento
 * Usado para mostrar status visual de salvamento em componentes filhos
 */
export const useSaveStatus = () => {
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const timeoutRef = useRef(null);

  // Limpar timeout anterior se existir
  const clearAutoReset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Definir estado como salvando
  const setSaving = useCallback(() => {
    clearAutoReset();
    setStatus('saving');
  }, [clearAutoReset]);

  // Definir estado como salvo (auto-reset após 3 segundos)
  const setSaved = useCallback(() => {
    clearAutoReset();
    setStatus('saved');
    
    // Auto-reset para idle após 3 segundos
    timeoutRef.current = setTimeout(() => {
      setStatus('idle');
      timeoutRef.current = null;
    }, 3000);
  }, [clearAutoReset]);

  // Definir estado como erro (auto-reset após 5 segundos)
  const setError = useCallback(() => {
    clearAutoReset();
    setStatus('error');
    
    // Auto-reset para idle após 5 segundos
    timeoutRef.current = setTimeout(() => {
      setStatus('idle');
      timeoutRef.current = null;
    }, 5000);
  }, [clearAutoReset]);

  // Reset manual para idle
  const reset = useCallback(() => {
    clearAutoReset();
    setStatus('idle');
  }, [clearAutoReset]);

  return {
    status,
    setSaving,
    setSaved,
    setError,
    reset,
  };
};

