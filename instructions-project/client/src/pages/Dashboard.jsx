import React from "react";
import {Header} from "../components/layout/header";
import {StatsCard} from "../components/features/stats-card";
import {Button, Spinner} from "@heroui/react";
import {Icon} from "@iconify/react";
import {ProjectTable} from "../components/features/project-table";
import {CreateProjectMultiStep} from "../components/create-project-multi-step";
import {projectsAPI} from "../services/api";
import {PageTitle} from "../components/layout/page-title";
import {AIAssistantChat} from "../components/features/ai-assistant-chat";
import {motion, AnimatePresence} from "framer-motion";
import { useUser } from "../context/UserContext";
import { useResponsiveProfile } from "../hooks/useResponsiveProfile";
import { Scroller } from "../components/ui/scroller";

export default function Dashboard() {
  const { userName } = useUser();
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
      const options = signal ? { signal } : {};
      const [projectsData, statsData] = await Promise.all([
        projectsAPI.getAll(options),
        projectsAPI.getStats(options),
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
      
      console.log('✅ Dados carregados:', { projects: projectsData.length, stats: statsData });
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
      let errorMessage = 'Failed to load data.';
      if (err.response?.status === 500) {
        const errorData = err.response?.data;
        if (errorData?.error) {
          errorMessage = `Server error: ${errorData.error}`;
          if (errorData.hint) {
            errorMessage += ` (${errorData.hint})`;
          }
        } else {
          errorMessage = 'Server error (500). Please check if the server is running and the database is set up correctly.';
        }
      } else if (err.response?.status) {
        errorMessage = `Request failed with status ${err.response.status}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  
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
              <PageTitle title="Dashboard-test" userName={userName} subtitle="Here's your project overview." showWelcome />
              <Button 
                color="primary" 
                startContent={<Icon icon="lucide:plus" />}
                className="font-medium"
                onPress={handleCreateProject}
                isDisabled={loading}
              >
                Create New Project
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
                  Retry
                </Button>
              </div>
            )}
            
            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" label="Loading data..." />
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
                  <StatsCard
                    title="Total Projects"
                    value={stats.total.toString()}
                    change={`${stats.total} projects total`}
                    isPositive={true}
                    icon="lucide:folder"
                    timePeriod="All time"
                  />
                  <StatsCard
                    title="Draft"
                    value={stats.draft.toString()}
                    change={`${stats.draft} drafts`}
                    isPositive={false}
                    icon="lucide:file-edit"
                    timePeriod="Pending"
                  />
                  <StatsCard
                    title="Created"
                    value={stats.created.toString()}
                    change={`${stats.created} created`}
                    isPositive={true}
                    icon="lucide:file-plus"
                    timePeriod="New"
                  />
                  <StatsCard
                    title="In Progress"
                    value={stats.inProgress.toString()}
                    change={`${stats.inProgress} active`}
                    isPositive={true}
                    icon="lucide:loader"
                    timePeriod="Currently"
                  />
                  <StatsCard
                    title="Finished"
                    value={stats.finished.toString()}
                    change={`${stats.finished} completed`}
                    isPositive={true}
                    icon="lucide:check-circle"
                    timePeriod="This month"
                  />
                  <StatsCard
                    title="Approved"
                    value={stats.approved.toString()}
                    change={`${stats.approved} approved`}
                    isPositive={true}
                    icon="lucide:thumbs-up"
                    timePeriod="This month"
                  />
                  <StatsCard
                    title="In Queue"
                    value={stats.inQueue.toString()}
                    change={`${stats.inQueue} waiting`}
                    isPositive={false}
                    icon="lucide:clock"
                    timePeriod="Pending"
                  />
                  <StatsCard
                    title="Cancelled"
                    value={stats.cancelled.toString()}
                    change={`${stats.cancelled} cancelled`}
                    isPositive={false}
                    icon="lucide:x-circle"
                    timePeriod="This month"
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

      {/* Floating AI Assistant Button */}
      <Button 
        isIconOnly
        color="primary" 
        className="fixed bottom-6 right-6 shadow-lg w-14 h-14 rounded-full transition-transform duration-200 hover:scale-105 z-50"
        onPress={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        <Icon 
          icon={isOpen ? "lucide:x" : "lucide:bot"}
          className="text-2xl" 
        />
      </Button>
      
      {/* AI Assistant Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-96 shadow-2xl rounded-2xl overflow-hidden border border-divider bg-background"
          >
            <AIAssistantChat onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
