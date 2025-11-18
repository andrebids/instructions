/**
 * Componente Button com garantia de acessibilidade
 * Garante que botões com isIconOnly sempre tenham aria-label
 */
import { Button } from "@heroui/react";
import { ensureAccessibilityLabel } from "../../utils/accessibility";

export function AccessibleButton({ 
  children, 
  isIconOnly, 
  ariaLabel,
  ...props 
}) {
  // Se é um botão apenas com ícone e não tem aria-label, usa o ariaLabel fornecido
  // ou tenta extrair do children ou title
  const finalAriaLabel = isIconOnly && !props['aria-label'] && !props['aria-labelledby']
    ? (ariaLabel || props.title || (typeof children === 'string' ? children : 'Button'))
    : props['aria-label'];

  const finalProps = {
    ...props,
    isIconOnly,
    ...(finalAriaLabel && !props['aria-label'] && !props['aria-labelledby'] 
      ? { 'aria-label': finalAriaLabel } 
      : {})
  };

  return <Button {...finalProps}>{children}</Button>;
}

