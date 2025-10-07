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
    status: "In Progress", 
    startDate: "2023-10-15", 
    endDate: "2024-01-30", 
    budget: "$ 45,000"
  },
  { 
    id: 2, 
    name: "Mobile App Development", 
    client: "Fitness Connect", 
    status: "Finished", 
    startDate: "2023-08-01", 
    endDate: "2023-12-20", 
    budget: "$ 75,000"
  },
  { 
    id: 3, 
    name: "E-commerce Platform", 
    client: "Fashion Outlet", 
    status: "Approved", 
    startDate: "2024-01-10", 
    endDate: "2024-06-30", 
    budget: "$ 120,000"
  },
  // ... more projects
];

const statusColorMap = {
  "In Progress": "primary",
  "Finished": "success",
  "Approved": "secondary",
};

export function ProjectTable() {
  const [filterValue, setFilterValue] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [dateRange, setDateRange] = React.useState({ start: null, end: null });

  // Debounce search using React 18's concurrent rendering hint
  const deferredFilterValue = React.useDeferredValue(filterValue);

  const clearFilters = () => {
    setFilterValue("");
    setStatusFilter("all");
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
  }, [deferredFilterValue, statusFilter, dateRange]);

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
      <div className="text-xl font-semibold">Project History</div>
      
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <Input
          isClearable
          className="w-full md:max-w-xs"
          placeholder="Search by name or client..."
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
            <DropdownItem key="In Progress">In Progress</DropdownItem>
            <DropdownItem key="Finished">Finished</DropdownItem>
            <DropdownItem key="Approved">Approved</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        
        <div className="flex items-center gap-2">
          <DatePicker 
            label="Start Date"
            placeholder="Select"
            className="w-full md:w-auto"
            onChange={(date) => onDateRangeChange({ ...dateRange, start: date })}
          />
          <DatePicker 
            label="End Date"
            placeholder="Select"
            className="w-full md:w-auto"
            onChange={(date) => onDateRangeChange({ ...dateRange, end: date })}
          />
        </div>

        <Button variant="light" onPress={clearFilters} className="md:ml-auto">
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
          <TableColumn key="name">PROJECT NAME</TableColumn>
          <TableColumn key="client">CLIENT</TableColumn>
          <TableColumn key="status">STATUS</TableColumn>
          <TableColumn key="startDate">START DATE</TableColumn>
          <TableColumn key="endDate">END DATE</TableColumn>
          <TableColumn key="budget">BUDGET</TableColumn>
          <TableColumn key="actions">ACTIONS</TableColumn>
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
    </div>
  );
}
