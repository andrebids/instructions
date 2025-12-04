import React, { Suspense } from "react";
import { Header } from "../components/layout/header";
import { Button, Spinner, Card, CardBody, Skeleton } from "@heroui/react";
import { Icon } from "@iconify/react";
import { projectsAPI } from "../services/api";
import { PageTitle } from "../components/layout/page-title";
import { DashboardVoiceAssistant } from "../components/features/DashboardVoiceAssistant";
import { useUser } from "../context/UserContext";
import { useResponsiveProfile } from "../hooks/useResponsiveProfile";
import { Scroller } from "../components/ui/scroller";
import { useTranslation } from "react-i18next";
import { useVoiceAssistant } from "../context/VoiceAssistantContext";
import { useLayout } from "../context/LayoutContext";
// import Galaxy from "../components/ui/Galaxy"; // Lazy loaded below

import { TodoListWidget } from "../components/features/TodoListWidget";
import { SmartProjectTable } from "../components/features/SmartProjectTable";
import { CreateProjectMultiStep } from "../components/create-project-multi-step";
import { PipelineWidget } from "../components/features/sales/PipelineWidget";
import { DraftsWidget } from "../components/features/sales/DraftsWidget";
import { ConversionWidget } from "../components/features/sales/ConversionWidget";
import { OrderManagementWidget } from "../components/features/OrderManagementWidget";
import { RecommendedProductsWidget } from "../components/features/RecommendedProductsWidget";
import ShinyText from "../components/ShinyText";

const Galaxy = React.lazy(() => import("../components/ui/Galaxy"));

export default function Dashboard() {
  const { t } = useTranslation();
  const { userName } = useUser();
  const { updateDashboardContext } = useVoiceAssistant();
  const { setShowCreateProjectForm } = useLayout();
  const [showCreateProject, setShowCreateProject] = React.useState(false);
  const [projects, setProjects] = React.useState([]);
  const [stats, setStats] = React.useState({
    total: 0,
    draft: 0,
    created: 0,
    inProgress: 0,
    finished: 0,
    approved: 0,
    cancelled: 0,
    inQueue: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const { isHandheld } = useResponsiveProfile();

  const loadData = React.useCallback(async (signal = null) => {
    try {
      setLoading(true);
      setError(null);
      const options = signal ? { signal } : {};

      try {
        // Load stats first for faster KPI rendering
        projectsAPI.getStats(options).then(statsData => {
           setStats({
            total: statsData.total,
            draft: statsData.draft || 0,
            created: statsData.created || 0,
            inProgress: statsData.inProgress,
            finished: statsData.finished,
            approved: statsData.approved,
            cancelled: statsData.cancelled,
            inQueue: statsData.inQueue,
          });
        }).catch(statsErr => {
            if (statsErr.response?.status === 403) {
               setStats({ total: 0, draft: 0, created: 0, inProgress: 0, finished: 0, approved: 0, cancelled: 0, inQueue: 0 });
            } else {
               console.warn("Stats load failed", statsErr);
            }
        });

        // Load projects in parallel
        const projectsData = await projectsAPI.getAll(options);
        setProjects(projectsData);
        
      } catch (err) {
        if (err.response?.status === 403 && err.config?.url?.includes('/projects/stats')) {
           const projectsData = await projectsAPI.getAll(options);
           setProjects(projectsData);
           setStats({ total: 0, draft: 0, created: 0, inProgress: 0, finished: 0, approved: 0, cancelled: 0, inQueue: 0 });
           return;
        }
        throw err;
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ECONNABORTED') return;
      console.error('❌ Erro ao carregar dados:', err);
      setError(t('errors.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    if (!loading && projects.length >= 0) {
      updateDashboardContext(projects, { name: userName });
    }
  }, [projects, loading, userName, updateDashboardContext]);

  // Função para remover projeto do estado local
  const removeProjectFromState = React.useCallback((projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  }, []);

  // Função para atualizar stats após deletar projeto
  const updateStatsAfterDelete = React.useCallback((project) => {
    setStats(prev => {
      const newStats = { ...prev };

      // Decrementar total
      newStats.total = Math.max(0, prev.total - 1);

      // Decrementar contador baseado no status do projeto
      const status = project.status;
      if (status === 'draft' && prev.draft > 0) {
        newStats.draft = prev.draft - 1;
      } else if (status === 'created' && prev.created > 0) {
        newStats.created = prev.created - 1;
      } else if (status === 'in_progress' && prev.inProgress > 0) {
        newStats.inProgress = prev.inProgress - 1;
      } else if (status === 'finished' && prev.finished > 0) {
        newStats.finished = prev.finished - 1;
      } else if (status === 'approved' && prev.approved > 0) {
        newStats.approved = prev.approved - 1;
      } else if (status === 'cancelled' && prev.cancelled > 0) {
        newStats.cancelled = prev.cancelled - 1;
      } else if (status === 'in_queue' && prev.inQueue > 0) {
        newStats.inQueue = prev.inQueue - 1;
      }

      return newStats;
    });
  }, []);

  // Função otimizada para atualizar após delete
  const handleProjectDeleted = React.useCallback((project) => {
    // Atualização otimista: remover localmente e atualizar stats
    removeProjectFromState(project.id);
    updateStatsAfterDelete(project);

    // Opcional: sincronizar stats com servidor em background (sem bloquear UI)
    // Isso garante que as stats estejam sempre corretas mesmo se houver discrepâncias
    projectsAPI.getStats().then(statsData => {
      setStats({
        total: statsData.total,
        draft: statsData.draft || 0,
        created: statsData.created || 0,
        inProgress: statsData.inProgress,
        finished: statsData.finished,
        approved: statsData.approved,
        cancelled: statsData.cancelled,
        inQueue: statsData.inQueue,
      });
    }).catch(err => {
      // Silenciosamente ignorar erro - stats locais já foram atualizadas
      console.warn('Failed to sync stats after delete:', err);
    });
  }, [removeProjectFromState, updateStatsAfterDelete]);

  React.useEffect(() => {
    const abortController = new AbortController();
    loadData(abortController.signal);
    return () => abortController.abort();
  }, []);

  const handleCreateProject = () => {
    setShowCreateProject(true);
    setShowCreateProjectForm(true);
  };
  const handleCloseCreateProject = () => {
    setShowCreateProject(false);
    setShowCreateProjectForm(false);
    loadData();
  };



  return (
    <>
      {showCreateProject ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <CreateProjectMultiStep onClose={handleCloseCreateProject} />
        </div>
      ) : (
        <Scroller className="flex-1 min-h-0" hideScrollbar>
          <div className="p-6 max-w-[1920px] mx-auto space-y-6 bg-transparent">
            
            {/* Header Section */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {t('pages.dashboard.main.welcomeBack')} <span className="text-primary">{userName}</span>
                </h1>
                <p className="text-default-500 text-sm">{t('pages.dashboard.main.subtitle')}</p>
              </div>
              <Button
                className="font-medium shadow-lg shadow-blue-500/20 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-500 dark:hover:bg-blue-400 hover:scale-[1.02] transition-all duration-300"
                startContent={<Icon icon="lucide:plus" />}
                onPress={handleCreateProject}
              >
                {t('pages.dashboard.main.newProject')}
              </Button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                
                {/* Left Column - Hero & KPIs (8 cols) */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                  {/* Hero Widget */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-64">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/30 via-slate-800/20 to-zinc-900/30 border border-white/10 p-8 flex flex-col justify-start group shadow-lg">
                      {/* Dark Background Base */}
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950 rounded-3xl" />
                      
                      {/* Galaxy Background */}
                      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-3xl">
                        <Suspense fallback={<div className="w-full h-full bg-slate-900" />}>
                          <Galaxy 
                            transparent={true}
                            mouseInteraction={true}
                            mouseRepulsion={false}
                            density={0.5}
                            glowIntensity={0.3}
                            saturation={0.2}
                            hueShift={0}
                            rotationSpeed={0.05}
                            speed={0.3}
                            twinkleIntensity={1}
                            starSpeed={0.2}
                          />
                        </Suspense>
                      </div>

                      {/* Glow */}
                      <div className="absolute top-0 right-0 p-32 bg-blue-500/20 blur-[100px] rounded-full -mr-16 -mt-16 pointer-events-none z-5" />
                      
                      <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-white mb-2">
                          {t('pages.dashboard.main.hero.title')} <br/>
                          <ShinyText 
                            text={t('pages.dashboard.main.hero.titleHighlight')} 
                            className="[--shiny-bg-gradient:linear-gradient(to_right,#fde68a,#facc15)]"
                            speed={3}
                          />
                        </h2>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 border border-white/10 flex items-center justify-center shadow-lg p-0">
                      <RecommendedProductsWidget />
                    </div>
                  </div>

                  {/* Financial KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-48 items-stretch">
                    <PipelineWidget 
                      value="€ 1.2M" 
                    />
                    <DraftsWidget 
                      value="€ 450k" 
                      count={stats.draft}
                    />
                    <ConversionWidget 
                      value="68%" 
                      trend="+5%"
                      won={34}
                      lost={16}
                    />
                  </div>

                  {/* Smart Project Table */}
                  <div className="min-h-[300px] max-h-[600px]">
                    <SmartProjectTable 
                      projects={projects} 
                      onProjectsUpdate={loadData}
                      onProjectDeleted={handleProjectDeleted}
                      isLoading={loading}
                    />
                  </div>
                </div>

                {/* Right Column - Todo & Extras (4 cols) */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  <div className="h-[400px]">
                    <TodoListWidget />
                  </div>
                  
                  

                  
                  {/* Order Management Widget */}
                  <OrderManagementWidget />
                </div>

          </div>
          </div>
        </Scroller>
      )}
      <DashboardVoiceAssistant />
    </>
  );
}
