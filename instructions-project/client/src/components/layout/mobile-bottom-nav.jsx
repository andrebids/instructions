import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { navigationItems } from "../../constants/navigation";
import { useResponsiveProfile } from "../../hooks/useResponsiveProfile";

export function MobileBottomNav({
  items = navigationItems,
  onLinkClick,
  className = "",
  maxWidth,
}) {
  const { isHandheld } = useResponsiveProfile({ maxWidth });
  const navigate = useNavigate();
  const [clickedItem, setClickedItem] = React.useState(null);

  if (!isHandheld) {
    return null;
  }

  // Preload das páginas principais ao montar o componente
  React.useEffect(() => {
    const preloadPages = async () => {
      try {
        const pagesToPreload = [
          () => import("../../pages/Dashboard"),
          () => import("../../pages/Shop"),
        ];
        
        setTimeout(() => {
          pagesToPreload.forEach(preload => {
            preload().catch(() => {});
          });
        }, 1000);
      } catch (error) {
        console.debug("Preload pages skipped");
      }
    };
    
    preloadPages();
  }, []);

  const handleLinkClick = React.useCallback((item, callback) => (e) => {
    e.preventDefault();
    
    setClickedItem(item.href);
    
    if (typeof onLinkClick === "function") {
      onLinkClick();
    }
    if (typeof callback === "function") {
      callback();
    }
    
    // Navegação imediata
    requestAnimationFrame(() => {
      navigate(item.href);
      setTimeout(() => setClickedItem(null), 300);
    });
  }, [navigate, onLinkClick]);

  // Prefetch on touch para navegação instantânea no mobile
  const handleTouchStart = React.useCallback((href) => {
    const pageMap = {
      '/': () => import("../../pages/Dashboard"),
      '/stock-catalogue': () => import("../../pages/Shop"),
      '/admin/products': () => import("../../pages/AdminProducts"),
      '/admin/users': () => import("../../pages/AdminUsers"),
    };
    
    const preloadFn = pageMap[href];
    if (preloadFn) {
      preloadFn().catch(() => {});
    }
  }, []);

  const baseClasses =
    "fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around gap-2 bg-black/90 backdrop-blur-md border-t border-white/10 py-3 px-4";

  return (
    <nav className={`${baseClasses}${className ? ` ${className}` : ""}`}>
      {items.map((item) => {
        const isClicked = clickedItem === item.href;
        
        return (
          <NavLink
            key={item.name}
            to={item.href}
            aria-label={item.name}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-xs transition-all active:scale-95 ${
                isActive || isClicked ? "text-white" : "text-gray-400 hover:text-gray-200"
              }`
            }
            onClick={handleLinkClick(item, item.onClick)}
            onTouchStart={() => handleTouchStart(item.href)}
          >
            {({ isActive }) => (
              <>
                <Icon
                  icon={item.icon}
                  className={`text-xl transition-colors ${
                    isActive || isClicked ? "text-white" : "text-gray-400"
                  }`}
                />
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}


