import React from "react";
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  Chip, 
  Tooltip,
  Card,
  CardBody,
  Button,
  Pagination
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { projectsAPI } from "../../services/api";

const statusColorMap = {
  "draft": "default",
  "created": "default",
  "in_progress": "primary",
  "finished": "success",
  "approved": "secondary",
  "cancelled": "danger",
  "in_queue": "warning",
  "to_order": "secondary",
  "ordered": "primary",
};

export function SmartProjectTable({ projects = [], onProjectsUpdate, onProjectDeleted }) {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 5;

  // Mock data augmentation
  const augmentedProjects = React.useMemo(() => {
    return projects.map((p, index) => ({
      ...p,
      contractType: index % 3 === 0 ? "Sale" : index % 3 === 1 ? "Rent 1Y" : "Rent 3Y",
      designStatus: index % 2 === 0 ? "Ready" : "Pending",
      reservationValidity: index % 4 === 0 ? 3 : Math.floor(Math.random() * 10) + 5, // Mock days
      mockImage: `https://images.unsplash.com/photo-${index % 2 === 0 ? '1576692131261-40e88a446404' : '1512389142660-9c87db076481'}?w=300&h=200&fit=crop`
    }));
  }, [projects]);

  const pages = Math.ceil(augmentedProjects.length / rowsPerPage);
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return augmentedProjects.slice(start, end);
  }, [page, augmentedProjects]);

  const handleToggleFavorite = async (projectId, isFavorite) => {
    try {
      await projectsAPI.toggleFavorite(projectId);
      if (onProjectsUpdate) onProjectsUpdate();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const renderCell = React.useCallback((project, columnKey) => {
    const cellValue = project[columnKey];

    switch (columnKey) {
      case "favorite":
        return (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => handleToggleFavorite(project.id, project.isFavorite)}
            className="text-warning hover:text-warning-600"
          >
            <Icon
              icon={project.isFavorite ? "material-symbols:star" : "material-symbols:star-outline"}
              className={`text-lg text-warning ${project.isFavorite ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
            />
          </Button>
        );
      case "name":
        return (
          <Tooltip 
            content={
              <div className="p-1">
                <img 
                  src={project.mockImage} 
                  alt="Preview" 
                  className="w-48 h-32 object-cover rounded-lg mb-2" 
                />
                <div className="text-xs font-semibold text-center">Christmas Light Render</div>
              </div>
            }
            delay={0}
            closeDelay={0}
            placement="right"
            className="bg-zinc-900 border border-zinc-700"
          >
            <div className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/projects/${project.id}`)}>
              <p className="font-bold text-sm">{project.name}</p>
              <p className="text-xs text-zinc-500">{project.clientName || project.client}</p>
            </div>
          </Tooltip>
        );
      case "status":
        return (
          <Chip
            color={statusColorMap[project.status] || "default"}
            variant="flat"
            size="sm"
            className="capitalize"
          >
            {project.status?.replace(/_/g, " ")}
          </Chip>
        );
      case "contract":
        const contractColors = {
          "Sale": "success",
          "Rent 1Y": "warning",
          "Rent 3Y": "primary"
        };
        return (
          <Chip 
            size="sm" 
            color={contractColors[project.contractType]} 
            variant="dot"
            className="border-none"
          >
            {project.contractType}
          </Chip>
        );
      case "design":
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${project.designStatus === 'Ready' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-sm text-zinc-300">{project.designStatus}</span>
          </div>
        );
      case "reservation":
        const isUrgent = project.reservationValidity <= 5;
        return (
          <div className={`flex items-center gap-1 ${isUrgent ? 'text-red-400' : 'text-zinc-400'}`}>
            <Icon icon="lucide:clock" className="text-xs" />
            <span className="text-sm font-medium">{project.reservationValidity} days left</span>
          </div>
        );
      case "budget":
        return (
          <span className="text-sm font-medium text-zinc-300">
            {project.budget ? `€ ${parseFloat(project.budget).toLocaleString()}` : '€ 0'}
          </span>
        );
      case "dates":
        return (
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400">Start: {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</span>
            <span className="text-xs text-zinc-500">End: {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}</span>
          </div>
        );

      default:
        return cellValue;
    }
  }, [navigate, onProjectsUpdate]);

  return (
    <Card className="h-full bg-zinc-900/50 border-zinc-800/50 backdrop-blur-md">
      <CardBody className="p-0 overflow-hidden flex flex-col h-full">
        <Table 
          removeWrapper 
          aria-label="Smart Project Table"
          classNames={{
            th: "bg-zinc-800/50 text-zinc-400 font-medium border-b border-zinc-800",
            td: "py-3 border-b border-zinc-800/50 group-last:border-none",
            tr: "hover:bg-zinc-800/30 transition-colors"
          }}
          bottomContent={
            <div className="flex w-full justify-center px-4 pb-4">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={pages}
                onChange={setPage}
                className="bg-transparent"
              />
            </div>
          }
        >
          <TableHeader>
            <TableColumn key="favorite" width={50}> </TableColumn>
            <TableColumn key="name">PROJECT</TableColumn>
            <TableColumn key="status">STATUS</TableColumn>
            <TableColumn key="contract">CONTRACT</TableColumn>
            <TableColumn key="design">DESIGN</TableColumn>
            <TableColumn key="reservation">RESERVATION</TableColumn>
            <TableColumn key="budget">BUDGET</TableColumn>
            <TableColumn key="dates">TIMELINE</TableColumn>

          </TableHeader>
          <TableBody items={items} emptyContent="No active projects">
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
