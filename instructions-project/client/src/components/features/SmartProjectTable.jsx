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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 5;

  // Status translation map
  const statusLabelMap = React.useMemo(() => ({
    "draft": t('pages.dashboard.stats.draft'),
    "created": t('pages.dashboard.stats.created'),
    "in_progress": t('pages.dashboard.stats.inProgress'),
    "finished": t('pages.dashboard.stats.finished'),
    "approved": t('pages.dashboard.stats.approved'),
    "cancelled": t('pages.dashboard.stats.cancelled'),
    "in_queue": t('pages.dashboard.stats.inQueue'),
    "to_order": t('pages.dashboard.projectTable.statusLabels.toOrder'),
    "ordered": t('pages.dashboard.projectTable.statusLabels.ordered'),
  }), [t]);

  // Mock data augmentation
  const augmentedProjects = React.useMemo(() => {
    return projects.map((p, index) => ({
      ...p,
      contractType: index % 3 === 0 ? "Sale" : index % 3 === 1 ? "Rent 1Y" : "Rent 3Y",
      contractTypeKey: index % 3 === 0 ? "sale" : index % 3 === 1 ? "rent1y" : "rent3y",
      designStatus: index % 2 === 0 ? "Ready" : "Pending",
      designStatusKey: index % 2 === 0 ? "ready" : "pending",
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
                <div className="text-xs font-semibold text-center">{t('pages.dashboard.smartProjectTable.tooltip.render')}</div>
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
        const normalizedStatus = project.status?.toLowerCase()?.replace(/\s+/g, '_') || project.status;
        const statusLabel = statusLabelMap[normalizedStatus] || project.status?.replace(/_/g, " ") || project.status;
        return (
          <Chip
            color={statusColorMap[project.status] || "default"}
            variant="flat"
            size="sm"
            className="capitalize"
          >
            {statusLabel}
          </Chip>
        );
      case "contract":
        const contractColors = {
          "Sale": "success",
          "Rent 1Y": "warning",
          "Rent 3Y": "primary"
        };
        const contractKey = project.contractTypeKey || (project.contractType === "Sale" ? "sale" : project.contractType === "Rent 1Y" ? "rent1y" : "rent3y");
        return (
          <Chip 
            size="sm" 
            color={contractColors[project.contractType]} 
            variant="dot"
            className="border-none"
          >
            {t(`pages.dashboard.smartProjectTable.contractTypes.${contractKey}`)}
          </Chip>
        );
      case "design":
        const designKey = project.designStatusKey || (project.designStatus === 'Ready' ? "ready" : "pending");
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${project.designStatus === 'Ready' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-sm text-zinc-300">{t(`pages.dashboard.smartProjectTable.designStatus.${designKey}`)}</span>
          </div>
        );
      case "reservation":
        const isUrgent = project.reservationValidity <= 5;
        return (
          <div className={`flex items-center gap-1 ${isUrgent ? 'text-red-400' : 'text-zinc-400'}`}>
            <Icon icon="lucide:clock" className="text-xs" />
            <span className="text-sm font-medium">
              {project.reservationValidity === 1 
                ? t('pages.dashboard.smartProjectTable.reservation.dayLeft')
                : t('pages.dashboard.smartProjectTable.reservation.daysLeft', { count: project.reservationValidity })}
            </span>
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
            <span className="text-xs text-zinc-400">{t('pages.dashboard.smartProjectTable.dates.start')} {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</span>
            <span className="text-xs text-zinc-500">{t('pages.dashboard.smartProjectTable.dates.end')} {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}</span>
          </div>
        );

      default:
        return cellValue;
    }
  }, [navigate, onProjectsUpdate, t, statusLabelMap]);

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
            <TableColumn key="name">{t('pages.dashboard.smartProjectTable.columns.project')}</TableColumn>
            <TableColumn key="status">{t('pages.dashboard.smartProjectTable.columns.status')}</TableColumn>
            <TableColumn key="contract">{t('pages.dashboard.smartProjectTable.columns.contract')}</TableColumn>
            <TableColumn key="design">{t('pages.dashboard.smartProjectTable.columns.design')}</TableColumn>
            <TableColumn key="reservation">{t('pages.dashboard.smartProjectTable.columns.reservation')}</TableColumn>
            <TableColumn key="budget">{t('pages.dashboard.smartProjectTable.columns.budget')}</TableColumn>
            <TableColumn key="dates">{t('pages.dashboard.smartProjectTable.columns.timeline')}</TableColumn>

          </TableHeader>
          <TableBody items={items} emptyContent={t('pages.dashboard.smartProjectTable.emptyState')}>
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
