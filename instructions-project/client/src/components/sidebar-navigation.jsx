import React from "react";
import { Link, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "@heroui/use-theme";

const navigationItems = [
  { name: "Dashboard", icon: "lucide:layout-dashboard", href: "/" },
  { name: "Analytics", icon: "lucide:bar-chart", href: "#" },
  { name: "Customers", icon: "lucide:users", href: "#" },
  { name: "Orders", icon: "lucide:shopping-cart", href: "#" },
];

export function SidebarNavigation() {
  // Mantemos o hook (pode ser útil para outras reações ao tema)
  useTheme();

  return (
    <div className={`flex flex-col items-center h-full bg-transparent dark:bg-content1 py-6`}>
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
          {navigationItems.map((item) => (
            <Tooltip
              key={item.name}
              content={item.name}
              placement="right"
              showArrow
              color="default"
              delay={300}
            >
              <Link
                href={item.href}
                aria-label={item.name}
                className={`w-10 h-10 rounded-xl bg-content2/60 dark:bg-content2 hover:bg-content3 shadow-sm flex items-center justify-center transition-all`}
              >
                <Icon icon={item.icon} className={`text-default-600 text-xl`} />
              </Link>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
