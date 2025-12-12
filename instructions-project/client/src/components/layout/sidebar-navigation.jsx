import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useTheme } from "@heroui/use-theme";
import { navigationItems } from "../../constants/navigation";
import { useUserRole } from "../../hooks/useUserRole";

export function SidebarNavigation() {
  // Mantemos o hook (pode ser útil para outras reações ao tema)
  useTheme();
  const { isAdmin, isEditorStock, isComercial } = useUserRole();
  const navigate = useNavigate();
  const [clickedItem, setClickedItem] = React.useState(null);

  // Filtrar itens de navegação baseado no role
  const filteredItems = React.useMemo(() => {
    return navigationItems.filter((item) => {
      // Dashboard e Shop são acessíveis para todos
      if (item.href === '/' || item.href === '/stock-catalogue') {
        return true;
      }

      // Admin Products apenas para admin e editor_stock
      if (item.href === '/admin/products') {
        return isAdmin || isEditorStock;
      }

      // Users apenas para admin
      if (item.href === '/admin/users' || item.href === '/admin/debug-ui') {
        return isAdmin;
      }

      // Outros itens (por padrão, mostrar para todos autenticados)
      return true;
    });
  }, [isAdmin, isEditorStock, isComercial]);

  // Preload das páginas principais ao montar o componente
  React.useEffect(() => {
    const preloadPages = async () => {
      try {
        // Preload das páginas mais acessadas
        const pagesToPreload = [
          () => import("../../pages/Dashboard"),
          () => import("../../pages/Shop"),
          () => import("../../pages/AdminProducts"),
        ];
        
        // Preload com delay para não bloquear a renderização inicial
        setTimeout(() => {
          pagesToPreload.forEach(preload => {
            preload().catch(() => {}); // Silently fail se houver erro
          });
        }, 1000);
      } catch (error) {
        console.debug("Preload pages skipped");
      }
    };
    
    preloadPages();
  }, []);

  // Handler otimizado para navegação imediata
  const handleNavigation = React.useCallback((href, isExternal) => (e) => {
    if (isExternal) return; // Deixar o comportamento padrão para links externos
    
    e.preventDefault();
    setClickedItem(href);
    
    // Navegação imediata
    requestAnimationFrame(() => {
      navigate(href);
      // Reset do estado após navegação
      setTimeout(() => setClickedItem(null), 300);
    });
  }, [navigate]);

  // Prefetch on hover para navegação instantânea
  const handleMouseEnter = React.useCallback((href) => {
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

  return (
    <div className={`flex flex-col items-center h-full bg-transparent py-6`}>
      {/* Logo reativo ao tema (sem JS) */}
      <div>
        <img
          src="/light.svg" /* logotipo para tema claro */
          alt="Logo"
          className="block dark:hidden w-16 h-16"
        />
        <img
          src="/dark.svg" /* logotipo para tema escuro */
          alt="Logo"
          className="hidden dark:block w-16 h-16"
        />
      </div>

      {/* Ícones centrados verticalmente */}
      <div className="flex-1 flex items-center">
        <div className="flex flex-col items-center gap-4">
          {filteredItems.map((item) => {
            const isPlaceholder = !item.href || item.href === "#";
            const isClicked = clickedItem === item.href;
            
            return isPlaceholder ? (
              <button
                key={item.name}
                type="button"
                aria-label={item.name}
                className="w-10 h-10 rounded-xl bg-content2/60 dark:bg-content2 hover:bg-content3 shadow-sm flex items-center justify-center transition-all cursor-default"
                disabled
              >
                <Icon icon={item.icon} className="text-default-600 text-xl" />
              </button>
            ) : item.external ? (
              <a
                key={item.name}
                href={item.href}
                aria-label={item.name}
                className="w-10 h-10 rounded-xl bg-content2/70 dark:bg-content2 hover:bg-content3 shadow-sm flex items-center justify-center transition-all active:scale-95"
              >
                <Icon icon={item.icon} className="text-default-600 text-xl" />
              </a>
            ) : (
              <NavLink
                key={item.name}
                to={item.href}
                aria-label={item.name}
                onClick={handleNavigation(item.href, false)}
                onMouseEnter={() => handleMouseEnter(item.href)}
                onTouchStart={() => handleMouseEnter(item.href)}
                className={({ isActive }) =>
                  `w-10 h-10 rounded-xl shadow-sm flex items-center justify-center transition-all active:scale-95 ` +
                  (isActive || isClicked
                    ? `bg-primary-500 hover:bg-primary-600`
                    : `bg-content2/70 dark:bg-content2 hover:bg-content3`)
                }
              >
                {({ isActive }) => (
                  <Icon
                    icon={item.icon}
                    className={`${isActive || isClicked ? "text-white" : "text-default-600"} text-xl transition-colors`}
                  />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
