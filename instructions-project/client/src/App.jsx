import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarNavigation } from "./components/sidebar-navigation";
import { Header } from "./components/header";
import Dashboard from "./pages/Dashboard";
import Statistics from "./pages/Statistics";
import Shop from "./pages/Shop";
import ShopCategory from "./pages/ShopCategory";
import Projects from "./pages/Projects";
import Favorites from "./pages/Favorites";
import Landing from "./pages/Landing";
import { SignedIn, SignedOut, SignIn, SignUp } from "@clerk/clerk-react";

export default function App() {
  return (
    <>
      <SignedOut>
        <div className="bg-background text-foreground flex h-screen">
          <main className="flex flex-1 flex-col overflow-hidden">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/sign-in/*" element={<SignIn routing="path" signUpUrl="/sign-up" />} />
              <Route path="/sign-up/*" element={<SignUp routing="path" signInUrl="/sign-in" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="bg-background text-foreground flex h-screen">
          <aside className="w-20">
            <SidebarNavigation />
          </aside>
          <main className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:category" element={<ShopCategory />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/orders" element={<Projects />} />
            </Routes>
          </main>
        </div>
      </SignedIn>
    </>
  );
}


