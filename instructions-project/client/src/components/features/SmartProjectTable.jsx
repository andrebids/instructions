import React from "react";
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  Chip, 
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
import { SmartProjectTableFilters } from "./SmartProjectTableFilters";

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
  const [filters, setFilters] = React.useState({
    status: [],
    contract: [],
    design: []
  });

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
  }), [t, i18n.language]);

  // Filter projects based on active filters
  const getFilteredProjects = React.useCallback((projectsToFilter, activeFilters) => {
    return projectsToFilter.filter(project => {
      // Filter by status
      if (activeFilters.status.length > 0) {
        const normalizedStatus = project.status?.toLowerCase()?.replace(/\s+/g, '_') || project.status?.toLowerCase();
        if (!activeFilters.status.includes(normalizedStatus)) {
          return false;
        }
      }

      // Filter by contract
      if (activeFilters.contract.length > 0) {
        const contractKey = project.contractTypeKey || 
          (project.contractType === "Sale" ? "sale" : 
           project.contractType === "Rent 1Y" ? "rent1y" : 
           project.contractType === "Rent 3Y" ? "rent3y" : null);
        if (!contractKey || !activeFilters.contract.includes(contractKey)) {
          return false;
        }
      }

      // Filter by design
      if (activeFilters.design.length > 0) {
        const designKey = project.designStatusKey || 
          (project.designStatus === 'Ready' ? "ready" : 
           project.designStatus === 'Pending' ? "pending" : null);
        if (!designKey || !activeFilters.design.includes(designKey)) {
          return false;
        }
      }

      return true;
    });
  }, []);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filters.status, filters.contract, filters.design]);

  const handleFilterChange = React.useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = React.useCallback(() => {
    setFilters({
      status: [],
      contract: [],
      design: []
    });
  }, []);

  // Mock data augmentation - Apply to all projects first
  const augmentedProjects = React.useMemo(() => {
    return projects.map((p, i) => {
      return {
        ...p,
        contractType: i % 3 === 0 ? "Sale" : i % 3 === 1 ? "Rent 1Y" : "Rent 3Y",
        contractTypeKey: i % 3 === 0 ? "sale" : i % 3 === 1 ? "rent1y" : "rent3y",
        designStatus: i % 2 === 0 ? "Ready" : "Pending",
        designStatusKey: i % 2 === 0 ? "ready" : "pending"
      };
    });
  }, [projects]);

  // Get filtered projects
  const filteredProjects = React.useMemo(() => {
    return getFilteredProjects(augmentedProjects, filters);
  }, [augmentedProjects, filters, getFilteredProjects]);

  // Paginate filtered projects
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredProjects.slice(start, end);
  }, [page, filteredProjects]);

  const pages = Math.ceil(filteredProjects.length / rowsPerPage);

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
          <div className="stop-propagation" onClick={(e) => e.stopPropagation()}>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              aria-label={project.isFavorite ? "Remove from favorites" : "Add to favorites"}
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
          </div>
        );
      case "name":
        return <ProjectNameCell project={project} navigate={navigate} t={t} language={i18n.language} />;
      case "status":
        const normalizedStatus = project.status?.toLowerCase()?.replace(/\s+/g, '_') || project.status;
        const statusLabel = statusLabelMap[normalizedStatus] || project.status?.replace(/_/g, " ") || project.status;
        return (
          <Chip
            color={statusColorMap[project.status] || "default"}
            variant="flat"
            size="sm"
            className="capitalize rounded-none"
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
            className="border-none rounded-none"
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
        // Só mostrar reservation se existir uma reserva válida
        if (!project.reservationValidity || project.reservationValidity <= 0) {
          return <span className="text-sm text-default-400">-</span>;
        }
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
            {project.budget ? `€ ${parseFloat(project.budget).toLocaleString(locale)}` : '-'}
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
  }, [navigate, onProjectsUpdate, t, statusLabelMap, locale, handleToggleFavorite, i18n.language]);

  return (
    <Card className="flex-1 h-full bg-content1/50 border-default-200/50 backdrop-blur-md shadow-sm">
      <CardBody className="p-0 overflow-hidden flex flex-col h-full">
        <SmartProjectTableFilters
          filters={filters}
          onFiltersChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          statusLabelMap={statusLabelMap}
          filteredCount={filteredProjects.length}
        />
        <div className="flex-1 overflow-auto min-h-0">
          <Table 
            removeWrapper 
            aria-label="Smart Project Table"
            classNames={{
              wrapper: "rounded-none",
              th: "bg-default-100/50 text-default-500 font-medium border-b border-default-200/50 rounded-none first:rounded-none last:rounded-none",
              td: "py-3 border-b border-default-200/50 group-last:border-none rounded-none",
              tr: "hover:bg-default-100/50 transition-colors cursor-pointer"
            }}
            bottomContent={
              <div className="flex w-full justify-end px-4 pb-4">
                <Pagination
                  isCompact
                  showControls
                  color="primary"
                  page={page}
                  total={pages}
                  onChange={setPage}
                  classNames={{
                    wrapper: "gap-0",
                    item: "bg-transparent text-default-600 hover:bg-default-100/10 dark:hover:bg-default-800/10 min-w-8 w-8 h-8",
                    cursor: "bg-primary-500 text-white font-medium"
                  }}
                />
              </div>
            }
          >
          <TableHeader className="rounded-none">
            <TableColumn key="favorite" width={50} className="rounded-none"> </TableColumn>
            <TableColumn key="name" className="rounded-none">{t('pages.dashboard.smartProjectTable.columns.project')}</TableColumn>
            <TableColumn key="status" className="rounded-none">{t('pages.dashboard.smartProjectTable.columns.status')}</TableColumn>
            <TableColumn key="contract" className="rounded-none">{t('pages.dashboard.smartProjectTable.columns.contract')}</TableColumn>
            <TableColumn key="design" className="rounded-none">{t('pages.dashboard.smartProjectTable.columns.design')}</TableColumn>
            <TableColumn key="reservation" className="rounded-none">{t('pages.dashboard.smartProjectTable.columns.reservation')}</TableColumn>
            <TableColumn key="budget" className="rounded-none">{t('pages.dashboard.smartProjectTable.columns.budget')}</TableColumn>
            <TableColumn key="dates" className="rounded-none">{t('pages.dashboard.smartProjectTable.columns.timeline')}</TableColumn>

          </TableHeader>
          <TableBody 
            items={isLoading ? Array(rowsPerPage).fill(null) : items} 
            emptyContent={!isLoading ? t('pages.dashboard.smartProjectTable.emptyState') : null}
          >
            {(item) => (
              <TableRow 
                key={item?.id || Math.random()}
                className={!isLoading && item ? "cursor-pointer" : ""}
                onClick={!isLoading && item ? (e) => {
                  // Verifica se o clique foi em um elemento que deve bloquear a navegação
                  const target = e.target;
                  
                  // Verifica se o elemento clicado ou algum pai tem a classe stop-propagation
                  const hasStopPropagation = target.closest('.stop-propagation') !== null;
                  
                  // Verifica se é um botão real (não apenas um elemento com role="button" do HeroUI)
                  const isRealButton = target.tagName === 'BUTTON' || 
                                      (target.closest('button') !== null && target.closest('button')?.tagName === 'BUTTON');
                  
                  // Verifica se é um link real
                  const isRealLink = target.tagName === 'A' || target.closest('a')?.tagName === 'A';
                  
                  // Só bloqueia se for realmente um elemento interativo que precisa bloquear
                  if (!hasStopPropagation && !isRealButton && !isRealLink) {
                    navigate(`/projects/${item.id}`);
                  }
                } : undefined}
              >
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

// Extracted component for Name Cell to optimize rendering
const ProjectNameCell = React.memo(({ project, navigate, t, language }) => {
  return (
    <div className="hover:text-primary transition-colors">
      <p className="font-bold text-sm text-foreground">{project.name}</p>
      <p className="text-xs text-default-500">{project.clientName || project.client}</p>
    </div>
  );
});
