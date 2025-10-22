import React from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { useTheme } from "@heroui/use-theme";

export function ProjectsYearComparison({
  currentYear = 2025,
  comparisonYear = 2024,
  title = "Projects Comparison by Year",
  compact = false,
}) {
  const { theme } = useTheme();

  // Dados dos projetos por ano (base)
  const baseProjectsData = {
    2025: 15471,
    2024: 12456,
    2023: 22567,
    2022: 9874,
    2021: 13457,
  };

  // Valor aleatório estável por montagem para anos em falta (ex.: 2020)
  const randomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const projectsData = React.useMemo(() => {
    const data = { ...baseProjectsData };
    if (data[2020] == null) {
      data[2020] = randomInRange(6000, 18000);
    }
    return data;
  }, []);

  // Use years from props
  const safeCurrentYear = Number(currentYear);
  const safeComparisonYear = Number(comparisonYear);

  // Preparar dados para o gráfico com duas séries
  const xLabelCurrent = compact ? String(safeCurrentYear) : `Current Year (${safeCurrentYear})`;
  const xLabelComparison = compact ? String(safeComparisonYear) : `Comparison Year (${safeComparisonYear})`;

  // Garantir valores numéricos válidos (evitar NaN)
  const getNumeric = (v) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const currentValue = getNumeric(projectsData[safeCurrentYear]);
  const comparisonValue = getNumeric(projectsData[safeComparisonYear]);

  const chartData = [
    {
      year: xLabelCurrent,
      currentYear: currentValue,
      comparisonYear: 0,
    },
    {
      year: xLabelComparison,
      currentYear: 0,
      comparisonYear: comparisonValue,
    },
  ];

  // Calcular diferença percentual
  const difference = currentValue - comparisonValue;
  const percentageChange = comparisonValue === 0 ? '—' : (
    (difference / comparisonValue) * 100
  ).toFixed(1);

  // Axis overlay helpers (clean arrow + labels)
  const rawMax = Math.max(currentValue, comparisonValue);
  const roundedMax = Math.max(1000, Math.ceil((Number.isFinite(rawMax) ? rawMax : 0) / 5000) * 5000 || 10000);
  const axisSteps = 4; // 0..max in 4 steps like the mock
  const formatAxis = (n) => n.toLocaleString('fr-FR');
  const axisLabels = Array.from({ length: axisSteps + 1 }, (_ , i) => Math.round((roundedMax / axisSteps) * i));

// Note: MUI X Charts already supports initial animations via skipAnimation={false}

  return (
    <div className="space-y-6">
      {/* Optional Chart Header */}
      {!compact && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
            <p className="text-default-500 mt-1">
              Compare current year projects with previous years
            </p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {!compact && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-primary-50 dark:bg-primary-500/20 p-4 rounded-lg border border-primary-200 dark:border-primary-400/50">
          <div className="text-sm text-primary-700 dark:text-primary-300 font-medium">Current Year ({safeCurrentYear})</div>
          <div className="text-2xl font-bold text-primary-900 dark:text-primary-200">
            {projectsData[safeCurrentYear].toLocaleString()}
          </div>
          <div className="text-xs text-primary-600 dark:text-primary-400">projects</div>
        </div>
        
        <div className="bg-success-50 dark:bg-success-500/20 p-4 rounded-lg border border-success-200 dark:border-success-400/50">
          <div className="text-sm text-success-700 dark:text-success-300 font-medium">Comparison Year ({safeComparisonYear})</div>
          <div className="text-2xl font-bold text-success-900 dark:text-success-200">
            {projectsData[safeComparisonYear].toLocaleString()}
          </div>
          <div className="text-xs text-success-600 dark:text-success-400">projects</div>
        </div>
        
        <div className={`p-4 rounded-lg border ${difference >= 0 ? 'bg-success-50 dark:bg-success-500/20 border-success-200 dark:border-success-400/50' : 'bg-danger-50 dark:bg-danger-500/20 border-danger-200 dark:border-danger-400/50'}`}>
          <div className={`text-sm font-medium ${difference >= 0 ? 'text-success-700 dark:text-success-300' : 'text-danger-700 dark:text-danger-300'}`}>
            Change
          </div>
          <div className={`text-2xl font-bold ${difference >= 0 ? 'text-success-900 dark:text-success-200' : 'text-danger-900 dark:text-danger-200'}`}>
            {difference >= 0 ? '+' : ''}{difference.toLocaleString()}
          </div>
          <div className={`text-xs ${difference >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
            ({percentageChange}%)
          </div>
        </div>
      </div>
      )}

      {/* Legend hidden in compact mode for a cleaner look */}
      {!compact && (
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-sm" 
              style={{ backgroundColor: theme === 'dark' ? '#60A5FA' : '#006FEE' }}
            ></div>
            <span className="text-foreground">Current Year ({safeCurrentYear})</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-sm" 
              style={{ backgroundColor: theme === 'dark' ? '#4ADE80' : '#17C964' }}
            ></div>
            <span className="text-foreground">Comparison Year ({safeComparisonYear})</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-content1 rounded-lg p-3 border border-divider relative">
        {/* Left arrow axis overlay (no grid, no real axis) */}
        <div className="absolute left-2 top-4 bottom-10 w-24 pointer-events-none">
          <div className="absolute right-0 top-2 bottom-0 border-l dark:border-white/80 border-default-400"></div>
          <div className="absolute right-0 -top-1 w-0 h-0 border-l-5 border-l-transparent border-r-5 border-r-transparent border-b-8 dark:border-b-white/80 border-b-default-400"></div>
          <div className="h-full flex flex-col justify-between text-foreground text-xs md:text-sm font-semibold pr-3 whitespace-nowrap text-right">
            {axisLabels.slice().reverse().map((v) => (
              <div key={v}>{formatAxis(v)}</div>
            ))}
          </div>
        </div>
        <div className="pl-24 flex justify-center">
        <BarChart
          dataset={chartData}
          xAxis={[
            {
              scaleType: 'band',
              dataKey: 'year',
              labelStyle: {
                fill: 'hsl(var(--heroui-foreground))',
                fontSize: '14px',
              },
              tickLabelStyle: {
                fill: 'hsl(var(--heroui-foreground))',
                fontSize: compact ? '18px' : '14px',
                fontWeight: 700,
              },
              tickSize: 0,
              position: 'none',
            },
          ]}
          yAxis={[
            {
              min: 0,
              max: roundedMax,
              position: 'none',
              tickLabelStyle: {
                fill: 'transparent',
                fontSize: '12px',
              },
              tickSize: 0,
            },
          ]}
          series={[
            {
              dataKey: 'currentYear',
              label: `Current Year (${safeCurrentYear})`,
              color: 'url(#barGradBlue)',
              highlightScope: { highlighted: 'none', faded: 'none' },
            },
            {
              dataKey: 'comparisonYear',
              label: `Comparison Year (${safeComparisonYear})`,
              color: 'url(#barGradGreen)',
              highlightScope: { highlighted: 'none', faded: 'none' },
            },
          ]}
          width={280}
          height={200}
          margin={{ left: 0, right: 0, top: 0, bottom: 28 }}
          skipAnimation={false}
          tooltip={{
            formatter: (value) => [`${value.toLocaleString()} projects`, 'Projects'],
          }}
          grid={{ horizontal: false, vertical: false }}
          legend={{ hidden: true }}
          slotProps={{ bar: { rx: 10 } }}
          sx={{
            width: '100%',
            pointerEvents: 'none',
            '& .MuiChartsGrid-root': { display: 'none' },
            '& .MuiChartsAxis-line': { display: 'none' },
            '& .MuiChartsLegend-root': { display: 'none' },
            '& .MuiChartsAxis-tick': { display: 'none' },
            '& .MuiChartsTooltip-root': { display: 'none' },
          }}
        >
          <defs>
            <linearGradient id="barGradBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme === 'dark' ? '#bfdbfe' : '#cfe7ff'} />
              <stop offset="100%" stopColor={theme === 'dark' ? '#3b82f6' : '#3b82f6'} />
            </linearGradient>
            <linearGradient id="barGradGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme === 'dark' ? '#bbf7d0' : '#d2fbd8'} />
              <stop offset="100%" stopColor={theme === 'dark' ? '#22c55e' : '#22c55e'} />
            </linearGradient>
          </defs>
        </BarChart>
        </div>
        {/* Year labels aligned under each bar */}
        <div className="mt-2 pl-24 pr-2">
          <div className="grid grid-cols-2">
            <div className="text-center text-lg md:text-xl font-semibold text-foreground">{safeCurrentYear}</div>
            <div className="text-center text-lg md:text-xl font-semibold text-foreground">{safeComparisonYear}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
