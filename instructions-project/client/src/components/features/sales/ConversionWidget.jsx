import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

export const ConversionWidget = ({ value, trend, won = 34, lost = 16 }) => {
  // Parse numeric value from string (e.g. "68%")
  const numericValue = parseInt(value) || 0;
  
  // SVG Configuration
  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (numericValue / 100) * circumference;

  return (
    <Card className="h-full bg-content1/50 border-default-200/50 backdrop-blur-md shadow-sm overflow-hidden relative group">
       {/* Background Glow Effect */}
       <div className="absolute -top-10 -right-10 w-32 h-32 bg-success-500/20 rounded-full blur-3xl group-hover:bg-success-500/30 transition-all duration-500" />

      <CardBody className="p-5 flex flex-col h-full relative z-10 overflow-hidden">
        {/* Chart - Positioned at 50% of ENTIRE widget height */}
        <div className="absolute right-5 top-1/2 -translate-y-1/2 z-10">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
              <defs>
                <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" /> {/* emerald-400 */}
                  <stop offset="100%" stopColor="#10b981" /> {/* emerald-500 */}
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              {/* Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="transparent"
                className="text-default-200/20"
              />
              
              {/* Progress */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#glassGradient)"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))' }}
              />
            </svg>
            
            {/* Inner Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-foreground tracking-tight">{numericValue}%</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2 h-11 relative z-20">
          <div className="p-2.5 rounded-xl bg-success-500/10 text-success-500 shadow-sm ring-1 ring-success-500/20">
            <Icon icon="lucide:pie-chart" className="text-xl" />
          </div>
          <div className="flex flex-col">
            <span className="text-default-500 text-sm font-medium">Conversion</span>
            <span className="text-default-900 text-base font-bold">Rate</span>
          </div>
        </div>

        {/* Value Display */}
        <div className="mb-1 h-10 flex items-end relative z-20">
          <h4 className="text-3xl font-bold text-foreground leading-none">{value}</h4>
        </div>

        {/* Content Area with Info */}
        <div className="flex-1 relative">
          {/* Absolute Numbers */}
          <div className="flex flex-col gap-1 relative z-20">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:check-circle" className="text-sm text-success-500" />
              <span className="text-xs text-default-500 font-medium">Won:</span>
              <span className="text-sm font-bold text-success-600 dark:text-success-500">{won}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="lucide:x-circle" className="text-sm text-danger-500" />
              <span className="text-xs text-default-500 font-medium">Lost:</span>
              <span className="text-sm font-bold text-danger-600 dark:text-danger-500">{lost}</span>
            </div>
          </div>
        </div>

      </CardBody>
    </Card>
  );
};
