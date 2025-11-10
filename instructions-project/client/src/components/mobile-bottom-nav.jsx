import React from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "@iconify/react";
import { navigationItems } from "../constants/navigation";
import { useResponsiveProfile } from "../hooks/useResponsiveProfile";

export function MobileBottomNav({
  items = navigationItems,
  onLinkClick,
  className = "",
  maxWidth,
}) {
  const { isHandheld } = useResponsiveProfile({ maxWidth });

  if (!isHandheld) {
    return null;
  }

  const handleLinkClick = (callback) => () => {
    if (typeof onLinkClick === "function") {
      onLinkClick();
    }
    if (typeof callback === "function") {
      callback();
    }
  };

  const baseClasses =
    "fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around gap-2 bg-black/90 backdrop-blur-md border-t border-white/10 py-3 px-4";

  return (
    <nav className={`${baseClasses}${className ? ` ${className}` : ""}`}>
      {items.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          aria-label={item.name}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs transition-colors ${
              isActive ? "text-white" : "text-gray-400 hover:text-gray-200"
            }`
          }
          onClick={handleLinkClick(item.onClick)}
        >
          {({ isActive }) => (
            <>
              <Icon
                icon={item.icon}
                className={`text-xl ${
                  isActive ? "text-white" : "text-gray-400"
                }`}
              />
              <span>{item.name}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}


