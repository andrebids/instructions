/**
 * Utilitários de acessibilidade para garantir que elementos interativos
 * sempre tenham labels apropriados (aria-label ou aria-labelledby)
 */

/**
 * Garante que um elemento tenha um label de acessibilidade
 * @param {Object} props - Props do elemento
 * @param {string} defaultLabel - Label padrão a ser usado se não houver label visível
 * @returns {Object} Props com aria-label adicionado se necessário
 */
export function ensureAccessibilityLabel(props, defaultLabel) {
  // Se já tem aria-label ou aria-labelledby, retorna as props como estão
  if (props['aria-label'] || props['aria-labelledby']) {
    return props;
  }

  // Se tem um label visível (children com texto), retorna as props como estão
  if (props.children && typeof props.children === 'string' && props.children.trim()) {
    return props;
  }

  // Se tem um label visível (title), retorna as props como estão
  if (props.title) {
    return props;
  }

  // Se não tem label visível nem aria-label, adiciona o defaultLabel como aria-label
  return {
    ...props,
    'aria-label': defaultLabel || 'Interactive element'
  };
}

/**
 * Hook para garantir que elementos interativos tenham labels
 * @param {Object} props - Props do elemento
 * @param {string} defaultLabel - Label padrão
 * @returns {Object} Props com aria-label se necessário
 */
export function useAccessibilityLabel(props, defaultLabel) {
  return ensureAccessibilityLabel(props, defaultLabel);
}

/**
 * Wrapper para Button que garante aria-label
 */
export function AccessibleButton({ children, isIconOnly, ariaLabel, ...props }) {
  const finalProps = ensureAccessibilityLabel(
    { ...props, isIconOnly },
    ariaLabel || (typeof children === 'string' ? children : 'Button')
  );

  return finalProps;
}

/**
 * Wrapper para Input que garante aria-label
 */
export function AccessibleInput({ label, placeholder, ariaLabel, ...props }) {
  // Se já tem label visível, não precisa de aria-label
  if (label) {
    return { label, placeholder, ...props };
  }

  // Se não tem label mas tem placeholder, usa placeholder como aria-label
  const finalAriaLabel = ariaLabel || placeholder || 'Input field';
  
  return {
    ...props,
    placeholder,
    'aria-label': finalAriaLabel
  };
}

/**
 * Wrapper para select que garante aria-label
 */
export function AccessibleSelect({ children, ariaLabel, ...props }) {
  const finalProps = ensureAccessibilityLabel(
    props,
    ariaLabel || 'Select option'
  );

  return { ...finalProps, children };
}

