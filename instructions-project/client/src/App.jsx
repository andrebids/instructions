import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarNavigation } from "./components/layout/sidebar-navigation";
import { Header } from "./components/layout/header";
import { Spinner } from "@heroui/react";

// Lazy load pages
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
// const Statistics = React.lazy(() => import("./pages/Statistics"));
const Shop = React.lazy(() => import("./pages/Shop"));
const Projects = React.lazy(() => import("./pages/Projects"));
const Favorites = React.lazy(() => import("./pages/Favorites"));
const Landing = React.lazy(() => import("./pages/Landing"));
const AdminProducts = React.lazy(() => import("./pages/AdminProducts"));
const AdminUsers = React.lazy(() => import("./pages/AdminUsers"));
const DebugUI = React.lazy(() => import("./pages/DebugUI"));
const ProjectNotes = React.lazy(() => import("./pages/ProjectNotes"));
const EditProject = React.lazy(() => import("./pages/EditProject"));
const SignIn = React.lazy(() => import("./pages/SignIn"));
const ProjectDetails = React.lazy(() => import("./pages/ProjectDetails"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-full bg-transparent">
    <Spinner size="lg" color="primary" />
  </div>
);
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
import { LayoutProvider, useLayout } from "./context/LayoutContext";
import { HeroUIDebug } from "./components/debug/HeroUIDebug";

function AppLayout() {
  const { isHandheld } = useResponsiveProfile();
  const showSidebar = !isHandheld;
  const { showCreateProjectForm } = useLayout();
  const { theme } = useTheme();
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Preload crítico das páginas principais na montagem inicial
  React.useEffect(() => {
    const preloadCriticalPages = async () => {
      try {
        // Preload imediato das páginas mais críticas
        const criticalPages = [
          Dashboard,
          Shop,
        ];
        
        // As páginas lazy já são módulos, não precisamos fazer nada
        // O preload real acontece nos componentes de navegação
      } catch (error) {
        console.debug("Critical pages preload skipped");
      }
    };
    
    preloadCriticalPages();
  }, []);

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
    <div className="bg-transparent text-foreground flex h-screen relative">
      <HeroUIDebug />
      {isDark && !showCreateProjectForm && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Aurora
            colorStops={["#141771", "#0d0f4f"]}
            blend={1}
            amplitude={1.0}
            speed={1}
          />
        </div>
      )}
      <div className="relative z-10 flex w-full h-full">
        {showSidebar && (
          <aside className="hidden md:block w-20">
            <SidebarNavigation />
          </aside>
        )}
        <main className={`flex flex-1 flex-col overflow-hidden bg-transparent ${isHandheld ? "pb-24" : "pb-0"}`}>
          <Header />
          <Suspense fallback={<LoadingFallback />}>
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
              <Route
                path="/admin/debug-ui"
                element={
                  <ProtectedRoute requireRole={['admin']}>
                    <DebugUI />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
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
      <LayoutProvider>
        <PWAInstallPrompt />
        <UpdateNotification />
        <OfflineReadyNotification />
        <NotificationContainer />
        <SignedOut>
          <div className="bg-transparent text-foreground flex h-screen relative">
            {isDark && (
              <div className="fixed inset-0 z-0 pointer-events-none">
                <Aurora
                  colorStops={["#141771", "#0d0f4f"]}
                  blend={1}
                  amplitude={1.0}
                  speed={1}
                />
              </div>
            )}
            <main className="relative z-10 flex flex-1 flex-col overflow-hidden bg-transparent">
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/sign-in" element={<SignIn />} />
                  <Route path="/sign-up" element={<Navigate to="/sign-in" replace />} />
              <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </SignedOut>

        <SignedIn>
          <AppLayout />
        </SignedIn>
      </LayoutProvider>
    </NotificationProvider>
  );
}


