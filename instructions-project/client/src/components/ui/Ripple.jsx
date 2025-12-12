import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Hook to manage ripples
export function useRipple() {
  const [ripples, setRipples] = useState([]);

  const onRippleClickHandler = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height);
    
    const newRipple = {
      x,
      y,
      size,
      key: Date.now().toString() + Math.random(),
    };

    setRipples((prev) => [...prev, newRipple]);
  }, []);

  const onClearRipple = useCallback((key) => {
    setRipples((prev) => prev.filter((item) => item.key !== key));
  }, []);

  return { ripples, onRippleClickHandler, onClearRipple };
}

// Ripple Component
export const Ripple = ({ ripples = [], onClear, color = "currentColor" }) => {
  return (
    <span className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit]">
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.key}
            initial={{ transform: "scale(0)", opacity: 0.35 }}
            animate={{ transform: "scale(2)", opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "linear" }}
            style={{
              position: "absolute",
              top: ripple.y - ripple.size / 2,
              left: ripple.x - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: color,
              borderRadius: "100%",
            }}
            onAnimationComplete={() => onClear(ripple.key)}
          />
        ))}
      </AnimatePresence>
    </span>
  );
};
