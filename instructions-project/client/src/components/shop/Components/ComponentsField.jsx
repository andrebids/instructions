import React from "react";
import { Icon } from "@iconify/react";

export function ComponentsField({ materials, size = "base" }) {
  if (!materials) return null;

  // Filtrar apenas COMET STRING e LIGHT STRING do campo materiais
  const materialsArray = materials.split(",").map((m) => m.trim()).filter((m) => m.length > 0);
  const filteredMaterials = materialsArray.filter((m) => {
    return m.includes("COMET STRING") || m.includes("LIGHT STRING");
  });

  // Se não houver COMET STRING ou LIGHT STRING, não renderizar o campo
  if (filteredMaterials.length === 0) return null;

  const displayText = filteredMaterials.join(", ");

  const iconSize = size === "xs" ? "text-xs" : "text-base";
  const labelSize = size === "xs" ? "text-xs" : "text-sm";
  const contentSize = size === "xs" ? "text-sm leading-5" : "";
  const gap = size === "xs" ? "gap-2" : "gap-2";

  return (
    <div className={`flex items-start ${gap}`}>
      <Icon icon="lucide:box" className={`text-default-500 ${iconSize} mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className={`text-default-500 ${labelSize}`}>Components</div>
        <div className={`break-words whitespace-normal ${contentSize} ${size === "xs" ? "text-foreground/90" : ""}`}>
          {displayText}
        </div>
      </div>
    </div>
  );
}

