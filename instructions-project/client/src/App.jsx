import React from "react";
import {Header} from "./components/header";
import {SidebarNavigation} from "./components/sidebar-navigation";
import {StatsCard} from "./components/stats-card";
import {Button, Spinner} from "@heroui/react";
import {Icon} from "@iconify/react";
import {ProjectTable} from "./components/project-table";
import {CreateProject} from "./components/create-project";
import {projectsAPI} from "./services/api";

export default function App() {
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
    // Recarregar dados após criar projeto
    loadData();
  };

  return (
    <div className="bg-background text-foreground flex h-screen">
      {/* Sidebar */}
      <aside className="w-20 border-r border-default-200">
        <SidebarNavigation />
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <Header />

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          {showCreateProject ? (
            <CreateProject onClose={handleCloseCreateProject} />
          ) : (
            <>
              {/* Dashboard Header with Create Button */}
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Dashboard</h1>
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
    </div>
  );
}


