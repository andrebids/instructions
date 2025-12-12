import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Chip,
  Pagination,
  Select,
  SelectItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Calendar,
  useDisclosure
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { projectsAPI } from "../../services/api.js";
import ConfirmModal from "../common/ConfirmModal.jsx";
import { SyncStatus } from "./SyncStatus";

// Status mapping from API to UI
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

export function ProjectTable({ projects: apiProjects = [], onProjectsUpdate, onProjectDeleted }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const statusLabelMap = React.useMemo(() => ({
    "draft": t('pages.dashboard.projectTable.statusLabels.draft'),
    "created": t('pages.dashboard.projectTable.statusLabels.created'),
    "in_progress": t('pages.dashboard.projectTable.statusLabels.inProgress'),
    "finished": t('pages.dashboard.projectTable.statusLabels.finished'),
    "approved": t('pages.dashboard.projectTable.statusLabels.approved'),
    "cancelled": t('pages.dashboard.projectTable.statusLabels.cancelled'),
    "in_queue": t('pages.dashboard.projectTable.statusLabels.inQueue'),
    "to_order": t('pages.dashboard.projectTable.statusLabels.toOrder'),
    "ordered": t('pages.dashboard.projectTable.statusLabels.ordered'),
  }), [t, i18n.language]);

  // Função helper para normalizar e traduzir status
  const getTranslatedStatus = React.useCallback((status) => {
    if (!status) return status;
    // Normalizar: converter para lowercase e substituir espaços por underscore
    const normalized = String(status).toLowerCase().replace(/\s+/g, '_');
    // Tentar encontrar tradução primeiro com status normalizado, depois com original
    return statusLabelMap[normalized] || statusLabelMap[status] || status;
  }, [statusLabelMap]);

  // Transform API data to table format
  const projects = React.useMemo(() => {
    if (!apiProjects || !Array.isArray(apiProjects) || apiProjects.length === 0) {
      return [];
    }

    return apiProjects.map(project => ({
      id: project.id,
      name: project.name,
      client: project.clientName,
      status: project.status,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      budget: project.budget ? `€ ${parseFloat(project.budget).toLocaleString()}` : '€ 0',
      projectType: project.projectType,
      isFavorite: project.isFavorite,
    }));
  }, [apiProjects]);
  const [filterValue, setFilterValue] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [favoriteFilter, setFavoriteFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [dateRange, setDateRange] = React.useState({ start: null, end: null });

  // Estado para modal de confirmação de delete
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onOpenChange: onDeleteModalOpenChange } = useDisclosure();
  const [projectToDelete, setProjectToDelete] = React.useState(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Debounce search using React 18's concurrent rendering hint
  const deferredFilterValue = React.useDeferredValue(filterValue);

  const clearFilters = () => {
    setFilterValue("");
    setStatusFilter("all");
    setFavoriteFilter("all");
    setDateRange({ start: null, end: null });
    setPage(1);
  };

  const filteredProjects = React.useMemo(() => {
    let filtered = [...projects];

    // Filter by search term (debounced)
    if (deferredFilterValue) {
      const term = deferredFilterValue.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(term) ||
        project.client.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Filter by favorite
    if (favoriteFilter !== "all") {
      filtered = filtered.filter(project =>
        favoriteFilter === "favorites" ? project.isFavorite : !project.isFavorite
      );
    }

    // Filter by date interval overlap: project [start,end] intersects selected [start,end]
    if (dateRange.start && dateRange.end) {
      const selStart = new Date(dateRange.start);
      const selEnd = new Date(dateRange.end);
      filtered = filtered.filter(project => {
        const projStart = new Date(project.startDate);
        const projEnd = new Date(project.endDate || project.startDate);
        if (Number.isNaN(projStart.getTime()) && Number.isNaN(projEnd.getTime())) return true;
        // overlap if not (project ends before selection starts OR project starts after selection ends)
        return !(projEnd < selStart || projStart > selEnd);
      });
    }

    return filtered;
  }, [projects, deferredFilterValue, statusFilter, favoriteFilter, dateRange]);

  // Pagination
  const pages = Math.ceil(filteredProjects.length / rowsPerPage) || 1;
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredProjects.slice(start, end);
  }, [page, filteredProjects, rowsPerPage]);

  const onSearchChange = (value) => {
    setFilterValue(value);
    setPage(1);
  };

  const onStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const onFavoriteFilterChange = (favorite) => {
    setFavoriteFilter(favorite);
    setPage(1);
  };

  const onDateRangeChange = (range) => {
    setDateRange(range);
    setPage(1);
  };

  const handleToggleFavorite = React.useCallback(async (projectId) => {
    try {
      await projectsAPI.toggleFavorite(projectId);
      // Call the callback to refresh projects data
      if (onProjectsUpdate) {
        onProjectsUpdate();
      }
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
    }
  }, [onProjectsUpdate]);

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    onDeleteModalOpen();
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    const projectToDeleteCopy = { ...projectToDelete }; // Guardar cópia para usar no callback

    try {
      await projectsAPI.delete(projectToDelete.id);

      // Atualização otimista: usar callback otimizado se disponível
      if (onProjectDeleted) {
        onProjectDeleted(projectToDeleteCopy);
      } else if (onProjectsUpdate) {
        // Fallback: refresh completo se callback otimizado não estiver disponível
        onProjectsUpdate();
      }

      setProjectToDelete(null);
      // O modal será fechado automaticamente pelo ConfirmModal após a Promise resolver
    } catch (error) {
      console.error('Error deleting project:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred while deleting project';

      // Em caso de erro, fazer refresh completo para garantir sincronização
      if (onProjectsUpdate) {
        onProjectsUpdate();
      }

      alert(`Error deleting project: ${errorMessage}`);
      // Re-throw para que o ConfirmModal não feche em caso de erro
      throw error;
    } finally {
      setIsDeleting(false);
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
            onPress={() => handleToggleFavorite(project.id)}
            title={project.isFavorite ? t('pages.dashboard.projectTable.actions.removeFromFavorites') : t('pages.dashboard.projectTable.actions.addToFavorites')}
            aria-label={project.isFavorite ? t('pages.dashboard.projectTable.actions.removeFromFavorites') : t('pages.dashboard.projectTable.actions.addToFavorites')}
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
          <div className="flex items-center gap-2">
            {project.category === 'ao_tender' && (
              <Chip size="sm" color="secondary" variant="flat" startContent={<Icon icon="lucide:star" className="text-xs" />}>
                AO
              </Chip>
            )}
            <span className="font-medium">{project.name}</span>
            {project.projectType === 'simu' && (
              <Chip size="sm" color="primary" variant="dot">Simu</Chip>
            )}
            {project.projectType === 'logo' && (
              <Chip size="sm" color="secondary" variant="dot">Logo</Chip>
            )}
            <SyncStatus projectId={project.id} />
          </div>
        );
      case "status":
        const normalizedStatus = project.status?.toLowerCase()?.replace(/\s+/g, '_') || project.status;
        const translatedStatus = getTranslatedStatus(project.status);
        return (
          <Chip
            color={statusColorMap[normalizedStatus] || statusColorMap[project.status] || "default"}
            variant="flat"
            size="sm"
          >
            {translatedStatus}
          </Chip>
        );
      case "actions":
        return (
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              title={t('pages.dashboard.projectTable.actions.viewNotes')}
              aria-label={t('pages.dashboard.projectTable.actions.viewNotes')}
              onPress={() => navigate(`/projects/${project.id}/notes`)}
            >
              <Icon icon="lucide:file-text" className="text-lg" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              title={t('pages.dashboard.projectTable.actions.viewProject')}
              aria-label={t('pages.dashboard.projectTable.actions.viewProject')}
              onPress={() => navigate(`/projects/${project.id}`)}
            >
              <Icon icon="lucide:eye" className="text-lg" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              title={t('pages.dashboard.projectTable.actions.editProject')}
              aria-label={t('pages.dashboard.projectTable.actions.editProject')}
              onPress={() => navigate(`/projects/${project.id}/edit`)}
            >
              <Icon icon="lucide:edit-2" className="text-lg" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              title={t('pages.dashboard.projectTable.actions.deleteProject')}
              aria-label={t('pages.dashboard.projectTable.actions.deleteProject')}
              className="text-danger hover:text-danger-600"
              onPress={() => handleDeleteClick(project)}
            >
              <Icon icon="lucide:trash-2" className="text-lg" />
            </Button>
          </div>
        );
      default:
        return cellValue;
    }
  }, [handleToggleFavorite, navigate, statusLabelMap, t, getTranslatedStatus]);

  const getTitle = () => {
    if (projects.length === 1) {
      return t('pages.dashboard.projectTable.titleOne');
    }
    return t('pages.dashboard.projectTable.title', { count: projects.length });
  };

  const getFavoritesFilterLabel = () => {
    if (favoriteFilter === "all") {
      return t('pages.dashboard.projectTable.favoritesAll');
    } else if (favoriteFilter === "favorites") {
      return t('pages.dashboard.projectTable.favoritesOnly');
    } else {
      return t('pages.dashboard.projectTable.favoritesNone');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-xl font-semibold">{getTitle()}</div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <Input
          isClearable
          className="w-full md:max-w-xs"
          classNames={{
            inputWrapper: "bg-[#e4e3e8] dark:bg-content1 shadow-sm"
          }}
          placeholder={t('pages.dashboard.projectTable.searchPlaceholder')}
          startContent={<Icon icon="lucide:search" />}
          value={filterValue}
          onValueChange={onSearchChange}
        />

        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
              className="bg-[#e4e3e8] dark:bg-content1 shadow-sm"
              endContent={<Icon icon="lucide:chevron-down" />}
            >
              {t('pages.dashboard.projectTable.statusFilter', {
                status: statusFilter === "all" ? t('pages.dashboard.projectTable.statusAll') : statusLabelMap[statusFilter] || statusFilter
              })}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label={t('pages.dashboard.projectTable.statusFilter', { status: '' })}
            onAction={(key) => onStatusFilterChange(key)}
            selectedKeys={[statusFilter]}
            selectionMode="single"
          >
            <DropdownItem key="all">{t('pages.dashboard.projectTable.statusLabels.all')}</DropdownItem>
            <DropdownItem key="draft">{t('pages.dashboard.projectTable.statusLabels.draft')}</DropdownItem>
            <DropdownItem key="created">{t('pages.dashboard.projectTable.statusLabels.created')}</DropdownItem>
            <DropdownItem key="in_progress">{t('pages.dashboard.projectTable.statusLabels.inProgress')}</DropdownItem>
            <DropdownItem key="finished">{t('pages.dashboard.projectTable.statusLabels.finished')}</DropdownItem>
            <DropdownItem key="approved">{t('pages.dashboard.projectTable.statusLabels.approved')}</DropdownItem>
            <DropdownItem key="cancelled">{t('pages.dashboard.projectTable.statusLabels.cancelled')}</DropdownItem>
            <DropdownItem key="in_queue">{t('pages.dashboard.projectTable.statusLabels.inQueue')}</DropdownItem>
            <DropdownItem key="to_order">{t('pages.dashboard.projectTable.statusLabels.toOrder')}</DropdownItem>
            <DropdownItem key="ordered">{t('pages.dashboard.projectTable.statusLabels.ordered')}</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
              className="bg-[#e4e3e8] dark:bg-content1 shadow-sm"
              endContent={<Icon icon="lucide:chevron-down" />}
            >
              {t('pages.dashboard.projectTable.favoritesFilter', { filter: getFavoritesFilterLabel() })}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label={t('pages.dashboard.projectTable.favoritesFilter', { filter: '' })}
            onAction={(key) => onFavoriteFilterChange(key)}
            selectedKeys={[favoriteFilter]}
            selectionMode="single"
          >
            <DropdownItem key="all">{t('pages.dashboard.projectTable.favoritesAll')}</DropdownItem>
            <DropdownItem key="favorites">{t('pages.dashboard.projectTable.favoritesOnly')}</DropdownItem>
            <DropdownItem key="non-favorites">{t('pages.dashboard.projectTable.favoritesNone')}</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <div className="flex items-center gap-2">
          <Popover placement="bottom-start">
            <PopoverTrigger>
              <Button
                variant="flat"
                className="w-full md:w-auto justify-start bg-[#e4e3e8] dark:bg-content1 shadow-sm"
                endContent={<Icon icon="lucide:calendar" />}
              >
                {dateRange.start ? new Date(dateRange.start).toLocaleDateString() : t('pages.dashboard.projectTable.startDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                aria-label={t('pages.dashboard.projectTable.startDate')}
                value={dateRange.start ? new Date(dateRange.start) : null}
                onChange={(date) => onDateRangeChange({ ...dateRange, start: date })}
              />
            </PopoverContent>
          </Popover>

          <Popover placement="bottom-start">
            <PopoverTrigger>
              <Button
                variant="flat"
                className="w-full md:w-auto justify-start bg-[#e4e3e8] dark:bg-content1 shadow-sm"
                endContent={<Icon icon="lucide:calendar" />}
              >
                {dateRange.end ? new Date(dateRange.end).toLocaleDateString() : t('pages.dashboard.projectTable.endDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                aria-label={t('pages.dashboard.projectTable.endDate')}
                value={dateRange.end ? new Date(dateRange.end) : null}
                onChange={(date) => onDateRangeChange({ ...dateRange, end: date })}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          variant="light"
          onPress={clearFilters}
          className="md:ml-auto bg-[#e4e3e8] dark:bg-content1 shadow-sm"
        >
          {t('pages.dashboard.projectTable.clearFilters')}
        </Button>
      </div>

      {/* Table */}
      <Table
        aria-label={t('pages.dashboard.projectTable.columns.projectName')}
        bottomContent={
          <div className="flex w-full justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-small text-default-400">{t('pages.dashboard.projectTable.rowsPerPage')}</span>
              <Select
                size="sm"
                selectedKeys={[rowsPerPage.toString()]}
                onSelectionChange={(keys) => {
                  const selectedValue = Array.from(keys)[0];
                  setRowsPerPage(Number(selectedValue));
                  setPage(1);
                }}
                className="w-20"
                placeholder="Select"
              >
                <SelectItem key="5" value="5">5</SelectItem>
                <SelectItem key="10" value="10">10</SelectItem>
                <SelectItem key="15" value="15">15</SelectItem>
              </Select>
            </div>
            <Pagination
              isCompact
              showControls
              color="primary"
              page={page}
              total={pages}
              onChange={setPage}
              classNames={{
                wrapper: "gap-0",
                item: "bg-transparent text-default-600 hover:bg-default-100 dark:hover:bg-default-800 min-w-8 w-8 h-8",
                cursor: "bg-primary-500 text-white font-medium"
              }}
            />
          </div>
        }
        classNames={{
          wrapper: "min-h-[400px] bg-[#e4e3e8] dark:bg-content1 shadow-sm",
        }}
      >
        <TableHeader>
          <TableColumn key="favorite" width="60px">{t('pages.dashboard.projectTable.columns.favorite')}</TableColumn>
          <TableColumn key="name">{t('pages.dashboard.projectTable.columns.projectName')}</TableColumn>
          <TableColumn key="client">{t('pages.dashboard.projectTable.columns.client')}</TableColumn>
          <TableColumn key="status">{t('pages.dashboard.projectTable.columns.status')}</TableColumn>
          <TableColumn key="startDate">{t('pages.dashboard.projectTable.columns.startDate')}</TableColumn>
          <TableColumn key="endDate">{t('pages.dashboard.projectTable.columns.endDate')}</TableColumn>
          <TableColumn key="budget">{t('pages.dashboard.projectTable.columns.budget')}</TableColumn>
          <TableColumn key="actions" width="160px">{t('pages.dashboard.projectTable.columns.actions')}</TableColumn>
        </TableHeader>
        <TableBody
          items={items}
          emptyContent={t('pages.dashboard.projectTable.noProjectsFound')}
        >
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Modal de confirmação de delete */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={onDeleteModalOpenChange}
        title={t('pages.dashboard.projectTable.deleteModal.title')}
        description={
          projectToDelete ? (
            <div className="space-y-2">
              <p className="text-default-600" dangerouslySetInnerHTML={{
                __html: t('pages.dashboard.projectTable.deleteModal.description', { name: projectToDelete.name })
              }} />
              <p className="text-sm text-default-500">
                {t('pages.dashboard.projectTable.deleteModal.warning')}
              </p>
            </div>
          ) : null
        }
        confirmText={isDeleting ? t('pages.dashboard.projectTable.deleteModal.deleting') : t('pages.dashboard.projectTable.deleteModal.delete')}
        cancelText={t('pages.dashboard.projectTable.deleteModal.cancel')}
        confirmColor="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
