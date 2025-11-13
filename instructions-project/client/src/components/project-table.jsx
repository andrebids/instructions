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
import { projectsAPI } from "../services/api.js";
import ConfirmModal from "./common/ConfirmModal.jsx";
import { SyncStatus } from "./SyncStatus";

// Status mapping from API to UI
const statusColorMap = {
  "created": "default",
  "in_progress": "primary",
  "finished": "success",
  "approved": "secondary",
  "cancelled": "danger",
  "in_queue": "warning",
};

const statusLabelMap = {
  "created": "Created",
  "in_progress": "In Progress",
  "finished": "Finished",
  "approved": "Approved",
  "cancelled": "Cancelled",
  "in_queue": "In Queue",
};

export function ProjectTable({ projects: apiProjects = [], onProjectsUpdate, onProjectDeleted }) {
  const navigate = useNavigate();
  
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
            title={project.isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-label={project.isFavorite ? "Remove from favorites" : "Add to favorites"}
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
        return (
          <Chip 
            color={statusColorMap[project.status] || "default"} 
            variant="flat"
            size="sm"
          >
            {statusLabelMap[project.status] || project.status}
          </Chip>
        );
      case "actions":
        return (
          <div className="flex items-center gap-2">
            <Button 
              isIconOnly 
              size="sm" 
              variant="light" 
              title="View notes" 
              aria-label="View notes"
              onPress={() => navigate(`/projects/${project.id}/notes`)}
            >
              <Icon icon="lucide:file-text" className="text-lg" />
            </Button>
            <Button isIconOnly size="sm" variant="light" title="View project" aria-label="View project">
              <Icon icon="lucide:eye" className="text-lg" />
            </Button>
            <Button 
              isIconOnly 
              size="sm" 
              variant="light" 
              title="Edit project" 
              aria-label="Edit project"
              onPress={() => navigate(`/projects/${project.id}/edit`)}
            >
              <Icon icon="lucide:edit-2" className="text-lg" />
            </Button>
            <Button 
              isIconOnly 
              size="sm" 
              variant="light" 
              title="Delete project" 
              aria-label="Delete project"
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
  }, [handleToggleFavorite, navigate]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-xl font-semibold">Project History ({projects.length} projects)</div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <Input
          isClearable
          className="w-full md:max-w-xs"
            classNames={{
              inputWrapper: "bg-[#e4e3e8] dark:bg-content1 shadow-sm"
            }}
          placeholder="Search by name or client..."
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
              Status: {statusFilter === "all" ? "All" : statusFilter}
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Status Filter"
            onAction={(key) => onStatusFilterChange(key)}
            selectedKeys={[statusFilter]}
            selectionMode="single"
          >
            <DropdownItem key="all">All</DropdownItem>
            <DropdownItem key="created">Created</DropdownItem>
            <DropdownItem key="in_progress">In Progress</DropdownItem>
            <DropdownItem key="finished">Finished</DropdownItem>
            <DropdownItem key="approved">Approved</DropdownItem>
            <DropdownItem key="cancelled">Cancelled</DropdownItem>
            <DropdownItem key="in_queue">In Queue</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger>
            <Button 
              variant="flat" 
              className="bg-[#e4e3e8] dark:bg-content1 shadow-sm"
              endContent={<Icon icon="lucide:chevron-down" />}
            >
              Favorites: {favoriteFilter === "all" ? "All" : favoriteFilter === "favorites" ? "Favorites" : "Non-favorites"}
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Favorite Filter"
            onAction={(key) => onFavoriteFilterChange(key)}
            selectedKeys={[favoriteFilter]}
            selectionMode="single"
          >
            <DropdownItem key="all">All</DropdownItem>
            <DropdownItem key="favorites">Favorites</DropdownItem>
            <DropdownItem key="non-favorites">Non-favorites</DropdownItem>
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
                {dateRange.start ? new Date(dateRange.start).toLocaleDateString() : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                aria-label="Start Date"
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
                {dateRange.end ? new Date(dateRange.end).toLocaleDateString() : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                aria-label="End Date"
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
          Clear filters
        </Button>
      </div>
      
      {/* Table */}
      <Table
        aria-label="Project Table"
        bottomContent={
          <div className="flex w-full justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-small text-default-400">Rows per page:</span>
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
              showShadow
              color="primary"
              page={page}
              total={pages}
              onChange={setPage}
            />
          </div>
        }
        classNames={{
          wrapper: "min-h-[400px] bg-[#e4e3e8] dark:bg-content1 shadow-sm",
        }}
      >
        <TableHeader>
          <TableColumn key="favorite" width="60px">FAVORITE</TableColumn>
          <TableColumn key="name">PROJECT NAME</TableColumn>
          <TableColumn key="client">CLIENT</TableColumn>
          <TableColumn key="status">STATUS</TableColumn>
          <TableColumn key="startDate">START DATE</TableColumn>
          <TableColumn key="endDate">END DATE</TableColumn>
          <TableColumn key="budget">BUDGET</TableColumn>
          <TableColumn key="actions" width="160px">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody 
          items={items}
          emptyContent="No projects found"
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
        title="Confirm Deletion"
        description={
          projectToDelete ? (
            <div className="space-y-2">
              <p className="text-default-600">
                Are you sure you want to delete the project <strong>{projectToDelete.name}</strong>?
              </p>
              <p className="text-sm text-default-500">
                This action cannot be undone. All data related to this project will be permanently removed.
              </p>
            </div>
          ) : null
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
