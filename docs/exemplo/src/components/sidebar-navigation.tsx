import React from "react";
import { Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import {useTheme} from "@heroui/use-theme";

const navigationItems = [
  { name: "Dashboard", icon: "lucide:layout-dashboard", href: "#" },
  { name: "Analytics", icon: "lucide:bar-chart", href: "#" },
  { name: "Customers", icon: "lucide:users", href: "#" },
  { name: "Orders", icon: "lucide:shopping-cart", href: "#" },
  { name: "Settings", icon: "lucide:settings", href: "#" },
];

export function SidebarNavigation() {
  const {theme} = useTheme();
  const isDark = theme === "dark";
  
  return (
    <div className={`flex flex-col items-center gap-6 py-8 h-full ${isDark ? 'bg-content1' : 'bg-slate-50'}`}>
      {/* Logo */}
      <div className="mb-6">
        <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-primary' : 'bg-black'} flex items-center justify-center`}>
          <Icon icon="lucide:activity" className="text-white text-xl" />
        </div>
      </div>
      
      {/* Navigation Icons */}
      <div className="flex flex-col gap-4">
        {navigationItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            aria-label={item.name}
            className={`w-10 h-10 rounded-xl ${
              isDark ? 'bg-content2 hover:bg-content3' : 'bg-white hover:bg-slate-100'
            } shadow-sm flex items-center justify-center transition-all`}
          >
            <Icon icon={item.icon} className={`${isDark ? 'text-default-500' : 'text-slate-700'} text-xl`} />
          </Link>
        ))}
      </div>
    </div>
  );
}