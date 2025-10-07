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
  DatePicker,
  Select,
  SelectItem
} from "@heroui/react";
import { Icon } from "@iconify/react";

// Sample project data
const projects = [
  { 
    id: 1, 
    name: "Website Redesign", 
    client: "Tech Solutions Inc.", 
    status: "Em Progresso", 
    startDate: "2023-10-15", 
    endDate: "2024-01-30", 
    budget: "R$ 45.000"
  },
  { 
    id: 2, 
    name: "Mobile App Development", 
    client: "Fitness Connect", 
    status: "Finalizado", 
    startDate: "2023-08-01", 
    endDate: "2023-12-20", 
    budget: "R$ 75.000"
  },
  { 
    id: 3, 
    name: "E-commerce Platform", 
    client: "Fashion Outlet", 
    status: "Aprovado", 
    startDate: "2024-01-10", 
    endDate: "2024-06-30", 
    budget: "R$ 120.000"
  },
  { 
    id: 4, 
    name: "CRM Integration", 
    client: "Global Services", 
    status: "Em Progresso", 
    startDate: "2023-11-05", 
    endDate: "2024-02-28", 
    budget: "R$ 35.000"
  },
  { 
    id: 5, 
    name: "Data Analytics Dashboard", 
    client: "Market Insights", 
    status: "Finalizado", 
    startDate: "2023-09-15", 
    endDate: "2024-01-15", 
    budget: "R$ 60.000"
  },
  { 
    id: 6, 
    name: "Social Media Campaign", 
    client: "Urban Brands", 
    status: "Aprovado", 
    startDate: "2024-02-01", 
    endDate: "2024-04-30", 
    budget: "R$ 25.000"
  },
  { 
    id: 7, 
    name: "SEO Optimization", 
    client: "Local Business", 
    status: "Em Progresso", 
    startDate: "2024-01-20", 
    endDate: "2024-03-20", 
    budget: "R$ 15.000"
  },
  { 
    id: 8, 
    name: "Brand Identity Redesign", 
    client: "Startup Ventures", 
    status: "Finalizado", 
    startDate: "2023-07-10", 
    endDate: "2023-11-10", 
    budget: "R$ 40.000"
  },
];

const statusColorMap = {
  "Em Progresso": "primary",
  "Finalizado": "success",
  "Aprovado": "secondary",
};

export function ProjectTable() {
  const [filterValue, setFilterValue] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [dateRange, setDateRange] = React.useState({ start: null, end: null });

  // Filter projects based on search, status, and date
  const filteredProjects = React.useMemo(() => {
    let filtered = [...projects];
    
    // Filter by search term
    if (filterValue) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        project.client.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(project => project.status === statusFilter);
    }
    
    // Filter by date range
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(project => {
        const projectStart = new Date(project.startDate);
        return projectStart >= dateRange.start && projectStart <= dateRange.end;
      });
    }
    
    return filtered;
  }, [filterValue, statusFilter, dateRange]);

  // Pagination
  const pages = Math.ceil(filteredProjects.length / rowsPerPage);
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

  const onDateRangeChange = (range) => {
    setDateRange(range);
    setPage(1);
  };

  const onRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  const renderCell = (project, columnKey) => {
    const cellValue = project[columnKey];

    switch (columnKey) {
      case "status":
        return (
          <Chip 
            color={statusColorMap[project.status]} 
            variant="flat"
            size="sm"
          >
            {project.status}
          </Chip>
        );
      case "actions":
        return (
          <div className="flex items-center gap-2">
            <Button isIconOnly size="sm" variant="light">
              <Icon icon="lucide:eye" className="text-lg" />
            </Button>
            <Button isIconOnly size="sm" variant="light">
              <Icon icon="lucide:edit-2" className="text-lg" />
            </Button>
          </div>
        );
      default:
        return cellValue;
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Histórico de Projetos</div>
      
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <Input
          isClearable
          className="w-full md:max-w-xs"
          placeholder="Buscar por nome ou cliente..."
          startContent={<Icon icon="lucide:search" />}
          value={filterValue}
          onValueChange={onSearchChange}
        />
        
        <Dropdown>
          <DropdownTrigger>
            <Button 
              variant="flat" 
              endContent={<Icon icon="lucide:chevron-down" />}
            >
              Status: {statusFilter === "all" ? "Todos" : statusFilter}
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Status Filter"
            onAction={(key) => onStatusFilterChange(key)}
            selectedKeys={[statusFilter]}
            selectionMode="single"
          >
            <DropdownItem key="all">Todos</DropdownItem>
            <DropdownItem key="Em Progresso">Em Progresso</DropdownItem>
            <DropdownItem key="Finalizado">Finalizado</DropdownItem>
            <DropdownItem key="Aprovado">Aprovado</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        
        <div className="flex items-center gap-2">
          <DatePicker 
            label="Data Inicial"
            placeholder="Selecione"
            className="w-full md:w-auto"
            onChange={(date) => onDateRangeChange({ ...dateRange, start: date })}
          />
          <DatePicker 
            label="Data Final"
            placeholder="Selecione"
            className="w-full md:w-auto"
            onChange={(date) => onDateRangeChange({ ...dateRange, end: date })}
          />
        </div>
      </div>
      
      {/* Table */}
      <Table
        aria-label="Tabela de Projetos"
        bottomContent={
          <div className="flex w-full justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-small text-default-400">Linhas por página:</span>
              <Select 
                size="sm"
                value={rowsPerPage.toString()}
                onChange={onRowsPerPageChange}
                className="w-20"
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
          wrapper: "min-h-[400px]",
        }}
      >
        <TableHeader>
          <TableColumn key="name">NOME DO PROJETO</TableColumn>
          <TableColumn key="client">CLIENTE</TableColumn>
          <TableColumn key="status">STATUS</TableColumn>
          <TableColumn key="startDate">DATA INÍCIO</TableColumn>
          <TableColumn key="endDate">DATA FIM</TableColumn>
          <TableColumn key="budget">ORÇAMENTO</TableColumn>
          <TableColumn key="actions">AÇÕES</TableColumn>
        </TableHeader>
        <TableBody 
          items={items}
          emptyContent="Nenhum projeto encontrado"
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
    </div>
  );
}