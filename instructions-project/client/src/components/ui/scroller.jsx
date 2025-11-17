import React from "react";

export function Scroller({ 
  children, 
  className = "", 
  hideScrollbar = false,
  ...props 
}) {
  const scrollbarClass = hideScrollbar ? "scrollbar-hide" : "";
  const combinedClassName = `overflow-auto ${scrollbarClass} ${className}`.trim();
  
  return (
    <div
      className={combinedClassName}
      {...props}
    >
      {children}
    </div>
  );
}

