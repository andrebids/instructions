import React from "react";
import { Icon } from "@iconify/react";

export function EffectsField({ effects, size = "base" }) {
  if (!effects) return null;

  const iconSize = size === "xs" ? "text-xs" : "text-base";
  const labelSize = size === "xs" ? "text-xs" : "text-sm";
  const contentSize = size === "xs" ? "text-sm leading-5 text-foreground/90 break-words" : "";
  const gap = size === "xs" ? "gap-2" : "gap-2";

  // Format effects correctly - handle both arrays and strings
  // If it's an array, join with ", " for proper separation
  // If it's a string, use it as is (but ensure it doesn't have weird concatenations)
  let displayValue;
  if (Array.isArray(effects)) {
    displayValue = effects.filter(e => e && e.trim() !== '').join(", ");
  } else if (typeof effects === 'string') {
    // If it's a string, use it directly
    displayValue = effects;
  } else {
    displayValue = String(effects);
  }

  return (
    <div className={`flex items-start ${gap}`}>
      <Icon icon="lucide:sparkles" className={`text-default-500 ${iconSize} mt-0.5`} />
      <div>
        <div className={`text-default-500 ${labelSize}`}>LED / Effects</div>
        <div className={`break-words whitespace-normal ${contentSize}`}>{displayValue}</div>
      </div>
    </div>
  );
}

