import React from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { useTheme } from "@heroui/use-theme";

export function ProjectsYearComparison({
  currentYear = 2025,
  comparisonYear = 2024,
  title = "Projects Comparison by Year",
  compact = false,
}) {
  const { theme } = useTheme();
  const containerRef = React.useRef(null);
  const [chartWidth, setChartWidth] = React.useState(520);
  React.useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setChartWidth(Math.max(320, w));
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Garantir valores numéricos válidos (evitar NaN)
  const getNumeric = (v) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const currentValue = getNumeric(projectsData[safeCurrentYear]);
  const comparisonValue = getNumeric(projectsData[safeComparisonYear]);

  // Construir dados mensais determinísticos proporcionais ao total anual
  const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const buildMonthly = (total) => {
    const weights = Array.from({ length: 12 }, (_, m) => {
      const x = (2 * Math.PI * m) / 12;
      return 1 + 0.35 * Math.sin(x - Math.PI / 6) + 0.15 * Math.sin(2 * x);
    });
    const sum = weights.reduce((a, b) => a + b, 0);
    return weights.map((w) => Math.round((w / sum) * total));
  };
  const currentMonthly = buildMonthly(currentValue);
  const comparisonMonthly = buildMonthly(comparisonValue);
  // Acumular ao longo dos meses (total até ao mês)
  const toCumulative = (arr) => {
    let run = 0;
    return arr.map((v) => (run += v));
  };
  const currentCumulative = toCumulative(currentMonthly);
  const comparisonCumulative = toCumulative(comparisonMonthly);
  const colorCurrent = theme === 'dark' ? '#3b82f6' : '#006FEE';
  const colorComparison = theme === 'dark' ? '#22c55e' : '#17C964';
  const chartHeight = 320;
  const margins = { left: 40, right: 16, top: 6, bottom: 24 };
  const plotHeight = chartHeight - margins.top - margins.bottom;
  const yLabelTop = margins.top + plotHeight / 2;

  // Calcular diferença percentual
  const difference = currentValue - comparisonValue;
  const percentageChange = comparisonValue === 0 ? '—' : (
    (difference / comparisonValue) * 100
  ).toFixed(1);

  const rawMax = Math.max(...currentCumulative, ...comparisonCumulative);
  const roundedMax = Math.max(1000, Math.ceil(rawMax / 5000) * 5000);

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
      <div className="w-full relative" ref={containerRef}>
          <LineChart
            xAxis={[{ 
              scaleType: 'point', 
              data: monthLabels, 
              tickLabelStyle: { fill: 'hsl(var(--heroui-foreground))' }
            }]}
            yAxis={[{ 
              min: 0, 
              max: roundedMax, 
              tickLabelStyle: { fill: 'hsl(var(--heroui-foreground))' },
              valueFormatter: (v) => v.toLocaleString('fr-FR'),
            }]}
            series={[
              { curve: 'monotoneX', data: currentCumulative, label: `Year ${safeCurrentYear}`, color: colorCurrent, showMark: false, area: true, baseline: 'min' },
              { curve: 'monotoneX', data: comparisonCumulative, label: `Year ${safeComparisonYear}`, color: colorComparison, showMark: false, area: true, baseline: 'min' },
            ]}
            width={chartWidth}
            height={chartHeight}
            margin={margins}
            grid={{ horizontal: true, vertical: false }}
            slotProps={{ legend: { hidden: true } }}
            sx={{
              '& .MuiChartsLegend-root': { display: 'none' },
              '& .MuiChartsAxis-line': { stroke: 'hsl(var(--heroui-default-400))' },
              '& .MuiChartsAxis-tickLabel': { fill: 'hsl(var(--heroui-foreground))' },
              '& .MuiChartsGrid-line': { stroke: 'hsl(var(--heroui-default-300))', opacity: 0.25 },
              '& .MuiLineElement-root': { strokeLinecap: 'round', strokeWidth: 3 },
              '& .MuiAreaElement-root': { fillOpacity: 0.12 },
            }}
            experimentalFeatures={{ preferStrictDomainInLineCharts: true }}
          />
          {/* Axis labels moved to custom positions relative to chart area */}
          <div
            className="absolute text-foreground text-xs md:text-sm"
            style={{ left: margins.left - 22, top: yLabelTop, transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: 'left top' }}
          >
            Projects
          </div>
          <div
            className="absolute text-foreground text-xs md:text-sm"
            style={{ left: '50%', transform: 'translateX(-50%)', bottom: margins.bottom - 2 }}
          >
            Months
          </div>
          {/* Custom legend pinned bottom-left under the chart */}
          <div className="mt-3 pl-2 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-7 rounded-full" style={{ backgroundColor: colorCurrent }}></span>
              <span className="text-foreground text-sm">Year {safeCurrentYear}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-7 rounded-full" style={{ backgroundColor: colorComparison }}></span>
              <span className="text-foreground text-sm">Year {safeComparisonYear}</span>
            </div>
          </div>
          {compact && (
            <div className="mt-2 text-xs text-default-500 flex flex-wrap gap-4 pl-2">
              <span>
                {`${difference >= 0 ? '+' : ''}${percentageChange}%`} more projects compared to {safeComparisonYear}.
              </span>
              <span className="opacity-80">
                {safeCurrentYear}: {currentValue.toLocaleString()} | {safeComparisonYear}: {comparisonValue.toLocaleString()}
              </span>
            </div>
          )}
      </div>
    </div>
  );
}
