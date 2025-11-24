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

  // KPI Card Component
  const KPICard = ({ title, value, subtext, trend, icon, color }) => (
    <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-md">
      <CardBody className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-500`}>
            <Icon icon={icon} className="text-xl" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full text-xs font-medium">
              <Icon icon="lucide:trending-up" />
              {trend}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-zinc-400 text-sm font-medium">{title}</p>
          <h4 className="text-3xl font-bold text-white">{value}</h4>
          <p className="text-zinc-500 text-xs">{subtext}</p>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <>
      {showCreateProject ? (
        <div className="flex-1 min-h-0 overflow-hidden bg-zinc-950">
          <CreateProjectMultiStep onClose={handleCloseCreateProject} />
        </div>
      ) : (
        <Scroller className="flex-1 min-h-0 bg-zinc-950" hideScrollbar>
          <div className="p-6 max-w-[1920px] mx-auto space-y-6">
            
            {/* Header Section */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {t('pages.dashboard.main.welcomeBack')} <span className="text-primary">{userName}</span>
                </h1>
                <p className="text-zinc-400 text-sm">{t('pages.dashboard.main.subtitle')}</p>
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
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900/50 to-zinc-900 border border-white/5 p-8 flex flex-col justify-center group">
                      <div className="absolute top-0 right-0 p-32 bg-primary-500/20 blur-[100px] rounded-full -mr-16 -mt-16 pointer-events-none" />
                      <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-white mb-2">
                          {t('pages.dashboard.main.hero.title')} <br/>
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">{t('pages.dashboard.main.hero.titleHighlight')}</span>
                        </h2>
                        <p className="text-zinc-300 mb-6 max-w-xs">
                          {t('pages.dashboard.main.hero.draftsMessage', { count: stats.draft })}
                        </p>
                        <Button 
                          className="bg-white/10 backdrop-blur-md text-white border border-white/20 group-hover:bg-white/20 transition-all"
                          endContent={<Icon icon="lucide:arrow-right" />}
                        >
                          {t('pages.dashboard.main.hero.continueWorking')}
                        </Button>
                      </div>
                    </div>
                    <UrgencyWidget />
                  </div>

                  {/* Financial KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KPICard 
                      title={t('pages.dashboard.main.kpis.totalPipeline.title')} 
                      value="€ 1.2M" 
                      subtext={t('pages.dashboard.main.kpis.totalPipeline.subtext')} 
                      trend="+12%" 
                      icon="lucide:bar-chart-3" 
                      color="primary"
                    />
                    <KPICard 
                      title={t('pages.dashboard.main.kpis.draftsValue.title')} 
                      value="€ 450k" 
                      subtext={t('pages.dashboard.main.kpis.draftsValue.subtext', { count: stats.draft })} 
                      icon="lucide:file-edit" 
                      color="warning"
                    />
                    <KPICard 
                      title={t('pages.dashboard.main.kpis.conversionRate.title')} 
                      value="68%" 
                      subtext={t('pages.dashboard.main.kpis.conversionRate.subtext')} 
                      trend="+5%" 
                      icon="lucide:pie-chart" 
                      color="success"
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
                  
                  {/* Mini Calendar / Quick Stats / Notifications could go here */}
                  <Card className="h-[420px] bg-zinc-900/50 border-zinc-800/50 backdrop-blur-md">
                    <CardBody className="p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">{t('pages.dashboard.main.quickStats.title')}</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-800/50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                              <Icon icon="lucide:users" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{t('pages.dashboard.main.quickStats.activeClients.title')}</p>
                              <p className="text-xs text-zinc-500">{t('pages.dashboard.main.quickStats.activeClients.subtext')}</p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-white">24</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-800/50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                              <Icon icon="lucide:box" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{t('pages.dashboard.main.quickStats.stockItems.title')}</p>
                              <p className="text-xs text-zinc-500">{t('pages.dashboard.main.quickStats.stockItems.subtext')}</p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-white">1,450</span>
                        </div>

                        <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-800/50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400">
                              <Icon icon="lucide:truck" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{t('pages.dashboard.main.quickStats.deliveries.title')}</p>
                              <p className="text-xs text-zinc-500">{t('pages.dashboard.main.quickStats.deliveries.subtext')}</p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-white">8</span>
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

