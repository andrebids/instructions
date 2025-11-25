import React from "react";
import { Header } from "../components/layout/header";
import { Button, Spinner, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { projectsAPI } from "../services/api";
import { PageTitle } from "../components/layout/page-title";
import { DashboardVoiceAssistant } from "../components/features/DashboardVoiceAssistant";
import { useUser } from "../context/UserContext";
import { useResponsiveProfile } from "../hooks/useResponsiveProfile";
import { Scroller } from "../components/ui/scroller";
import { useTranslation } from "react-i18next";
import { useVoiceAssistant } from "../context/VoiceAssistantContext";
import { UrgencyWidget } from "../components/features/UrgencyWidget";
import { TodoListWidget } from "../components/features/TodoListWidget";
import { SmartProjectTable } from "../components/features/SmartProjectTable";
import { CreateProjectMultiStep } from "../components/create-project-multi-step";
import { PipelineWidget } from "../components/features/sales/PipelineWidget";
import { DraftsWidget } from "../components/features/sales/DraftsWidget";
import { ConversionWidget } from "../components/features/sales/ConversionWidget";

export default function Dashboard() {
  const { t } = useTranslation();
  const { userName } = useUser();
  const { updateDashboardContext } = useVoiceAssistant();
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
        const [projectsData, statsData] = await Promise.all([
          projectsAPI.getAll(options),
          projectsAPI.getStats(options).catch((statsErr) => {
            if (statsErr.response?.status === 403) {
              return { total: 0, draft: 0, created: 0, inProgress: 0, finished: 0, approved: 0, cancelled: 0, inQueue: 0 };
            }
            throw statsErr;
          }),
        ]);

        setProjects(projectsData);
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

  const handleCreateProject = () => setShowCreateProject(true);
  const handleCloseCreateProject = () => {
    setShowCreateProject(false);
    loadData();
  };



  return (
    <>
      {showCreateProject ? (
        <div className="flex-1 min-h-0 overflow-hidden bg-background">
          <CreateProjectMultiStep onClose={handleCloseCreateProject} />
        </div>
      ) : (
        <Scroller className="flex-1 min-h-0 bg-background" hideScrollbar>
          <div className="p-6 max-w-[1920px] mx-auto space-y-6">
            
            {/* Header Section */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {t('pages.dashboard.main.welcomeBack')} <span className="text-primary">{userName}</span>
                </h1>
                <p className="text-default-500 text-sm">{t('pages.dashboard.main.subtitle')}</p>
              </div>
              <Button
                color="primary"
                startContent={<Icon icon="lucide:plus" />}
                className="font-medium shadow-lg shadow-primary/20"
                onPress={handleCreateProject}
              >
                {t('pages.dashboard.main.newProject')}
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-96">
                <Spinner size="lg" color="primary" />
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-6">
                
                {/* Left Column - Hero & KPIs (8 cols) */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                  {/* Hero Widget */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50/80 via-white to-orange-50/30 dark:from-primary-900/50 dark:via-primary-900/50 dark:to-zinc-900 border border-amber-100/50 dark:border-white/5 p-8 flex flex-col justify-center group shadow-sm">
                      {/* Dark Mode Glow */}
                      <div className="absolute top-0 right-0 p-32 bg-primary-500/20 blur-[100px] rounded-full -mr-16 -mt-16 pointer-events-none hidden dark:block" />
                      
                      {/* Light Mode Glow */}
                      <div className="absolute top-0 right-0 p-40 bg-amber-400/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none dark:hidden" />
                      
                      <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-foreground mb-2">
                          {t('pages.dashboard.main.hero.title')} <br/>
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500 dark:from-amber-200 dark:to-yellow-500">{t('pages.dashboard.main.hero.titleHighlight')}</span>
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-300 mb-6 max-w-xs font-medium">
                          {t('pages.dashboard.main.hero.draftsMessage', { count: stats.draft })}
                        </p>
                        <Button 
                          className="bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 dark:bg-white/10 dark:backdrop-blur-md dark:text-white dark:border dark:border-white/20 dark:shadow-none hover:bg-zinc-800 dark:hover:bg-white/20 transition-all"
                          endContent={<Icon icon="lucide:arrow-right" />}
                        >
                          {t('pages.dashboard.main.hero.continueWorking')}
                        </Button>
                      </div>
                    </div>
                    <Card className="h-full bg-content1/50 border-default-200/50 backdrop-blur-md shadow-sm">
                      <CardBody className="p-6 flex items-center justify-center">
                        <p className="text-default-500 text-sm text-center">
                          {t('pages.dashboard.main.reservedSpace.placeholder')}
                        </p>
                      </CardBody>
                    </Card>
                  </div>

                  {/* Financial KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-48 items-stretch">
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
                  <div className="h-[500px]">
                    <SmartProjectTable 
                      projects={projects} 
                      onProjectsUpdate={loadData}
                      onProjectDeleted={handleProjectDeleted}
                    />
                  </div>
                </div>

                {/* Right Column - Todo & Extras (4 cols) */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  <div className="h-[400px]">
                    <TodoListWidget />
                  </div>
                  
                  <div className="h-[400px]">
                    <UrgencyWidget />
                  </div>
                  
                  {/* Mini Calendar / Quick Stats / Notifications could go here */}
                  <Card className="h-[420px] bg-content1/50 border-default-200/50 backdrop-blur-md shadow-sm">
                    <CardBody className="p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">{t('pages.dashboard.main.quickStats.title')}</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-default-100/50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500 dark:text-blue-400">
                              <Icon icon="lucide:users" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{t('pages.dashboard.main.quickStats.activeClients.title')}</p>
                              <p className="text-xs text-default-500">{t('pages.dashboard.main.quickStats.activeClients.subtext')}</p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-foreground">24</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 rounded-xl bg-default-100/50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500 dark:text-purple-400">
                              <Icon icon="lucide:box" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{t('pages.dashboard.main.quickStats.stockItems.title')}</p>
                              <p className="text-xs text-default-500">{t('pages.dashboard.main.quickStats.stockItems.subtext')}</p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-foreground">1,450</span>
                        </div>

                        <div className="flex justify-between items-center p-3 rounded-xl bg-default-100/50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-pink-500/20 text-pink-500 dark:text-pink-400">
                              <Icon icon="lucide:truck" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{t('pages.dashboard.main.quickStats.deliveries.title')}</p>
                              <p className="text-xs text-default-500">{t('pages.dashboard.main.quickStats.deliveries.subtext')}</p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-foreground">8</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

              </div>
            )}
          </div>
        </Scroller>
      )}
      <DashboardVoiceAssistant />
    </>
  );
}

