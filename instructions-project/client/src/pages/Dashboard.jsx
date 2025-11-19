import React from "react";
import { Header } from "../components/layout/header";
import { StatsCard } from "../components/features/stats-card";
import { Button, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ProjectTable } from "../components/features/project-table";
import { CreateProjectMultiStep } from "../components/create-project-multi-step";
import { projectsAPI } from "../services/api";
import { PageTitle } from "../components/layout/page-title";
import { DashboardVoiceAssistant } from "../components/features/DashboardVoiceAssistant";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { useResponsiveProfile } from "../hooks/useResponsiveProfile";
import { Scroller } from "../components/ui/scroller";
import { useTranslation } from "react-i18next";
import { useVoiceAssistant } from "../context/VoiceAssistantContext";


export default function Dashboard() {
  const { t } = useTranslation();
  const { userName } = useUser();
  const { updateDashboardContext } = useVoiceAssistant();
  const [isOpen, setIsOpen] = React.useState(false);
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
  const [selectedImage, setSelectedImage] = React.useState(null);
  const { isHandheld } = useResponsiveProfile();


  // Imagens carregadas (simuladas)
  const loadedImages = [
    {
      id: 1,
      name: 'source 1.jpeg',
      thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&crop=center'
    },
    {
      id: 2,
      name: 'source 2.jpeg',
      thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop&crop=center'
    },
    {
      id: 3,
      name: 'source 3.jpeg',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center'
    },
  ];

  const loadData = React.useCallback(async (signal = null) => {
    try {
      setLoading(true);
      setError(null);

      // Carregar projetos e stats em paralelo
      // Se stats falhar com 403, ainda tentar carregar projetos
      const options = signal ? { signal } : {};

      try {
        const [projectsData, statsData] = await Promise.all([
          projectsAPI.getAll(options),
          projectsAPI.getStats(options).catch((statsErr) => {
            // Se stats falhar com 403, não bloquear o carregamento de projetos
            if (statsErr.response?.status === 403) {
              console.warn('⚠️  [Dashboard] Acesso negado para /projects/stats (requer role admin)');
              // Retornar stats vazios se não tiver permissão
              return {
                total: 0,
                draft: 0,
                created: 0,
                inProgress: 0,
                finished: 0,
                approved: 0,
                cancelled: 0,
                inQueue: 0,
              };
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
        // Se for erro 403 em stats, ainda tentar carregar projetos
        if (err.response?.status === 403 && err.config?.url?.includes('/projects/stats')) {
          console.warn('⚠️  [Dashboard] Acesso negado para stats, carregando apenas projetos');
          try {
            const projectsData = await projectsAPI.getAll(options);
            setProjects(projectsData);
            // Usar stats vazios
            setStats({
              total: 0,
              draft: 0,
              created: 0,
              inProgress: 0,
              finished: 0,
              approved: 0,
              cancelled: 0,
              inQueue: 0,
            });
            return; // Sucesso parcial, não definir erro
          } catch (projectsErr) {
            // Se projetos também falhar, tratar como erro geral
            throw projectsErr;
          }
        }
        throw err;
      }
    } catch (err) {
      // Ignorar erros de requisições abortadas/canceladas
      if (
        err.name === 'AbortError' ||
        err.name === 'CanceledError' ||
        err.code === 'ECONNABORTED' ||
        err.code === 'ERR_CANCELED' ||
        err.message === 'Request aborted' ||
        err.message === 'canceled' ||
        err.message?.includes('aborted') ||
        err.message?.includes('canceled')
      ) {
        return;
      }

      console.error('❌ Erro ao carregar dados:', err);

      // Mensagem de erro mais detalhada
      let errorMessage = t('errors.failedToLoadData');
      if (err.response?.status === 403) {
        const errorData = err.response?.data;
        errorMessage = errorData?.message || 'Acesso negado. Você não tem permissão para acessar este recurso.';
      } else if (err.response?.status === 500) {
        const errorData = err.response?.data;
        if (errorData?.error) {
          if (errorData.hint) {
            errorMessage = t('errors.serverErrorWithHint', { error: errorData.error, hint: errorData.hint });
          } else {
            errorMessage = t('errors.serverError', { error: errorData.error });
          }
        } else {
          errorMessage = t('errors.serverError500');
        }
      } else if (err.response?.status) {
        errorMessage = t('errors.requestFailed', { status: err.response.status });
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [t, updateDashboardContext, userName]);

  // Update voice assistant context when projects change
  React.useEffect(() => {
    if (!loading && projects.length >= 0) {
      updateDashboardContext(projects, { name: userName });
    }
  }, [projects, loading, userName, updateDashboardContext]);
  // Carregar dados ao iniciar
  React.useEffect(() => {
    const abortController = new AbortController();

    // Chamar loadData diretamente
    loadData(abortController.signal);

    // Cleanup: cancelar requisições quando o componente desmontar
    return () => {
      abortController.abort();
    };
  }, []); // Executar apenas uma vez na montagem

  const handleCreateProject = () => {
    setShowCreateProject(true);
  };

  // Expose to global window for Voice Assistant Context
  React.useEffect(() => {
    window.handleCreateProjectGlobal = handleCreateProject;
    return () => {
      delete window.handleCreateProjectGlobal;
    };
  }, []);

  const handleCloseCreateProject = () => {
    setShowCreateProject(false);
    setSelectedImage(null);
    // Recarregar dados após criar projeto
    loadData();
  };

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

  return (
    <>
      {/* Dashboard Content */}
      {showCreateProject ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <CreateProjectMultiStep
            onClose={handleCloseCreateProject}
            selectedImage={selectedImage}
          />
        </div>
      ) : (
        <Scroller className={`flex-1 min-h-0 p-6 ${isHandheld ? "pb-24" : "pb-6"}`} hideScrollbar>
          {/* Title section + Create button */}
          <div className="flex justify-between items-center mb-6">
            <PageTitle title={t('pages.dashboard.title')} userName={userName} subtitle={t('pages.dashboard.subtitle')} showWelcome />
            <Button
              color="primary"
              startContent={<Icon icon="lucide:plus" />}
              className="font-medium"
              onPress={handleCreateProject}
              isDisabled={loading}
            >
              {t('pages.dashboard.createNewProject')}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-600">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:alert-circle" className="text-xl" />
                <span>{error}</span>
              </div>
              <Button
                size="sm"
                color="danger"
                variant="flat"
                className="mt-2"
                onPress={loadData}
              >
                {t('common.retry')}
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" label={t('pages.dashboard.loadingData')} />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
                <StatsCard
                  title={t('pages.dashboard.stats.totalProjects')}
                  value={stats.total.toString()}
                  change={`${stats.total} projects total`}
                  isPositive={true}
                  icon="lucide:folder"
                  timePeriod={t('pages.dashboard.timePeriods.allTime')}
                  colorKey="primary"
                />
                <StatsCard
                  title={t('pages.dashboard.stats.draft')}
                  value={stats.draft.toString()}
                  change={`${stats.draft} drafts`}
                  isPositive={false}
                  icon="lucide:file-edit"
                  timePeriod={t('pages.dashboard.timePeriods.pending')}
                  colorKey="default"
                />
                <StatsCard
                  title={t('pages.dashboard.stats.created')}
                  value={stats.created.toString()}
                  change={`${stats.created} created`}
                  isPositive={true}
                  icon="lucide:file-plus"
                  timePeriod={t('pages.dashboard.timePeriods.new')}
                  colorKey="primary"
                />
                <StatsCard
                  title={t('pages.dashboard.stats.inProgress')}
                  value={stats.inProgress.toString()}
                  change={`${stats.inProgress} active`}
                  isPositive={true}
                  icon="lucide:loader"
                  timePeriod={t('pages.dashboard.timePeriods.currently')}
                  colorKey="warning"
                />
                <StatsCard
                  title={t('pages.dashboard.stats.finished')}
                  value={stats.finished.toString()}
                  change={`${stats.finished} completed`}
                  isPositive={true}
                  icon="lucide:check-circle"
                  timePeriod={t('pages.dashboard.timePeriods.thisMonth')}
                  colorKey="success"
                />
                <StatsCard
                  title={t('pages.dashboard.stats.approved')}
                  value={stats.approved.toString()}
                  change={`${stats.approved} approved`}
                  isPositive={true}
                  icon="lucide:thumbs-up"
                  timePeriod={t('pages.dashboard.timePeriods.thisMonth')}
                  colorKey="success"
                />
                <StatsCard
                  title={t('pages.dashboard.stats.inQueue')}
                  value={stats.inQueue.toString()}
                  change={`${stats.inQueue} waiting`}
                  isPositive={false}
                  icon="lucide:clock"
                  timePeriod={t('pages.dashboard.timePeriods.pending')}
                  colorKey="secondary"
                />
                <StatsCard
                  title={t('pages.dashboard.stats.cancelled')}
                  value={stats.cancelled.toString()}
                  change={`${stats.cancelled} cancelled`}
                  isPositive={false}
                  icon="lucide:x-circle"
                  timePeriod={t('pages.dashboard.timePeriods.thisMonth')}
                  colorKey="danger"
                />
              </div>

              {/* Project Table */}
              <div className="mb-6">
                <ProjectTable
                  projects={projects}
                  onProjectsUpdate={loadData}
                  onProjectDeleted={handleProjectDeleted}
                />
              </div>
            </>
          )}
        </Scroller>
      )}

      {/* Voice AI Assistant */}
      <DashboardVoiceAssistant />
    </>
  );
}

