import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SidebarNavigation } from "./components/layout/sidebar-navigation";
import { Header } from "./components/layout/header";
import Dashboard from "./pages/Dashboard";
// import Statistics from "./pages/Statistics";
import Shop from "./pages/Shop";
import Projects from "./pages/Projects";
import Favorites from "./pages/Favorites";
import Landing from "./pages/Landing";
import AdminProducts from "./pages/AdminProducts";
import ProductFeed from "./pages/ProductFeed";
import ProjectNotes from "./pages/ProjectNotes";
import EditProject from "./pages/EditProject";
import { SignedIn, SignedOut, SignIn, SignUp } from "@clerk/clerk-react";
import { MobileBottomNav } from "./components/layout/mobile-bottom-nav";
import { useResponsiveProfile } from "./hooks/useResponsiveProfile";
import PWAInstallPrompt from "./components/features/PWAInstallPrompt";
import UpdateNotification from "./components/features/UpdateNotification";
import OfflineReadyNotification from "./components/features/OfflineReadyNotification";

function AppLayout() {
  const location = useLocation();
  const isFeedPage = location.pathname === '/feed';
  const { isHandheld } = useResponsiveProfile();
  const showSidebar = !isHandheld;

  if (isFeedPage) {
    return <ProductFeed />;
  }

  return (
    <div className="bg-background text-foreground flex h-screen">
      {showSidebar && (
        <aside className="hidden md:block w-20">
          <SidebarNavigation />
        </aside>
      )}
      <main className={`flex flex-1 flex-col overflow-hidden ${isHandheld ? "pb-24" : "pb-0"}`}>
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {/* <Route path="/statistics" element={<Statistics />} /> */}
          <Route path="/shop" element={<Shop />} />
          <Route path="/favorites" element={<Favorites />} />
          {/* <Route path="/projects" element={<Projects />} /> */}
          <Route path="/projects/:id/notes" element={<ProjectNotes />} />
          <Route path="/projects/:id/edit" element={<EditProject />} />
          <Route path="/orders" element={<Projects />} />
          <Route path="/admin/products" element={<AdminProducts />} />
        </Routes>
      </main>
      <MobileBottomNav />
    </div>
  );
}

export default function App() {
  return (
    <>
      <PWAInstallPrompt />
      <UpdateNotification />
      <OfflineReadyNotification />
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
        <AppLayout />
      </SignedIn>
    </>
  );
}


