import React from "react";
import {Select, SelectItem, Card, CardBody, Progress, Avatar, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "@heroui/use-theme";
import { PieChart } from "@mui/x-charts/PieChart";
import { Gauge } from "@mui/x-charts/Gauge";
import { ProjectsYearComparison } from "../components/charts/ProjectsYearComparison";
import ScrollVelocity from "../components/ScrollVelocity";

export default function Statistics() {
  const { theme } = useTheme();
  const [year, setYear] = React.useState(2025);

  const years = [2025, 2024, 2023, 2022, 2021];

  // Objetivo anual (valor máximo) por ano: números aleatórios > 20000
  // organizados por ordem crescente (2021 menor, 2025 maior)
  const objectiveMaxByYear = React.useMemo(() => {
    const min = 20001;
    const max = 50000;
    const generate = () => Math.floor(Math.random() * (max - min + 1)) + min;
    const valuesAsc = Array.from({ length: years.length }, generate).sort((a, b) => a - b);
    const yearsAsc = [...years].sort((a, b) => a - b);
    return yearsAsc.reduce((acc, y, idx) => {
      acc[y] = valuesAsc[idx];
      return acc;
    }, {});
  }, [years]);
  const objectiveMax = objectiveMaxByYear[year];

  const formatEUR = (value) =>
    new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

  // Mock data per year
  const dataByYear = {
    2025: {
      objectivePct: 72,
      newClients: 12,
      newClientsNames: [
        "Fashion Outlet",
        "Lisbon Municipality",
        "Luxury Hotel Chain",
        "Hotel Marquês de Pombal",
        "City Council",
        "Centro Colombo",
        "Gourmet Restaurant",
        "Tech Company HQ",
      ],
      wonRatePct: 68,
      totalWonBudget: 145_675,
      simuLogoSplit: { logo: 55, simu: 45 },
      topClients: [
        { name: "Fashion Outlet", projects: 5, value: 25000 },
        { name: "Lisbon Municipality", projects: 4, value: 22000 },
        { name: "Luxury Hotel Chain", projects: 4, value: 20000 },
        { name: "Hotel Marquês de Pombal", projects: 3, value: 16000 },
        { name: "City Council", projects: 3, value: 14000 },
        { name: "Centro Comercial Colombo", projects: 2, value: 12000 },
        { name: "Gourmet Restaurant", projects: 2, value: 9000 },
        { name: "Tech Company HQ", projects: 2, value: 7000 },
      ],
      topBudgets: [
        { name: "Christmas Shopping Mall", value: 40000 },
        { name: "Street Light Poles", value: 32000 },
        { name: "Hotel Entrance", value: 25000 },
        { name: "Shopping Center Entrance", value: 18000 },
        { name: "City Hall Decoration", value: 12000 },
      ],
      recent: [
        { date: "2025-10-10", client: "Christmas Outlet", value: 15000, status: "Finished" },
        { date: "2025-09-21", client: "City Council", value: 12000, status: "Approved" },
        { date: "2025-08-05", client: "Tech Company HQ", value: 3000, status: "In Queue" },
      ],
    },
    2024: {
      objectivePct: 60,
      newClients: 11,
      newClientsNames: [
        "North Mall",
        "City Council",
        "Tech Company HQ",
        "Airport Lounge",
        "Retail Park",
        "Museum Hall",
        "Town Square",
      ],
      wonRatePct: 62,
      totalWonBudget: 126_700,
      simuLogoSplit: { logo: 52, simu: 48 },
      topClients: [
        { name: "Fashion Outlet", projects: 4, value: 21000 },
        { name: "Lisbon Municipality", projects: 4, value: 20000 },
        { name: "Luxury Hotel Chain", projects: 3, value: 18000 },
        { name: "Hotel Marquês de Pombal", projects: 3, value: 14000 },
        { name: "City Council", projects: 3, value: 12000 },
        { name: "Centro Comercial Colombo", projects: 2, value: 10000 },
        { name: "Gourmet Restaurant", projects: 2, value: 8000 },
        { name: "Tech Company HQ", projects: 2, value: 6000 },
      ],
      topBudgets: [
        { name: "Retail Park Entrance", value: 32000 },
        { name: "City Avenue Lights", value: 27000 },
        { name: "Airport Lounge", value: 21000 },
        { name: "Museum Hall", value: 16000 },
        { name: "Town Square", value: 9000 },
      ],
      recent: [
        { date: "2024-11-03", client: "North Mall", value: 10000, status: "Finished" },
        { date: "2024-09-18", client: "City Council", value: 8000, status: "Approved" },
        { date: "2024-07-02", client: "Tech Company HQ", value: 2500, status: "In Queue" },
      ],
    },
    2023: {
      objectivePct: 58,
      newClients: 10,
      newClientsNames: [
        "Harbor Co.",
        "City Council",
        "Boutique Hotel",
        "University Atrium",
        "Corporate Office",
        "Suburban Park",
      ],
      wonRatePct: 64,
      totalWonBudget: 132_300,
      simuLogoSplit: { logo: 50, simu: 50 },
      topClients: [
        { name: "Fashion Outlet", projects: 3, value: 19000 },
        { name: "Lisbon Municipality", projects: 3, value: 17500 },
        { name: "Luxury Hotel Chain", projects: 3, value: 16000 },
        { name: "Hotel Marquês de Pombal", projects: 2, value: 12000 },
        { name: "City Council", projects: 2, value: 10000 },
        { name: "Centro Comercial Colombo", projects: 2, value: 9000 },
        { name: "Gourmet Restaurant", projects: 2, value: 7000 },
        { name: "Tech Company HQ", projects: 1, value: 5000 },
      ],
      topBudgets: [
        { name: "University Atrium", value: 30000 },
        { name: "Harbor Promenade", value: 26000 },
        { name: "Boutique Hotel Lobby", value: 20000 },
        { name: "Corporate Office", value: 14000 },
        { name: "Suburban Park", value: 10000 },
      ],
      recent: [
        { date: "2023-10-20", client: "Harbor Co.", value: 12000, status: "Finished" },
        { date: "2023-09-05", client: "City Council", value: 7000, status: "Approved" },
        { date: "2023-06-14", client: "Boutique Hotel", value: 3000, status: "In Queue" },
      ],
    },
    2022: {
      objectivePct: 54,
      newClients: 8,
      newClientsNames: [
        "City Park",
        "Tech Campus",
        "Town Hall",
        "Shopping Gallery",
        "Metro Station",
      ],
      wonRatePct: 57,
      totalWonBudget: 98_900,
      simuLogoSplit: { logo: 47, simu: 53 },
      topClients: [
        { name: "Fashion Outlet", projects: 3, value: 16000 },
        { name: "Lisbon Municipality", projects: 3, value: 15000 },
        { name: "Luxury Hotel Chain", projects: 2, value: 14000 },
        { name: "Hotel Marquês de Pombal", projects: 2, value: 11000 },
        { name: "City Council", projects: 2, value: 9000 },
        { name: "Centro Comercial Colombo", projects: 2, value: 8000 },
        { name: "Gourmet Restaurant", projects: 1, value: 6000 },
        { name: "Tech Company HQ", projects: 1, value: 4000 },
      ],
      topBudgets: [
        { name: "Shopping Gallery", value: 22000 },
        { name: "City Park", value: 19000 },
        { name: "Tech Campus", value: 15000 },
        { name: "Metro Station", value: 9000 },
        { name: "Town Hall", value: 7000 },
      ],
      recent: [
        { date: "2022-10-02", client: "City Park", value: 9000, status: "Finished" },
        { date: "2022-08-17", client: "Tech Campus", value: 6000, status: "Approved" },
        { date: "2022-05-03", client: "Town Hall", value: 2000, status: "In Queue" },
      ],
    },
    2021: {
      objectivePct: 49,
      newClients: 7,
      newClientsNames: [
        "Business Park",
        "City Museum",
        "Community Center",
        "Old Town",
        "City Museum Annex",
      ],
      wonRatePct: 52,
      totalWonBudget: 87_250,
      simuLogoSplit: { logo: 44, simu: 56 },
      topClients: [
        { name: "Fashion Outlet", projects: 2, value: 14000 },
        { name: "Lisbon Municipality", projects: 2, value: 13000 },
        { name: "Luxury Hotel Chain", projects: 2, value: 12000 },
        { name: "Hotel Marquês de Pombal", projects: 2, value: 9000 },
        { name: "City Council", projects: 2, value: 8000 },
        { name: "Centro Comercial Colombo", projects: 1, value: 7000 },
        { name: "Gourmet Restaurant", projects: 1, value: 5000 },
        { name: "Tech Company HQ", projects: 1, value: 3500 },
      ],
      topBudgets: [
        { name: "Business Park", value: 21000 },
        { name: "Old Town", value: 16000 },
        { name: "City Museum", value: 12000 },
        { name: "River Walk", value: 8000 },
        { name: "Community Center", value: 6000 },
      ],
      recent: [
        { date: "2021-09-29", client: "Business Park", value: 8000, status: "Finished" },
        { date: "2021-08-12", client: "City Museum", value: 5000, status: "Approved" },
        { date: "2021-05-23", client: "Community Center", value: 1500, status: "In Queue" },
      ],
    },
  };

  const current = dataByYear[year];
  const lastYear = dataByYear[year - 1] || current;
  const newClientsDelta = Math.round(((current.newClients - lastYear.newClients) / lastYear.newClients) * 100);
  const budgetDelta = Math.round(((current.totalWonBudget - lastYear.totalWonBudget) / lastYear.totalWonBudget) * 100);

  const maxBudget = Math.max(...current.topBudgets.map((b) => b.value));

  return (
      <div className="flex-1 min-h-0 overflow-auto p-6">
      {/* Header with greeting and year filter */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hello, Christopher</h1>
          <p className="text-default-500 mt-2">Your progress. Your data. Your success.</p>
        </div>
        <Select
          aria-label="Select year"
          selectedKeys={new Set([String(year)])}
          onSelectionChange={(keys) => {
            const selected = Number(Array.from(keys)[0]);
            setYear(selected);
          }}
          className="w-32"
          size="sm"
          renderValue={(items) => items && items.size > 0 ? Array.from(items)[0].textValue : String(year)}
        >
          {years.map((y) => (
            <SelectItem key={String(y)} value={String(y)}>{y}</SelectItem>
          ))}
        </Select>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 items-stretch">

        {/* This Year Objective */}
        <Card className="bg-content1 border border-divider h-full">
          <CardBody className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">This Year Objective</div>
                <div className="text-3xl font-bold mt-1">{current.objectivePct}%</div>
                <div className="text-xs text-default-500">of annual target</div>
              </div>
              <Icon icon="lucide:target" className="text-primary text-3xl" />
            </div>
            <Progress aria-label="Objective progress" value={current.objectivePct} className="mt-3" color="primary" />
            <div className="flex items-center justify-between text-xs text-default-500 mt-3 border-t border-divider pt-2">
              <span>0</span>
              <span>{objectiveMax?.toLocaleString()}</span>
            </div>
          </CardBody>
        </Card>

        {/* New Clients */}
        <Card className="bg-content1 border border-divider h-full">
          <CardBody className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">New Clients</div>
                <div className="text-3xl font-bold mt-1">{current.newClients}</div>
                <div className="text-xs text-default-500">new clients</div>
              </div>
              <Icon icon="lucide:users" className="text-warning text-3xl" />
            </div>
            <div className="text-success text-xs mt-2 flex items-center gap-1">
              <Icon icon="lucide:arrow-up-right" /> +{newClientsDelta}% vs {year - 1}
            </div>
            {/* Ticker de novos clientes com Motion */}
            {current.newClientsNames && current.newClientsNames.length > 0 && (
              <div className="mt-3 border-t border-divider pt-2">
                <ScrollVelocity
                  texts={[" "]}
                  items={current.newClientsNames}
                  itemGap={32}
                  itemClassName="text-xs text-default-500"
                  velocity={30}
                  numCopies={2}
                  parallaxStyle={{ height: 24 }}
                  scrollerStyle={{ fontSize: "0.75rem", lineHeight: "1rem" }}
                />
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Masonry-like unified grid to avoid inner gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 grid-flow-row-dense gap-6 items-stretch">
        {/* Bar Chart */}
        <Card className="bg-content1 border border-divider lg:col-span-5 h-full">
          <CardBody className="p-5 h-full flex flex-col">
            <div className="mb-2">
              <div className="text-sm font-semibold text-foreground">This Year vs Last Year</div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <ProjectsYearComparison currentYear={year} comparisonYear={year - 1} compact />
            </div>
          </CardBody>
        </Card>

        {/* Gauge: Won Projects % */}
        <Card className="bg-content1 border border-divider lg:col-span-3 h-full">
          <CardBody className="p-5 h-full flex flex-col">
            <div className="text-sm font-semibold text-foreground mb-2">% Won Projects</div>
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <Gauge
                  value={current.wonRatePct}
                  width={240}
                  height={240}
                  startAngle={-130}
                  endAngle={130}
                  innerRadius="60%"
                  outerRadius="90%"
                  cornerRadius={8}
                  sx={{ "& text": { display: "none" } }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl md:text-5xl font-extrabold" style={{ transform: "translateY(6px)" }}>{current.wonRatePct}%</div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Total Budget */}
        <Card className="bg-content1 border border-divider lg:col-span-4 h-full">
          <CardBody className="p-5 h-full flex flex-col">
            <div className="text-sm font-semibold text-foreground mb-2">Won Projects Total Budget</div>
            <div className="text-4xl md:text-5xl font-extrabold tracking-tight">{formatEUR(current.totalWonBudget)}</div>
            <div className="text-success text-xs mt-3 flex items-center gap-1 mt-auto">
              <Icon icon="lucide:arrow-up-right" /> +{budgetDelta}% last year
            </div>
          </CardBody>
        </Card>

        {/* Top Clients */}
        <Card className="bg-content1 border border-divider lg:col-span-6">
          <CardBody className="p-5">
            <div className="text-sm font-semibold text-foreground mb-4">TOP Clients</div>
            <div className="space-y-4">
              {current.topClients
                .slice()
                .sort((a, b) => b.projects - a.projects)
                .slice(0, 6)
                .map((client) => {
                  const pct = Math.round((client.projects / Math.max(...current.topClients.map((c) => c.projects))) * 100);
                  const initials = client.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <div key={client.name}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="shrink-0" name={client.name} size="sm">
                            {initials}
                          </Avatar>
                          <div className="truncate">
                            <div className="truncate text-foreground">{client.name}</div>
                            <div className="text-xs text-default-500">{client.projects} projects</div>
                          </div>
                        </div>
                      </div>
                      <Progress aria-label={client.name} value={pct} className="mt-2 h-2" color="primary" />
                    </div>
                  );
                })}
            </div>
          </CardBody>
        </Card>

        {/* Top 5 Budgets */}
        <Card className="bg-content1 border border-divider lg:col-span-6">
          <CardBody className="p-5">
            <div className="text-sm font-semibold mb-4">TOP 5 Highest Budget Projects</div>
            <div className="space-y-4">
              {current.topBudgets.map((item) => {
                const pct = Math.round((item.value / maxBudget) * 100);
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="truncate pr-3">{item.name}</div>
                      <div className="text-default-600">{formatEUR(item.value)}</div>
                    </div>
                    <Progress aria-label={item.name} value={pct} className="h-2" color="primary" />
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* SIMU/LOGO Pie */}
        <Card className="bg-content1 border border-divider lg:col-span-4">
          <CardBody className="p-5">
            <div className="text-sm font-semibold mb-4">SIMU/LOGO</div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <PieChart
                  series={[
                    {
                      data: [
                        { id: 0, value: current.simuLogoSplit.logo, label: "LOGO" },
                        { id: 1, value: current.simuLogoSplit.simu, label: "SIMU" },
                      ],
                      innerRadius: 50,
                      outerRadius: 90,
                      cornerRadius: 6,
                      arcLabel: () => "",
                      highlightScope: { faded: "global", highlighted: "item" },
                      valueFormatter: (v) => `${v.value}%`,
                    },
                  ]}
                  colors={[theme === "dark" ? "#F5A524" : "#F5A524", theme === "dark" ? "#8B5CF6" : "#8B5CF6"]}
                  width={260}
                  height={260}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-3xl font-semibold">{current.simuLogoSplit.logo}%</div>
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: "#F5A524" }}></span>
                <span>55% LOGO</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: "#8B5CF6" }}></span>
                <span>45% SIMU</span>
          </div>
        </div>
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-content1 border border-divider lg:col-span-8">
          <CardBody className="p-5">
            <div className="text-sm font-semibold mb-4">Recent Activity</div>
            <Table aria-label="Recent activity" removeWrapper className="min-w-full">
              <TableHeader>
                <TableColumn>Data</TableColumn>
                <TableColumn>Client</TableColumn>
                <TableColumn>Value (€)</TableColumn>
                <TableColumn>Status</TableColumn>
              </TableHeader>
              <TableBody>
                {current.recent.map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.client}</TableCell>
                    <TableCell>{formatEUR(r.value)}</TableCell>
                    <TableCell>
                      {r.status === "Finished" && <Chip size="sm" color="success" variant="flat">Finished</Chip>}
                      {r.status === "Approved" && <Chip size="sm" color="primary" variant="flat">Approved</Chip>}
                      {r.status === "In Queue" && <Chip size="sm" color="warning" variant="flat">In Queue</Chip>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
