/**
 * Utilitários para gerenciamento de senhas
 * Funções puras para avaliação de força e geração de senhas seguras
 */

/**
 * Avalia a força de uma senha baseada em critérios de segurança
 * @param {string} password - Senha a avaliar
 * @returns {string} - 'Weak', 'Medium', 'Strong' ou ''
 */
export function evaluatePasswordStrength(password) {
  if (!password) return '';
  
  let score = 0;
  
  // Check password length (mínimo 8 caracteres)
  if (password.length >= 8) score += 1;
  
  // Contains lowercase
  if (/[a-z]/.test(password)) score += 1;
  
  // Contains uppercase
  if (/[A-Z]/.test(password)) score += 1;
  
  // Contains numbers
  if (/\d/.test(password)) score += 1;
  
  // Contains special characters
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  // Determinar força baseada no score
  switch (score) {
    case 0:
    case 1:
    case 2:
      return 'Weak';
    case 3:
      return 'Medium';
    case 4:
    case 5:
      return 'Strong';
    default:
      return '';
  }
}

/**
 * Obtém a cor do HeroUI baseada na força da senha
 * @param {string} strength - Força da senha ('Weak', 'Medium', 'Strong')
 * @returns {string} - Nome da cor do HeroUI
 */
export function getStrengthColor(strength) {
  switch (strength) {
    case 'Weak':
      return 'danger'; // Vermelho
    case 'Medium':
      return 'warning'; // Laranja/Amarelo
    case 'Strong':
      return 'success'; // Verde
    default:
      return 'default';
  }
}

/**
 * Obtém o label traduzido para força da senha
 * @param {string} strength - Força da senha
 * @returns {string} - Label em português
 */
export function getStrengthLabel(strength) {
  switch (strength) {
    case 'Weak':
      return 'Fraca';
    case 'Medium':
      return 'Média';
    case 'Strong':
      return 'Forte';
    default:
      return '';
  }
}

/**
 * Gera uma senha segura usando Web Crypto API (compatível com browser)
 * @param {number} length - Comprimento da senha (padrão: 12)
 * @returns {string} - Senha gerada
 */
export function generateSecurePassword(length = 12) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*(),.?":{}|<>_\\-+=[\\]\\/\'`~;';
  const allChars = uppercase + lowercase + numbers + symbols;
  
  // Garantir que a senha tenha pelo menos um de cada tipo
  let password = '';
  
  // Usar Web Crypto API para seleção aleatória segura
  const randomArray = new Uint32Array(4);
  crypto.getRandomValues(randomArray);
  
  // Adicionar pelo menos um de cada tipo usando valores criptograficamente seguros
  password += uppercase[randomArray[0] % uppercase.length];
  password += lowercase[randomArray[1] % lowercase.length];
  password += numbers[randomArray[2] % numbers.length];
  password += symbols[randomArray[3] % symbols.length];
  
  // Preencher o resto com caracteres aleatórios usando Web Crypto API
  const array = new Uint32Array(length - 4);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length - 4; i++) {
    password += allChars[array[i] % allChars.length];
  }
  
  // Embaralhar a senha usando Web Crypto API (Fisher-Yates shuffle)
  const passwordArray = password.split('');
  const shuffleArray = new Uint32Array(passwordArray.length - 1);
  crypto.getRandomValues(shuffleArray);
  
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = shuffleArray[i - 1] % (i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }
  
  return passwordArray.join('');
}

