import React from 'react';
import { Input, Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { usePasswordGenerator } from '../../hooks/usePasswordGenerator';

/**
 * Componente reutilizável para campo de senha com:
 * - Toggle de visibilidade
 * - Gerador de senha segura
 * - Indicador de força da senha
 * 
 * @param {Object} props
 * @param {string} props.value - Valor da senha
 * @param {Function} props.onChange - Callback quando senha muda
 * @param {string} props.label - Label do campo
 * @param {string} props.placeholder - Placeholder do campo
 * @param {boolean} props.required - Se o campo é obrigatório
 * @param {string} props.size - Tamanho do input (padrão: 'md')
 * @param {string} props.color - Cor do input (opcional, será sobrescrito pela força)
 * @param {string} props.description - Descrição adicional (opcional)
 * @param {boolean} props.showGenerator - Se deve mostrar botão de gerar senha (padrão: true)
 * @param {Function} props.onPasswordGenerated - Callback quando senha é gerada
 */
export function PasswordField({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  size = 'md',
  color,
  description,
  showGenerator = true,
  onPasswordGenerated,
  ...otherProps
}) {
  const passwordGenerator = usePasswordGenerator((newPassword) => {
    if (onPasswordGenerated) {
      onPasswordGenerated(newPassword);
    } else if (onChange) {
      onChange({ target: { value: newPassword } });
    }
  });

  // Atualizar força quando valor muda
  React.useEffect(() => {
    if (value) {
      passwordGenerator.updatePasswordStrength(value);
    } else {
      passwordGenerator.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e) => {
    const newPassword = e.target.value;
    passwordGenerator.updatePasswordStrength(newPassword);
    if (onChange) {
      onChange(e);
    }
  };

  const handleGenerate = () => {
    const newPassword = passwordGenerator.generatePassword();
    if (onPasswordGenerated) {
      onPasswordGenerated(newPassword);
    } else if (onChange) {
      onChange({ target: { value: newPassword } });
    }
  };

  const displayColor = passwordGenerator.passwordStrength 
    ? passwordGenerator.strengthColor 
    : color || 'default';

  const displayDescription = passwordGenerator.passwordStrength
    ? `Força: ${passwordGenerator.strengthLabel}`
    : description || '';

  return (
    <Input
      label={label}
      placeholder={placeholder}
      type={passwordGenerator.showPassword ? "text" : "password"}
      value={value || ''}
      onChange={handleChange}
      size={size}
      color={displayColor}
      description={displayDescription}
      isRequired={required}
      endContent={
        <div className="flex items-center gap-1">
          {value && (
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={passwordGenerator.toggleVisibility}
              aria-label={passwordGenerator.showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              <Icon 
                icon={passwordGenerator.showPassword ? "lucide:eye-off" : "lucide:eye"} 
                className="text-default-400" 
              />
            </Button>
          )}
          {showGenerator && (
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={handleGenerate}
              aria-label="Gerar senha segura"
            >
              <Icon icon="lucide:refresh-cw" className="text-default-400" />
            </Button>
          )}
        </div>
      }
      {...otherProps}
    />
  );
}

