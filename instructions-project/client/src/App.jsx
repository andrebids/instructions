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
import ProjectDetails from "./pages/ProjectDetails";
import { SignedIn, SignedOut } from "./components/auth/AuthGuard";
import { MobileBottomNav } from "./components/layout/mobile-bottom-nav";
import { useResponsiveProfile } from "./hooks/useResponsiveProfile";
import PWAInstallPrompt from "./components/features/PWAInstallPrompt";
import UpdateNotification from "./components/features/UpdateNotification";
import OfflineReadyNotification from "./components/features/OfflineReadyNotification";
import ProtectedRoute from "./components/ProtectedRoute";
import { NotificationProvider } from "./context/NotificationContext";
import { NotificationContainer } from "./components/notifications/NotificationContainer";
import { useTheme } from "@heroui/use-theme";
import Aurora from "./components/ui/Aurora";

function AppLayout() {
  const { isHandheld } = useResponsiveProfile();
  const showSidebar = !isHandheld;
  const { theme } = useTheme();
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  React.useEffect(() => {
    const checkDark = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      setIsDark(hasDarkClass);
    };

    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    window.addEventListener('themechange', checkDark);

    return () => {
      observer.disconnect();
      window.removeEventListener('themechange', checkDark);
    };
  }, []);

  return (
    <div className="bg-gradient-to-b from-[#e4e4ec] to-[#d6d4ee] dark:bg-none dark:bg-background text-foreground flex h-screen relative">
      {isDark && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Aurora
            colorStops={["#03135F", "#1A2B79", "#03135F"]}
            blend={1}
            amplitude={1.0}
            speed={0.8}
          />
        </div>
      )}
      <div className="relative z-10 flex w-full h-full">
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
            <Route path="/stock-catalogue" element={<Shop />} />
            <Route path="/favorites" element={<Favorites />} />
            {/* <Route path="/projects" element={<Projects />} /> */}
            <Route path="/projects/:id" element={<ProjectDetails />} />
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
    </div>
  );
}

export default function App() {
  const { theme } = useTheme();
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  React.useEffect(() => {
    const checkDark = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      setIsDark(hasDarkClass);
    };

    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    window.addEventListener('themechange', checkDark);

    return () => {
      observer.disconnect();
      window.removeEventListener('themechange', checkDark);
    };
  }, []);

  return (
    <NotificationProvider>
      <>
        <PWAInstallPrompt />
        <UpdateNotification />
        <OfflineReadyNotification />
        <NotificationContainer />
        <SignedOut>
          <div className="bg-gradient-to-b from-[#e4e4ec] to-[#d6d4ee] dark:bg-none dark:bg-background text-foreground flex h-screen relative">
            {isDark && (
              <div className="fixed inset-0 z-0 pointer-events-none">
                <Aurora
                  colorStops={["#03135F", "#1A2B79", "#03135F"]}
                  blend={1}
                  amplitude={1.0}
                  speed={0.8}
                />
              </div>
            )}
            <main className="relative z-10 flex flex-1 flex-col overflow-hidden">
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
    </NotificationProvider>
  );
}


