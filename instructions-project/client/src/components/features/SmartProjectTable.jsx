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
  Pagination,
  Skeleton
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

export const SmartProjectTable = React.memo(({ projects = [], onProjectsUpdate, onProjectDeleted, isLoading = false }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 5;

  // Helper para obter locale do i18n
  const locale = React.useMemo(() => {
    const langMap = {
      'pt': 'pt-PT',
      'en': 'en-US',
      'fr': 'fr-FR'
    };
    return langMap[i18n.language] || 'pt-PT';
  }, [i18n.language]);

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

  // Mock data augmentation - Optimized to only process visible items
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const visibleProjects = projects.slice(start, end);

    return visibleProjects.map((p, i) => {
      const index = start + i;
      // Função determinística para gerar valor estável baseado no index (evita Math.random durante render)
      const deterministicValue = ((index * 17 + 23) % 10) + 5; // Gera valores entre 5-14 de forma determinística
      return {
        ...p,
        contractType: index % 3 === 0 ? "Sale" : index % 3 === 1 ? "Rent 1Y" : "Rent 3Y",
        contractTypeKey: index % 3 === 0 ? "sale" : index % 3 === 1 ? "rent1y" : "rent3y",
        designStatus: index % 2 === 0 ? "Ready" : "Pending",
        designStatusKey: index % 2 === 0 ? "ready" : "pending",
        reservationValidity: index % 4 === 0 ? 3 : deterministicValue, // Mock days
        mockImage: `https://images.unsplash.com/photo-${index % 2 === 0 ? '1576692131261-40e88a446404' : '1512389142660-9c87db076481'}?w=300&h=200&fit=crop`
      };
    });
  }, [page, projects]);

  const pages = Math.ceil(projects.length / rowsPerPage);

  const handleToggleFavorite = React.useCallback(async (projectId, isFavorite) => {
    try {
      await projectsAPI.toggleFavorite(projectId);
      if (onProjectsUpdate) onProjectsUpdate();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [onProjectsUpdate]);

  const renderCell = React.useCallback((project, columnKey) => {
    const cellValue = project[columnKey];

    switch (columnKey) {
      case "favorite":
        return (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => {
              // Chamar handleToggleFavorite diretamente sem incluí-lo nas dependências
              // para evitar dependência circular
              handleToggleFavorite(project.id, project.isFavorite);
            }}
            className="text-warning hover:text-warning-600"
          >
            <Icon
              icon={project.isFavorite ? "material-symbols:star" : "material-symbols:star-outline"}
              className={`text-lg text-warning ${project.isFavorite ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
            />
          </Button>
        );
      case "name":
        return <ProjectNameCell project={project} navigate={navigate} t={t} />;
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
            <div className={`w-2 h-2 rounded-full ${project.designStatus === 'Ready' ? 'bg-success-500' : 'bg-warning-500'}`} />
            <span className="text-sm text-default-500">{t(`pages.dashboard.smartProjectTable.designStatus.${designKey}`)}</span>
          </div>
        );
      case "reservation":
        const isUrgent = project.reservationValidity <= 5;
        return (
          <div className={`flex items-center gap-1 ${isUrgent ? 'text-danger-400' : 'text-default-400'}`}>
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
          <span className="text-sm font-medium text-default-500">
            {project.budget ? `€ ${parseFloat(project.budget).toLocaleString(locale)}` : '€ 0'}
          </span>
        );
      case "dates":
        const formatDate = (dateString) => {
          if (!dateString) return '-';
          try {
            return new Date(dateString).toLocaleDateString(locale);
          } catch (e) {
            return dateString;
          }
        };
        return (
          <div className="flex flex-col">
            <span className="text-xs text-default-400">{t('pages.dashboard.smartProjectTable.dates.start')} {formatDate(project.startDate)}</span>
            <span className="text-xs text-default-500">{t('pages.dashboard.smartProjectTable.dates.end')} {formatDate(project.endDate)}</span>
          </div>
        );

      default:
        return cellValue;
    }
  }, [navigate, onProjectsUpdate, t, statusLabelMap, locale, handleToggleFavorite]);

  return (
    <Card className="flex-1 h-full bg-content1/50 border-default-200/50 backdrop-blur-md shadow-sm">
      <CardBody className="p-0 overflow-hidden flex flex-col h-full">
        <div className="flex-1 overflow-auto min-h-0">
          <Table 
            removeWrapper 
            aria-label="Smart Project Table"
            classNames={{
              th: "bg-default-100/50 text-default-500 font-medium border-b border-default-200/50",
              td: "py-3 border-b border-default-200/50 group-last:border-none",
              tr: "hover:bg-default-100/50 transition-colors"
            }}
            bottomContent={
              <div className="flex w-full justify-end px-4 pb-4">
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
          <TableBody 
            items={isLoading ? Array(rowsPerPage).fill(null) : items} 
            emptyContent={!isLoading ? t('pages.dashboard.smartProjectTable.emptyState') : null}
          >
            {(item) => (
              <TableRow key={item?.id || Math.random()}>
                {(columnKey) => (
                  <TableCell>
                    {isLoading ? (
                      <SkeletonRow columnKey={columnKey} />
                    ) : (
                      renderCell(item, columnKey)
                    )}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardBody>
    </Card>
  );
});

// Skeleton row component for loading state
const SkeletonRow = React.memo(({ columnKey }) => {
  switch (columnKey) {
    case "favorite":
      return <Skeleton className="w-6 h-6 rounded-full" />;
    case "name":
      return (
        <div className="flex flex-col gap-2">
          <Skeleton className="w-32 h-4 rounded" />
          <Skeleton className="w-24 h-3 rounded" />
        </div>
      );
    case "status":
      return <Skeleton className="w-20 h-6 rounded-full" />;
    case "contract":
      return <Skeleton className="w-16 h-6 rounded-full" />;
    case "design":
      return (
        <div className="flex items-center gap-2">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="w-16 h-4 rounded" />
        </div>
      );
    case "reservation":
      return (
        <div className="flex items-center gap-1">
          <Skeleton className="w-3 h-3 rounded" />
          <Skeleton className="w-20 h-4 rounded" />
        </div>
      );
    case "budget":
      return <Skeleton className="w-24 h-4 rounded" />;
    case "dates":
      return (
        <div className="flex flex-col gap-1">
          <Skeleton className="w-28 h-3 rounded" />
          <Skeleton className="w-28 h-3 rounded" />
        </div>
      );
    default:
      return <Skeleton className="w-full h-4 rounded" />;
  }
});
SkeletonRow.displayName = 'SkeletonRow';

// Extracted component for Name Cell with Tooltip to optimize rendering
const ProjectNameCell = React.memo(({ project, navigate, t }) => {
  return (
    <Tooltip 
      content={
        <div className="p-1">
          <img 
            src={project.mockImage} 
            alt="Preview" 
            className="w-48 h-32 object-cover rounded-lg mb-2" 
            loading="lazy" // Lazy load image
          />
          <div className="text-xs font-semibold text-center">{t('pages.dashboard.smartProjectTable.tooltip.render')}</div>
        </div>
      }
      delay={200} // Add delay to prevent accidental triggers
      closeDelay={0}
      placement="right"
      className="bg-content1 border border-default-200"
    >
      <div className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/projects/${project.id}`)}>
        <p className="font-bold text-sm text-foreground">{project.name}</p>
        <p className="text-xs text-default-500">{project.clientName || project.client}</p>
      </div>
    </Tooltip>
  );
});
