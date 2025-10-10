import React from "react";
import {Header} from "./components/header";
import {SidebarNavigation} from "./components/sidebar-navigation";
import {StatsCard} from "./components/stats-card";
import {Button, Spinner} from "@heroui/react";
import {Icon} from "@iconify/react";
import {ProjectTable} from "./components/project-table";
import {CreateProject} from "./components/create-project";
import {CreateProjectMultiStep} from "./components/create-project-multi-step";
import {projectsAPI} from "./services/api";
import {WelcomeHero} from "./components/welcome-hero";
import {AIAssistantChat} from "./components/ai-assistant-chat";
import {motion, AnimatePresence} from "framer-motion";

export default function App() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showCreateProject, setShowCreateProject] = React.useState(false);
  const [projects, setProjects] = React.useState([]);
  const [stats, setStats] = React.useState({
    total: 0,
    inProgress: 0,
    finished: 0,
    approved: 0,
    cancelled: 0,
    inQueue: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedImage, setSelectedImage] = React.useState(null);
  
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
  
  // Carregar dados ao iniciar
  React.useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carregar projetos e stats em paralelo
      const [projectsData, statsData] = await Promise.all([
        projectsAPI.getAll(),
        projectsAPI.getStats(),
      ]);
      
      setProjects(projectsData);
      setStats({
        total: statsData.total,
        inProgress: statsData.inProgress,
        finished: statsData.finished,
        approved: statsData.approved,
        cancelled: statsData.cancelled,
        inQueue: statsData.inQueue,
      });
      
      console.log('✅ Dados carregados:', { projects: projectsData.length, stats: statsData });
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err);
      setError('Failed to load data. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateProject = () => {
    setShowCreateProject(true);
  };
  
  const handleCloseCreateProject = () => {
    setShowCreateProject(false);
    setSelectedImage(null);
    // Recarregar dados após criar projeto
    loadData();
  };

  return (
    <div className="bg-background text-foreground flex h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-20">
        <SidebarNavigation />
      </aside>


      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <Header />

        {/* Dashboard Content */}
        <div className={`flex-1 min-h-0 ${showCreateProject ? 'overflow-hidden' : 'overflow-auto p-6'}`}>
          {showCreateProject ? (
            <CreateProjectMultiStep 
              onClose={handleCloseCreateProject} 
              selectedImage={selectedImage}
            />
          ) : (
            <>
              {/* Welcome section + Create button */}
              <div className="flex justify-between items-center mb-6">
                <WelcomeHero userName="Christopher" />
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
                  <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <StatsCard
                      title="Total Projects"
                      value={stats.total.toString()}
                      change={`${stats.total} projects total`}
                      isPositive={true}
                      icon="lucide:folder"
                      timePeriod="All time"
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
                    <ProjectTable projects={projects} onProjectsUpdate={loadData} />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

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
    </div>
  );
}


