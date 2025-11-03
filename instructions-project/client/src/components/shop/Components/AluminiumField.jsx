import React from "react";
import { Icon } from "@iconify/react";

export function AluminiumField({ aluminium, size = "base" }) {
  if (!aluminium) return null;

  const iconSize = size === "xs" ? "text-xs" : "text-base";
  const labelSize = size === "xs" ? "text-xs" : "text-sm";
  const contentSize = size === "xs" ? "text-sm leading-5 text-foreground/90 break-words" : "";
  const gap = size === "xs" ? "gap-2" : "gap-2";

  const displayValue = Array.isArray(aluminium) ? aluminium.join(", ") : aluminium;

  return (
    <div className={`flex items-start ${gap}`}>
      <Icon icon="lucide:box" className={`text-default-500 ${iconSize} mt-0.5`} />
      <div>
        <div className={`text-default-500 ${labelSize}`}>Aluminium</div>
        <div className={`break-words whitespace-normal ${contentSize}`}>
          {displayValue}
        </div>
      </div>
    </div>
  );
}

