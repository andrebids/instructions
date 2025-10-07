import React from "react";
import {Header} from "./components/header";
import {SidebarNavigation} from "./components/sidebar-navigation";
import {StatsCard} from "./components/stats-card";
import {Button} from "@heroui/react";
import {Icon} from "@iconify/react";
import {ProjectTable} from "./components/project-table";
import {CreateProject} from "./components/create-project";

export default function App() {
  const [showCreateProject, setShowCreateProject] = React.useState(false);
  
  const handleCreateProject = () => {
    setShowCreateProject(true);
  };
  
  const handleCloseCreateProject = () => {
    setShowCreateProject(false);
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
                >
                  Create New Project
                </Button>
              </div>
              
              {/* Stats Grid */}
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Total Projects"
                  value="12"
                  change="+2 from last month"
                  isPositive={true}
                  icon="lucide:folder"
                />
                <StatsCard
                  title="In Progress"
                  value="5"
                  change="+1 from last month"
                  isPositive={true}
                  icon="lucide:loader"
                />
                <StatsCard
                  title="Finished"
                  value="6"
                  change="+3 from last month"
                  isPositive={true}
                  icon="lucide:check-circle"
                />
                <StatsCard
                  title="Approved"
                  value="4"
                  change="+2 from last month"
                  isPositive={true}
                  icon="lucide:thumbs-up"
                />
              </div>

              {/* Project Table */}
              <div className="mb-6">
                <ProjectTable />
              </div>
              
            </>
          )}
        </div>
      </main>
    </div>
  );
}


