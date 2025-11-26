import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@heroui/use-theme";

export const DraftsWidget = React.memo(({ value, count, goal = 1000000 }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isLightMode, setIsLightMode] = React.useState(theme !== 'dark');

  // Update isLightMode when theme changes
  React.useEffect(() => {
    setIsLightMode(theme !== 'dark');
  }, [theme]);

  // Parse value (e.g. "€ 450k" -> 450000)
  const parseValue = React.useCallback((str) => {
    if (!str) return 0;
    const clean = str.toString().replace(/[^0-9.km]/gi, '');
    let num = parseFloat(clean);
    if (str.toString().toLowerCase().includes('k')) num *= 1000;
    if (str.toString().toLowerCase().includes('m')) num *= 1000000;
    return num;
  }, []);

  // Format value for display (e.g. 550000 -> "€ 550k")
  const formatValue = React.useCallback((val) => {
    if (val >= 1000000) {
      return `€ ${(val / 1000000).toFixed(1)}M`;
    } else if (val >= 1000) {
      return `€ ${(val / 1000).toFixed(0)}k`;
    }
    return `€ ${val.toFixed(0)}`;
  }, []);

  const currentVal = React.useMemo(() => parseValue(value), [value, parseValue]);
  const gap = React.useMemo(() => Math.max(0, goal - currentVal), [goal, currentVal]);
  const percentage = React.useMemo(() => Math.min(100, Math.max(0, Math.round((currentVal / goal) * 100))), [currentVal, goal]);

  // SVG Configuration for Semi-Circle
  const width = 120;
  const height = 70; // Reduced height to move up
  const strokeWidth = 10;
  const radius = (width - strokeWidth) / 2;
  const cx = width / 2;
  const cy = height - 5; // Bottom align - reduced margin
  
  // Calculate path for the progress arc
  // Start from 180deg (left) to 0deg (right)
  // Angle in radians: PI to 0
  // We want to draw from left to right based on percentage
  const totalAngle = Math.PI; 
  const progressAngle = React.useMemo(() => totalAngle * (percentage / 100), [totalAngle, percentage]);
  
  // Background Arc (Full Semi-Circle)
  const bgPath = React.useMemo(() => `M ${strokeWidth/2},${cy} A ${radius},${radius} 0 0,1 ${width - strokeWidth/2},${cy}`, [strokeWidth, cy, radius, width]);
  
  // Progress Arc
  // We need to calculate the end point based on angle
  // Angle starts at PI (left) and decreases to 0 (right)
  // Current angle = PI - progressAngle
  const progressPath = React.useMemo(() => {
    const currentAngle = Math.PI - progressAngle;
    const endX = cx + radius * Math.cos(currentAngle);
    const endY = cy - radius * Math.sin(currentAngle);
    return `M ${strokeWidth/2},${cy} A ${radius},${radius} 0 0,1 ${endX},${endY}`;
  }, [cx, radius, progressAngle, strokeWidth, cy]);

  return (
    <Card className="h-full glass-panel border-default-200/50 overflow-hidden relative group">
       {/* Background Glow Effect - Blue to Teal gradient */}
       <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-500" />

      <CardBody className="p-4 pb-2 flex flex-col h-full relative z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 shadow-sm ring-1 ring-blue-500/20 backdrop-blur-sm">
              <Icon icon="lucide:target" className="text-xl text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-default-500 text-sm font-medium">{t('pages.dashboard.salesGoalWidget.annualGoal')}</span>
              <span className="text-default-900 text-base font-bold">{formatValue(goal)}</span>
            </div>
          </div>
        </div>

        {/* Value Display */}
        <div className="mt-2 mb-2">
          <h4 className="text-3xl font-bold text-foreground leading-none">{formatValue(gap)}</h4>
          <span className="text-xs text-gray-500 dark:text-default-400 font-medium mt-0.5">{t('pages.dashboard.salesGoalWidget.toGo')}</span>
        </div>

        {/* Content */}
        <div className="flex items-end justify-between flex-1 gap-4 pt-0">
          <div className="flex flex-col gap-1 justify-end pb-6">
             <span className="text-xs text-gray-500 dark:text-default-400 font-medium">
               {t('pages.dashboard.salesGoalWidget.completedLabel')}: {value} • {percentage}%
             </span>
          </div>

          {/* Gauge Chart */}
          <div className="relative flex items-center justify-center" style={{ width: width, height: height, transform: 'translateY(-28px)' }}>
            <svg width={width} height={height} className="overflow-visible">
              <defs>
                <linearGradient id="salesGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" /> {/* blue-500 */}
                  <stop offset="50%" stopColor="#0EA5E9" /> {/* sky-500 */}
                  <stop offset="100%" stopColor="#06B6D4" /> {/* cyan-500 */}
                </linearGradient>
                <filter id="salesGaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              {/* Track */}
              <path
                d={bgPath}
                stroke={isLightMode ? "#d1d5db" : "rgba(255, 255, 255, 0.15)"}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
              
              {/* Progress */}
              <path
                d={progressPath}
                stroke="url(#salesGaugeGradient)"
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))' }}
              />
            </svg>
            
            {/* Icon inside Gauge */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-blue-500/20">
                <Icon icon="lucide:trending-up" className="text-2xl" />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
});
