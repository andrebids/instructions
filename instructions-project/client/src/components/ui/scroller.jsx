import React from "react";

export const Scroller = React.forwardRef(({
  children,
  className = "",
  hideScrollbar = false,
  ...props
}, ref) => {
  const scrollbarClass = hideScrollbar ? "scrollbar-hide" : "";
  const combinedClassName = `overflow-auto bg-transparent ${scrollbarClass} ${className}`.trim();

  return (
    <div
      ref={ref}
      className={combinedClassName}
      {...props}
    >
      {children}
    </div>
  );
});

Scroller.displayName = "Scroller";

