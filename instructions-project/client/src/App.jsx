import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarNavigation } from "./components/layout/sidebar-navigation";
import { Header } from "./components/layout/header";
import Dashboard from "./pages/Dashboard";
// import Statistics from "./pages/Statistics";
import Shop from "./pages/Shop";
import Projects from "./pages/Projects";
import Favorites from "./pages/Favorites";
import Landing from "./pages/Landing";
import AdminProducts from "./pages/AdminProducts";
import AdminUsers from "./pages/AdminUsers";
import ProjectNotes from "./pages/ProjectNotes";
import EditProject from "./pages/EditProject";
import SignIn from "./pages/SignIn";
import { SignedIn, SignedOut } from "./components/auth/AuthGuard";
import { MobileBottomNav } from "./components/layout/mobile-bottom-nav";
import { useResponsiveProfile } from "./hooks/useResponsiveProfile";
import PWAInstallPrompt from "./components/features/PWAInstallPrompt";
import UpdateNotification from "./components/features/UpdateNotification";
import OfflineReadyNotification from "./components/features/OfflineReadyNotification";
import ProtectedRoute from "./components/ProtectedRoute";

function AppLayout() {
  const { isHandheld } = useResponsiveProfile();
  const showSidebar = !isHandheld;

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
          <Route 
            path="/admin/products" 
            element={
              <ProtectedRoute requireRole={['admin', 'editor_stock']}>
                <AdminProducts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requireRole={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } 
          />
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
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<Navigate to="/sign-in" replace />} />
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


