/**
 * Validador de força de password
 * Implementa requisitos de segurança para passwords
 */

/**
 * Valida a força de uma password
 * @param {string} password - Password a validar
 * @returns {Object} - { isValid: boolean, errors: string[], strength: string }
 */
export function validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/'`~;]/.test(password);

    const errors = [];

    // Validações obrigatórias
    if (!password || password.length === 0) {
        errors.push('Password é obrigatória');
        return {
            isValid: false,
            errors,
            strength: 'none'
        };
    }

    if (password.length < minLength) {
        errors.push(`Password deve ter pelo menos ${minLength} caracteres`);
    }

    if (!hasUpperCase) {
        errors.push('Password deve conter pelo menos uma letra maiúscula');
    }

    if (!hasLowerCase) {
        errors.push('Password deve conter pelo menos uma letra minúscula');
    }

    if (!hasNumbers) {
        errors.push('Password deve conter pelo menos um número');
    }

    if (!hasSpecialChar) {
        errors.push('Password deve conter pelo menos um caractere especial (!@#$%^&*...)');
    }

    // Verificar passwords comuns (lista básica)
    const commonPasswords = [
        'password', 'password123', '12345678', 'qwerty123', 'abc123456',
        'password1', 'admin123', 'letmein123', 'welcome123', 'monkey123'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Password é muito comum. Escolha uma password mais única');
    }

    // Calcular força da password
    let strength = 'weak';
    const criteriasMet = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    if (errors.length === 0) {
        if (password.length >= 12 && criteriasMet === 4) {
            strength = 'strong';
        } else if (password.length >= 10 && criteriasMet >= 3) {
            strength = 'medium';
        } else {
            strength = 'fair';
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength,
        details: {
            length: password.length,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar,
            criteriasMet
        }
    };
}

/**
 * Gera uma mensagem de erro amigável para o utilizador
 * @param {Object} validation - Resultado de validatePasswordStrength
 * @returns {string} - Mensagem de erro formatada
 */
export function getPasswordErrorMessage(validation) {
    if (validation.isValid) {
        return null;
    }

    if (validation.errors.length === 1) {
        return validation.errors[0];
    }

    return `A password não cumpre os requisitos:\n${validation.errors.map(e => `• ${e}`).join('\n')}`;
}

/**
 * Obtém a cor para o indicador de força
 * @param {string} strength - Força da password (none, weak, fair, medium, strong)
 * @returns {string} - Nome da cor
 */
export function getPasswordStrengthColor(strength) {
    switch (strength) {
        case 'strong':
            return 'success';
        case 'medium':
            return 'primary';
        case 'fair':
            return 'warning';
        case 'weak':
        case 'none':
        default:
            return 'danger';
    }
}

/**
 * Obtém o label traduzido para a força da password
 * @param {string} strength - Força da password
 * @returns {string} - Label traduzido
 */
export function getPasswordStrengthLabel(strength) {
    const labels = {
        none: 'Sem password',
        weak: 'Muito fraca',
        fair: 'Fraca',
        medium: 'Média',
        strong: 'Forte'
    };

    return labels[strength] || labels.weak;
}
