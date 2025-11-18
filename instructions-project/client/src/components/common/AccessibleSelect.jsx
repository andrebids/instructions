/**
 * Componente Select com garantia de acessibilidade
 * Garante que selects sempre tenham aria-label
 */
import { ensureAccessibilityLabel } from "../../utils/accessibility";

export function AccessibleSelect({ 
  children, 
  ariaLabel,
  ...props 
}) {
  const finalProps = ensureAccessibilityLabel(
    props,
    ariaLabel || 'Select option'
  );

  return <select {...finalProps}>{children}</select>;
}

