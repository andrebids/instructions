import React from "react";
import { Icon } from "@iconify/react";

export function WeightField({ weight, size = "base" }) {
  if (!weight) return null;

  const iconSize = size === "xs" ? "text-xs" : "text-base";
  const labelSize = size === "xs" ? "text-xs" : "text-sm";
  const contentSize = size === "xs" ? "text-sm leading-5 text-foreground/90" : "";
  const gap = size === "xs" ? "gap-2" : "gap-2";

  return (
    <div className={`flex items-start ${gap}`}>
      <Icon icon="lucide:scale" className={`text-default-500 ${iconSize} mt-0.5`} />
      <div>
        <div className={`text-default-500 ${labelSize}`}>Weight</div>
        <div className={contentSize}>{weight} kg</div>
      </div>
    </div>
  );
}

