import React from "react";
import { Icon } from "@iconify/react";

export function AnimatedSparklesField({ sparkles, size = "base" }) {
  if (!sparkles) return null;

  const iconSize = size === "xs" ? "text-xs" : "text-base";
  const labelSize = size === "xs" ? "text-xs" : "text-sm";
  const contentSize = size === "xs" ? "text-sm leading-5 text-foreground/90 break-words" : "";
  const gap = size === "xs" ? "gap-2" : "gap-2";

  // Format sparkles correctly - handle both arrays and strings
  let displayValue;
  if (Array.isArray(sparkles)) {
    displayValue = sparkles.filter(s => s && s.trim() !== '').join(", ");
  } else if (typeof sparkles === 'string') {
    displayValue = sparkles;
  } else {
    displayValue = String(sparkles);
  }

  return (
    <div className={`flex items-start ${gap}`}>
      <Icon icon="lucide:sparkles" className={`text-default-500 ${iconSize} mt-0.5`} />
      <div>
        <div className={`text-default-500 ${labelSize}`}>Animated Sparkles</div>
        <div className={`break-words whitespace-normal ${contentSize}`}>{displayValue}</div>
      </div>
    </div>
  );
}

