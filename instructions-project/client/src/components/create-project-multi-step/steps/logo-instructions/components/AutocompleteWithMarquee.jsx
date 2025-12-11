import React from "react";
import { Autocomplete } from "@heroui/react";

// Componente Autocomplete com suporte a marquee no valor selecionado
export const AutocompleteWithMarquee = React.forwardRef((props, ref) => {
  const triggerRef = React.useRef(null);
  const combinedRef = React.useCallback((node) => {
    triggerRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  React.useEffect(() => {
    if (!triggerRef.current) return;

    const trigger = triggerRef.current;
    let cleanup = null;

    const checkAndApplyMarquee = () => {
      const input = trigger.querySelector('input');
      if (!input) return;

      // Verificar se o texto está truncado
      const isOverflowing = input.scrollWidth > input.clientWidth;

      const handleMouseEnter = () => {
        if (isOverflowing && input) {
          input.style.overflow = 'visible';
          input.style.animation = 'marquee 10s linear infinite';
          input.style.paddingRight = '2rem';
          input.style.whiteSpace = 'nowrap';
        }
      };

      const handleMouseLeave = () => {
        if (input) {
          input.style.overflow = 'hidden';
          input.style.animation = 'none';
          input.style.paddingRight = '0';
        }
      };

      trigger.addEventListener('mouseenter', handleMouseEnter);
      trigger.addEventListener('mouseleave', handleMouseLeave);

      cleanup = () => {
        trigger.removeEventListener('mouseenter', handleMouseEnter);
        trigger.removeEventListener('mouseleave', handleMouseLeave);
      };
    };

    // Verificar após um delay para garantir que o DOM está pronto
    const timeout = setTimeout(checkAndApplyMarquee, 100);

    // Observar mudanças no DOM
    const observer = new MutationObserver(checkAndApplyMarquee);
    observer.observe(trigger, { childList: true, subtree: true, attributes: true });

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      if (cleanup) cleanup();
    };
  }, [props.selectedKey, props.inputValue, props.children]);

  return <Autocomplete {...props} ref={combinedRef} />;
});

AutocompleteWithMarquee.displayName = 'AutocompleteWithMarquee';


