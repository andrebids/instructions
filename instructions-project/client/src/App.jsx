import React from "react";
import { Routes, Route } from "react-router-dom";
import { SidebarNavigation } from "./components/sidebar-navigation";
import { Header } from "./components/header";
import Dashboard from "./pages/Dashboard";
import Statistics from "./pages/Statistics";
import Shop from "./pages/Shop";
import ShopCategory from "./pages/ShopCategory";
import Orders from "./pages/Orders";

export default function App() {
  return (
    <div className="bg-background text-foreground flex h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-20">
        <SidebarNavigation />
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <Header />
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:category" element={<ShopCategory />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </main>
    </div>
  );
}


