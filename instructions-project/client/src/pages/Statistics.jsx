import React from "react";
import {Select, SelectItem, Card, CardBody, Progress, Avatar, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "@heroui/use-theme";
import { Gauge } from "@mui/x-charts/Gauge";
import { ProjectsYearComparison } from "../components/charts/ProjectsYearComparison";
import ScrollVelocity from "../components/ui/ScrollVelocity";
import CountUp from "../components/ui/CountUp";
import { AIAssistantChat } from "../components/features/ai-assistant-chat";
import { motion, AnimatePresence } from "framer-motion";
import { PageTitle } from "../components/layout/page-title";
import { useUser } from "../context/UserContext";
import { useResponsiveProfile } from "../hooks/useResponsiveProfile";
import { Scroller } from "../components/ui/scroller";

export default function Statistics() {
  const { userName } = useUser();
  const { theme } = useTheme();
  const [year, setYear] = React.useState(2025);
  const [isOpen, setIsOpen] = React.useState(false);
  const { isHandheld } = useResponsiveProfile();

  const years = [2025, 2024, 2023, 2022, 2021];

  // Objetivo anual (valor máximo) por ano: gerar uma vez (ordenado, 2021 menor → 2025 maior) e persistir em localStorage
  const objectiveStorageKey = "objectiveMaxByYear_v1";
  const [objectiveMaxByYear] = React.useState(() => {
    try {
      const raw = localStorage.getItem(objectiveStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Se todos os anos existirem, reutiliza
        if (parsed && years.every((y) => typeof parsed[y] === "number")) {
          return parsed;
        }
      }
    } catch (_) { /* ignore parse errors and regenerate */ }

    const min = 20001;
    const max = 50000;
    const generate = () => Math.floor(Math.random() * (max - min + 1)) + min;
    const valuesAsc = Array.from({ length: years.length }, generate).sort((a, b) => a - b);
    const yearsAsc = [...years].sort((a, b) => a - b);
    const generated = yearsAsc.reduce((acc, y, idx) => {
      acc[y] = valuesAsc[idx];
      return acc;
    }, {});
    try { localStorage.setItem(objectiveStorageKey, JSON.stringify(generated)); } catch (_) {}
    return generated;
  });
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
      totalWonBudget: 145675,
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
      totalWonBudget: 126700,
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
      totalWonBudget: 132300,
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
      totalWonBudget: 98900,
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
      totalWonBudget: 87250,
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
  const wonRateDelta = current.wonRatePct - lastYear.wonRatePct;

  // Projects totals for YoY text (keep in sync with chart component)
  const projectsTotals = { 2025: 15471, 2024: 12456, 2023: 22567, 2022: 9874, 2021: 13457 };
  const currentProjectsTotal = projectsTotals[year] ?? 0;
  const lastYearProjectsTotal = projectsTotals[year - 1] ?? 0;
  const projectsDeltaPct = lastYearProjectsTotal ? Math.round(((currentProjectsTotal - lastYearProjectsTotal) / lastYearProjectsTotal) * 100) : 0;

  // Chat toggle handled locally, no scroll listeners needed

  // Objective helpers
  const objectiveReached = Math.round((objectiveMax * current.objectivePct) / 100);
  const objectiveRemaining = Math.max(0, objectiveMax - objectiveReached);

  // Top clients insight
  const top3Revenue = current.topClients
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .reduce((sum, c) => sum + c.value, 0);
  const top3Pct = Math.min(100, Math.round((top3Revenue / current.totalWonBudget) * 100));

  // Client industries mapping
  const clientIndustries = {
    "Fashion Outlet": "Retail",
    "Lisbon Municipality": "Public Sector",
    "Luxury Hotel Chain": "Hospitality",
    "Hotel Marquês de Pombal": "Hospitality",
    "City Council": "Public Sector",
    "Centro Comercial Colombo": "Retail",
    "Gourmet Restaurant": "Hospitality",
    "Tech Company HQ": "Technology",
  };
  const getIndustryColor = (industry) => {
    const colors = {
      "Retail": "primary",
      "Hospitality": "secondary",
      "Public Sector": "warning",
      "Technology": "success",
    };
    return colors[industry] || "default";
  };

  // Recent summary
  const recentCount = current.recent.length;
  const recentSum = current.recent.reduce((s, r) => s + r.value, 0);
  const getQuarter = (isoDate) => {
    const m = new Date(isoDate).getMonth() + 1;
    return Math.floor((m - 1) / 3) + 1;
  };
  const recentQuarter = current.recent[0] ? getQuarter(current.recent[0].date) : 4;
  const statusOrder = ["Finished", "Approved", "In Queue"];
  const statusColors = { Finished: "#17C964", Approved: "#006FEE", "In Queue": "#F5A524" };
  const statusCounts = current.recent.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, { Finished: 0, Approved: 0, "In Queue": 0 });
  const avgRecent = Math.round(recentSum / Math.max(1, recentCount));
  const maxRecent = current.recent.length ? Math.max(...current.recent.map((r) => r.value)) : 0;
  const topRecent = current.recent.slice().sort((a, b) => b.value - a.value).slice(0, 3);

  const maxBudget = Math.max(...current.topBudgets.map((b) => b.value));
  const top5Total = current.topBudgets.reduce((s, b) => s + b.value, 0);
  const top5Pct = Math.min(100, Math.round((top5Total / current.totalWonBudget) * 100));
  const avgDealSize = Math.round(top5Total / current.topBudgets.length);
  const segmentColors = ["#006FEE", "#17C964", "#F5A524", "#8B5CF6", "#F31260"]; // primary, success, warning, secondary, danger
  // Service mix helpers
  const logoPct = current.simuLogoSplit.logo;
  const simuPct = current.simuLogoSplit.simu;
  const logoYoY = logoPct - (lastYear?.simuLogoSplit?.logo ?? logoPct);
  const simuYoY = simuPct - (lastYear?.simuLogoSplit?.simu ?? simuPct);
  const leader = logoPct === simuPct ? null : (logoPct > simuPct ? 'LOGO' : 'SIMU');
  const leadBy = Math.abs(logoPct - simuPct);

  // Export helpers
  const csvEscape = (value) => {
    if (value == null) return "";
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleExportCSV = () => {
    const rows = [];
    rows.push(["Section","Metric","Value"].join(","));
    rows.push(["Overview","Year", year].join(","));
    rows.push(["Objective","Objective %", current.objectivePct].join(","));
    rows.push(["Objective","Objective Max", objectiveMax].join(","));
    rows.push(["Objective","Remaining Projects", objectiveRemaining].join(","));
    rows.push(["Clients","New Clients", current.newClients].join(","));
    rows.push(["Won","Win Rate %", current.wonRatePct].join(","));
    rows.push(["Budget","Total Won Budget", current.totalWonBudget].join(","));
    rows.push("");
    rows.push(["Top Clients","Projects","Value (€)"].join(","));
    current.topClients.forEach((c)=>{
      rows.push([csvEscape(c.name), c.projects, c.value].join(","));
    });
    rows.push("");
    rows.push(["Top Budgets","Budget (€)"].join(","));
    current.topBudgets.forEach((b)=>{
      rows.push([csvEscape(b.name), b.value].join(","));
    });
    rows.push("");
    rows.push(["Recent","Date","Client","Value (€)","Status"].join(","));
    current.recent.forEach((r)=>{
      rows.push([r.date, csvEscape(r.client), r.value, r.status].join(","));
    });
    const csvContent = "\ufeff" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics_${year}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Statistics ${year}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111}
        h1{margin:0 0 12px 0;font-size:20px}
        h2{margin:18px 0 8px 0;font-size:16px}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th,td{border:1px solid #ccc;padding:6px 8px;font-size:12px;text-align:left}
        small{color:#555}
      </style></head><body>
      <h1>Statistics ${year}</h1>
      <div><strong>Objective:</strong> ${current.objectivePct}% (${objectiveReached.toLocaleString()} of ${objectiveMax.toLocaleString()})</div>
      <div><strong>New Clients:</strong> ${current.newClients}</div>
      <div><strong>Win Rate:</strong> ${current.wonRatePct}%</div>
      <div><strong>Total Won Budget:</strong> ${formatEUR(current.totalWonBudget)}</div>
      <h2>Top Clients</h2>
      <table><thead><tr><th>Client</th><th>Projects</th><th>Value (€)</th></tr></thead><tbody>
      ${current.topClients.map(c=>`<tr><td>${c.name}</td><td>${c.projects}</td><td>${c.value.toLocaleString()}</td></tr>`).join('')}
      </tbody></table>
      <h2>Top Budgets</h2>
      <table><thead><tr><th>Project</th><th>Budget (€)</th></tr></thead><tbody>
      ${current.topBudgets.map(b=>`<tr><td>${b.name}</td><td>${b.value.toLocaleString()}</td></tr>`).join('')}
      </tbody></table>
      <h2>Recent</h2>
      <table><thead><tr><th>Date</th><th>Client</th><th>Value (€)</th><th>Status</th></tr></thead><tbody>
      ${current.recent.map(r=>`<tr><td>${r.date}</td><td>${r.client}</td><td>${r.value.toLocaleString()}</td><td>${r.status}</td></tr>`).join('')}
      </tbody></table>
      <p><small>Tip: Use your browser's Print dialog to "Save as PDF".</small></p>
      <script>window.onload=()=>{setTimeout(()=>window.print(),250)}</script>
    </body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const chatInitialMessages = [
    {
      id: "s1",
      content: "Hello! I'm the Analytics Assistant. I can help with this page's data. What would you like to analyze?",
      isUser: false,
      timestamp: new Date(Date.now() - 180000),
    },
    {
      id: "s2",
      content: "What's the win rate trend this year versus last year?",
      isUser: true,
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: "s3",
      content: `The current win rate is ${current.wonRatePct}% (${wonRateDelta >= 0 ? "+" : ""}${wonRateDelta} pp YoY). I can break it down by quarter if you like.`,
      isUser: false,
      timestamp: new Date(Date.now() - 115000),
    },
    {
      id: "s4",
      content: "And the total revenue from won projects?",
      isUser: true,
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: "s5",
      content: `Total won revenue: ${formatEUR(current.totalWonBudget)} (↑ ${budgetDelta}% vs ${year - 1}). Would you like me to export a quick report (CSV/PDF)?`,
      isUser: false,
      timestamp: new Date(Date.now() - 55000),
    },
  ];

    return (
      <Scroller className={`flex-1 min-h-0 p-6 ${isHandheld ? "pb-24" : "pb-6"}`} hideScrollbar>
      {/* Header with greeting and year filter */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <PageTitle title="Statistics" userName={userName} lead={`Your performance overview, ${userName}`} subtitle={"Here's how your year is shaping up so far."} meta={`Jan 1 – Oct 22, ${year}`} />
        </div>
        <div className="flex items-center gap-2">
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="flat" startContent={<Icon icon="lucide:file-output" />}>Export Report</Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Export format" onAction={(key)=>{ if(key==='csv') handleExportCSV(); if(key==='pdf') handleExportPDF(); }}>
              <DropdownItem key="csv" startContent={<Icon icon="lucide:file-down" />}>CSV (Excel)</DropdownItem>
              <DropdownItem key="pdf" startContent={<Icon icon="lucide:file-text" />}>PDF</DropdownItem>
            </DropdownMenu>
          </Dropdown>
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
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 items-stretch">

        {/* This Year Objective */}
        <Card className="bg-[#e4e3e8] dark:bg-content1 shadow-sm h-full">
          <CardBody className="p-5">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Icon icon="lucide:target" className="text-primary text-lg" />
              Annual Goal Tracker
            </div>
            <div className="text-3xl font-bold mt-3">{current.objectivePct}%</div>
            <div className="text-sm text-default-500 mt-1">of annual projects target reached</div>
            <Progress aria-label="Objective progress" value={current.objectivePct} className="mt-3" color="primary" />
            <div className="flex items-center justify-between text-xs text-default-500 mt-3 border-t border-divider pt-2">
              <span>0</span>
              <span>{objectiveMax?.toLocaleString()}</span>
            </div>
            <div className="text-xs text-default-500 mt-2">
              You're {Math.max(0, 100 - current.objectivePct)}% short of your annual target. Maintain current pace to exceed projections.
            </div>
            <div className="text-xs text-default-600 mt-1">
              Projected completion: {objectiveRemaining.toLocaleString()} projects remaining.
            </div>
          </CardBody>
        </Card>

        {/* New Clients */}
        <Card className="bg-[#e4e3e8] dark:bg-content1 shadow-sm h-full">
          <CardBody className="p-5">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Icon icon="lucide:users" className="text-primary text-lg" />
              New Clients Acquired
            </div>
            <div className="text-3xl font-bold mt-3">{current.newClients}</div>
            <div className="text-sm text-default-500 mt-1">{current.newClients} new clients this year.</div>
            <div className="text-success text-xs mt-2 flex items-center gap-1">
              <Icon icon="lucide:arrow-up-right" /> +{newClientsDelta}% vs {year - 1}
            </div>
            <div className="text-xs text-default-500 mt-1">Top sectors: Retail • Hospitality • Public Sector</div>
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
        <Card className="bg-[#e4e3e8] dark:bg-content1 shadow-sm lg:col-span-4 h-full">
          <CardBody className="p-5 h-full flex flex-col">
            <div className="mb-2">
              <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Icon icon="lucide:bar-chart-3" className="text-primary text-lg" />
                Year-over-Year Comparison
              </div>
              <div className="text-sm text-default-500 mt-1">
                +{projectsDeltaPct}% more projects vs {year - 1}. Consistent growth throughout the year.
              </div>
            </div>
            <div className="flex-1 flex items-center justify-start w-full">
              <ProjectsYearComparison currentYear={year} comparisonYear={year - 1} compact />
            </div>
            <div className="text-xs text-default-500 mt-2 border-t border-divider pt-2">
              {year} Total: {currentProjectsTotal.toLocaleString()} projects | {year - 1} Total: {lastYearProjectsTotal.toLocaleString()} projects
            </div>
          </CardBody>
        </Card>

        {/* Gauge: Won Projects % */}
        <Card className="bg-[#e4e3e8] dark:bg-content1 shadow-sm lg:col-span-4 h-full">
          <CardBody className="p-5 h-full flex flex-col">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground mb-2">
              <Icon icon="lucide:trophy" className="text-primary text-lg" />
              Win Rate
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <Gauge
                  value={current.wonRatePct}
                  width={300}
                  height={300}
                  startAngle={-130}
                  endAngle={130}
                  innerRadius="60%"
                  outerRadius="95%"
                  cornerRadius={8}
                  sx={{ "& text": { display: "none" } }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-5xl md:text-6xl font-extrabold" style={{ transform: "translateY(6px)" }}>{current.wonRatePct}%</div>
                </div>
              </div>
            </div>
            <div className="text-sm text-default-500 mt-2">Proposal-to-win conversion rate.</div>
            <div className="text-sm text-default-500 mt-1">
              Goal: 70% by year-end · 
              <span className="text-success ml-1">
                <Icon icon="lucide:arrow-up-right" className="inline" /> {wonRateDelta >= 0 ? '+' : ''}{wonRateDelta}pp YoY
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Total Budget */}
        <Card className="bg-[#e4e3e8] dark:bg-content1 shadow-sm lg:col-span-4 h-full">
          <CardBody className="p-5 h-full flex flex-col">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground mb-1">
              <Icon icon="lucide:euro" className="text-primary text-lg" />
              Total Revenue from Won Projects
            </div>
            <div className="text-sm text-default-500 mt-1 mb-2">{formatEUR(current.totalWonBudget)} total — up {budgetDelta}% year-over-year.</div>
            <div className="flex-1 flex items-center justify-center">
              <div className="font-extrabold tracking-tight text-[clamp(2.5rem,6vw,6rem)] leading-none text-center w-full">
                <span>€</span>
                <CountUp from={0} to={current.totalWonBudget} separator="," duration={0.05} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-auto">
              <Chip size="sm" color="success" variant="flat" startContent={<Icon icon="lucide:trending-up" className="text-sm" />}>
                +{budgetDelta}% YoY
              </Chip>
              <span className="text-xs text-default-500">vs {year - 1}</span>
            </div>
          </CardBody>
        </Card>

        {/* Top Clients */}
        <Card className="bg-[#e4e3e8] dark:bg-content1 shadow-sm lg:col-span-6">
          <CardBody className="p-5">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Icon icon="lucide:building-2" className="text-primary text-lg" />
              Key Accounts
            </div>
            <div className="text-sm text-default-500 mt-1 mb-4">Based on number of active projects.</div>
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
                  const industry = clientIndustries[client.name] || "Other";
                  const industryColor = getIndustryColor(industry);
                  return (
                    <div key={client.name}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="shrink-0" name={client.name} size="sm">
                            {initials}
                          </Avatar>
                          <div className="truncate flex-1">
                            <div className="flex items-center gap-2">
                              <div className="truncate text-foreground">{client.name}</div>
                              <Chip size="sm" color={industryColor} variant="flat" className="text-xs px-1 h-5">
                                {industry}
                              </Chip>
                            </div>
                            <div className="text-xs text-default-500 mt-0.5">{client.projects} projects</div>
                          </div>
                        </div>
                        <div className="text-xs text-default-600 whitespace-nowrap ml-2">{formatEUR(client.value)}</div>
                      </div>
                      <Progress aria-label={client.name} value={pct} className="mt-2 h-2" color="primary" />
                    </div>
                  );
                })}
            </div>
            <div className="text-xs text-default-500 mt-4">Top 3 clients = {top3Pct}% of total revenue.</div>
          </CardBody>
        </Card>

        {/* Top 5 Budgets */}
        <Card className="bg-[#e4e3e8] dark:bg-content1 shadow-sm lg:col-span-6">
          <CardBody className="p-5">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Icon icon="lucide:wallet" className="text-primary text-lg" />
              Top Budget Projects
            </div>
            <div className="text-sm text-default-500 mt-1 mb-4">Projects ranked by total approved budget.</div>
            <div className="space-y-3">
              {current.topBudgets.map((item) => {
                const pct = Math.round((item.value / maxBudget) * 100);
                const pctOfTotal = Math.min(100, Math.round((item.value / current.totalWonBudget) * 100));
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="truncate pr-3">{item.name}</div>
                      <div className="text-default-600 whitespace-nowrap">{formatEUR(item.value)} ({pctOfTotal}%)</div>
                    </div>
                    <Progress aria-label={item.name} value={pct} className="mt-2 h-2" color="primary" />
                  </div>
                );
              })}
            </div>
            {/* Share distribution stacked bar to occupy remaining space elegantly */}
            <div className="mt-6">
              <div className="text-xs text-default-500 mb-2">Share distribution (of total revenue)</div>
              <div className="h-3 rounded-full overflow-hidden flex border border-divider">
                {current.topBudgets.map((item, idx) => {
                  const pctOfTotal = Math.max(1, Math.round((item.value / current.totalWonBudget) * 100));
                  return (
                    <div key={item.name} style={{ width: pctOfTotal + '%', backgroundColor: segmentColors[idx % segmentColors.length] }}></div>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {current.topBudgets.map((item, idx) => {
                  const pctOfTotal = Math.min(100, Math.round((item.value / current.totalWonBudget) * 100));
                  return (
                    <div key={item.name} className="flex items-center gap-2 min-w-0">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: segmentColors[idx % segmentColors.length] }}></span>
                      <span className="truncate flex-1">{item.name}</span>
                      <span className="text-default-500 whitespace-nowrap">{pctOfTotal}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="text-xs text-default-500 mt-4 flex flex-wrap gap-4">
              <span>Top 5 = {top5Pct}% of total revenue.</span>
              <span>Average deal size: {formatEUR(avgDealSize)}.</span>
            </div>
          </CardBody>
        </Card>

        {/* SIMU/LOGO Pie */}
        <Card className="bg-[#e4e3e8] dark:bg-content1 shadow-sm lg:col-span-4">
          <CardBody className="p-5 h-full flex flex-col gap-4">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Icon icon="lucide:pie-chart" className="text-primary text-lg" />
              Service Portfolio Breakdown
            </div>
            <div className="text-sm text-default-500 mt-1 mb-2">
              <Icon icon="lucide:palette" className="inline mr-1 text-primary" />
              {current.simuLogoSplit.logo}% logo design • 
              <Icon icon="lucide:sparkles" className="inline mx-1 text-success" />
              {current.simuLogoSplit.simu}% simulation
            </div>
            <div>
              {/* Main stacked bar */}
              <div className="h-6 rounded-full overflow-hidden flex border border-divider">
                <div style={{ width: logoPct + '%', backgroundColor: theme === 'dark' ? '#60A5FA' : '#006FEE' }}></div>
                <div style={{ width: simuPct + '%', backgroundColor: theme === 'dark' ? '#34D399' : '#17C964' }}></div>
              </div>
              <div className="mt-2 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: theme === 'dark' ? '#60A5FA' : '#006FEE' }}></span>
                  <Icon icon="lucide:palette" className="text-primary text-sm" />
                  <span className="text-foreground">LOGO</span>
                  <span className="text-default-500">{logoPct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: theme === 'dark' ? '#34D399' : '#17C964' }}></span>
                  <Icon icon="lucide:sparkles" className="text-success text-sm" />
                  <span className="text-foreground">SIMU</span>
                  <span className="text-default-500">{simuPct}%</span>
                </div>
              </div>
            </div>
            {/* Quick stats + stacked bar */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-content2 rounded-md border border-divider p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <Icon icon="lucide:palette" className="text-primary text-sm" />
                    <span className="text-foreground">LOGO</span>
                  </div>
                  <div className="text-default-600">{logoPct}%</div>
                </div>
                <div className="text-xs mt-1 {logoYoY>=0? 'text-success' : 'text-danger'}">
                  {logoYoY >= 0 ? '↑' : '↓'} {Math.abs(logoYoY)} pp YoY
                </div>
              </div>
              <div className="bg-content2 rounded-md border border-divider p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <Icon icon="lucide:sparkles" className="text-success text-sm" />
                    <span className="text-foreground">SIMU</span>
                  </div>
                  <div className="text-default-600">{simuPct}%</div>
                </div>
                <div className="text-xs mt-1 {simuYoY>=0? 'text-success' : 'text-danger'}">
                  {simuYoY >= 0 ? '↑' : '↓'} {Math.abs(simuYoY)} pp YoY
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-default-500 mb-2">YoY composition</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-default-500">{year}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden flex border border-divider">
                    <div style={{ width: logoPct + '%', backgroundColor: theme === 'dark' ? '#60A5FA' : '#006FEE' }}></div>
                    <div style={{ width: simuPct + '%', backgroundColor: theme === 'dark' ? '#34D399' : '#17C964' }}></div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-default-500">{year - 1}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden flex border border-divider">
                    <div style={{ width: (lastYear?.simuLogoSplit?.logo ?? logoPct) + '%', backgroundColor: theme === 'dark' ? '#60A5FA' : '#006FEE' }}></div>
                    <div style={{ width: (lastYear?.simuLogoSplit?.simu ?? simuPct) + '%', backgroundColor: theme === 'dark' ? '#34D399' : '#17C964' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-auto text-xs text-default-500 space-y-1">
              <div>{leader ? `${leader} leads by ${leadBy} pp.` : 'Balanced portfolio between design and simulation.'}</div>
              <div>Last quarter trend: +10% in SIMU.</div>
            </div>
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-[#e4e3e8] dark:bg-content1 shadow-sm lg:col-span-8">
          <CardBody className="p-5">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Icon icon="lucide:activity" className="text-primary text-lg" />
              Recent Projects
            </div>
            <div className="text-sm text-default-500 mt-1 mb-4">Latest projects added to the pipeline.</div>
            <Table aria-label="Recent activity" removeWrapper className="min-w-full table-fixed">
              <TableHeader>
                <TableColumn className="w-[18%]">Data</TableColumn>
                <TableColumn className="w-[32%]">Client</TableColumn>
                <TableColumn className="w-[20%] text-right">Value (€)</TableColumn>
                <TableColumn className="w-[30%] text-right">Status</TableColumn>
              </TableHeader>
              <TableBody>
                {current.recent.map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.client}</TableCell>
                    <TableCell className="text-right">{formatEUR(r.value)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        {r.status === "Finished" && <Chip size="sm" color="success" variant="flat">Finished</Chip>}
                        {r.status === "Approved" && <Chip size="sm" color="primary" variant="flat">Approved</Chip>}
                        {r.status === "In Queue" && <Chip size="sm" color="warning" variant="flat">In Queue</Chip>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-default-500">
              <div>{recentCount} new deals worth {formatEUR(recentSum)} in Q{recentQuarter}.</div>
            </div>
            {/* Distribution + Quick stats to occupy remaining space */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Status distribution stacked bar */}
              <div className="md:col-span-3">
                <div className="text-xs text-default-500 mb-2">Status distribution</div>
                <div className="h-3 rounded-full overflow-hidden flex border border-divider">
                  {statusOrder.map((s) => {
                    const count = statusCounts[s] || 0;
                    const pct = Math.round((count / Math.max(1, recentCount)) * 100);
                    return (
                      <div key={s} style={{ width: pct + '%', backgroundColor: statusColors[s] }}></div>
                    );
                  })}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  {statusOrder.map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: statusColors[s] }}></span>
                      <span className="text-default-600">{s}</span>
                      <span className="text-default-500">{statusCounts[s] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div className="md:col-span-2">
                <div className="text-xs text-default-500 mb-2">Deal Insights</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-content2 rounded-md border border-divider p-3 text-center">
                    <div className="text-xs text-default-500">Average</div>
                    <div className="text-lg font-semibold">{formatEUR(avgRecent)}</div>
                  </div>
                  <div className="bg-content2 rounded-md border border-divider p-3 text-center">
                    <div className="text-xs text-default-500">Largest</div>
                    <div className="text-lg font-semibold">{formatEUR(maxRecent)}</div>
                  </div>
                </div>
              </div>
            </div>

          </CardBody>
        </Card>
      </div>

      {/* Floating AI Assistant Button */}
      <Button 
        isIconOnly
        color="primary" 
        className="fixed bottom-6 right-6 shadow-lg w-14 h-14 rounded-full transition-transform duration-200 hover:scale-105 z-50"
        onPress={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        <Icon 
          icon={isOpen ? "lucide:x" : "lucide:bot"}
          className="text-2xl" 
        />
      </Button>

      {/* AI Assistant Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-96 shadow-2xl rounded-2xl overflow-hidden border border-divider bg-background"
          >
            <AIAssistantChat onClose={() => setIsOpen(false)} initialMessages={chatInitialMessages} />
          </motion.div>
        )}
      </AnimatePresence>
    </Scroller>
  );
}
