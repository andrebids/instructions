import React from "react";
import { NavLink } from "react-router-dom";
import { Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "@heroui/use-theme";

const navigationItems = [
  { name: "Dashboard", icon: "lucide:layout-dashboard", href: "/" },
  { name: "Statistics", icon: "lucide:bar-chart", href: "/statistics" },
  { name: "Shop", icon: "lucide:shopping-bag", href: "/shop" },
  { name: "Feed", icon: "lucide:video", href: "/feed" },
  { name: "Projects", icon: "lucide:folder", href: "/projects" },
  { name: "Admin Products", icon: "lucide:package", href: "/admin/products" },
];

export function SidebarNavigation() {
  // Mantemos o hook (pode ser útil para outras reações ao tema)
  useTheme();

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
          {navigationItems.map((item) => {
            const isPlaceholder = !item.href || item.href === "#";
            return (
              <Tooltip
                key={item.name}
                content={item.name}
                placement="right"
                showArrow
                color="default"
                delay={300}
              >
                {isPlaceholder ? (
                  <button
                    type="button"
                    aria-label={item.name}
                    className="w-10 h-10 rounded-xl bg-content2/60 dark:bg-content2 hover:bg-content3 shadow-sm flex items-center justify-center transition-all cursor-default"
                    disabled
                  >
                    <Icon icon={item.icon} className="text-default-600 text-xl" />
                  </button>
                ) : (
                  <NavLink
                    to={item.href}
                    aria-label={item.name}
                    className={({ isActive }) =>
                      `w-10 h-10 rounded-xl shadow-sm flex items-center justify-center transition-all ` +
                      (isActive
                        ? `bg-primary/50 hover:bg-primary/60`
                        : `bg-content2/70 dark:bg-content2 hover:bg-content3`)
                    }
                  >
                    {({ isActive }) => (
                      <Icon
                        icon={item.icon}
                        className={`${isActive ? "text-white" : "text-default-600"} text-xl`}
                      />
                    )}
                  </NavLink>
                )}
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
}
