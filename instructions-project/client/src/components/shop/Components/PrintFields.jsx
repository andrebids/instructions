import React from "react";
import { Icon } from "@iconify/react";

export function PrintFields({ printType, printColor, size = "base" }) {
  if (!printType && !printColor) return null;

  const iconSize = size === "xs" ? "text-xs" : "text-base";
  const labelSize = size === "xs" ? "text-xs" : "text-sm";
  const contentSize = size === "xs" ? "text-sm leading-5" : "";
  const gap = size === "xs" ? "gap-2" : "gap-2";

  return (
    <div className={`flex items-start ${gap}`}>
      <Icon icon="lucide:palette" className={`text-default-500 ${iconSize} mt-0.5`} />
      <div className="flex-1 flex flex-wrap gap-x-4 gap-y-1">
        {printType && (
          <div>
            <div className={`text-default-500 ${labelSize}`}>Print Type</div>
            <div className={`${contentSize} ${size === "xs" ? "text-foreground/90 break-words" : ""}`}>
              {printType}
            </div>
          </div>
        )}
        {printColor && (
          <div className="flex-1 min-w-0">
            <div className={`text-default-500 ${labelSize}`}>Print Color</div>
            <div className={`break-words whitespace-normal ${contentSize} ${size === "xs" ? "text-foreground/90" : ""}`}>
              {Array.isArray(printColor) ? printColor.join(", ") : printColor}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

