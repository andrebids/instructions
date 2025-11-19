import { useState, useCallback } from 'react';
import {
  evaluatePasswordStrength,
  getStrengthColor,
  getStrengthLabel,
  generateSecurePassword as generatePasswordUtil,
} from '../utils/passwordUtils';

/**
 * Hook para gerenciar geração e avaliação de senhas
 * @param {Function} onPasswordChange - Callback quando senha é alterada
 * @returns {Object} - Estados e funções para gerenciar senha
 */
export function usePasswordGenerator(onPasswordChange = null) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  /**
   * Gera uma nova senha segura
   * @returns {string} - Senha gerada
   */
  const generatePassword = useCallback(() => {
    const newPassword = generatePasswordUtil(12);
    
    // Atualizar força da senha
    const strength = evaluatePasswordStrength(newPassword);
    setPasswordStrength(strength);
    
    // Mostrar senha inicialmente quando gerada
    setShowPassword(true);
    
    // Chamar callback se fornecido
    if (onPasswordChange) {
      onPasswordChange(newPassword);
    }
    
    return newPassword;
  }, [onPasswordChange]);

  /**
   * Atualiza a força da senha quando ela muda
   * @param {string} password - Nova senha
   */
  const updatePasswordStrength = useCallback((password) => {
    const strength = evaluatePasswordStrength(password);
    setPasswordStrength(strength);
  }, []);

  /**
   * Alterna visibilidade da senha
   */
  const toggleVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  /**
   * Reseta todos os estados
   */
  const reset = useCallback(() => {
    setShowPassword(false);
    setPasswordStrength('');
  }, []);

  return {
    // Estados
    showPassword,
    passwordStrength,
    strengthColor: getStrengthColor(passwordStrength),
    strengthLabel: getStrengthLabel(passwordStrength),
    
    // Funções
    generatePassword,
    updatePasswordStrength,
    toggleVisibility,
    reset,
    setShowPassword,
  };
}

