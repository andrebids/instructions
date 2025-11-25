import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

export const ConversionWidget = ({ value, trend, won = 34, lost = 16 }) => {
  // Calculate win rate percentage
  const total = won + lost;
  const winRate = total > 0 ? Math.round((won / total) * 100) : 0;
  
  // SVG Configuration
  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (winRate / 100) * circumference;

  return (
    <Card className="h-full bg-content1/50 border-default-200/50 backdrop-blur-md shadow-sm overflow-hidden relative group">
       {/* Background Glow Effect */}
       <div className="absolute -top-10 -right-10 w-32 h-32 bg-success-500/20 rounded-full blur-3xl group-hover:bg-success-500/30 transition-all duration-500" />

      <CardBody className="p-5 pb-3 flex flex-col h-full relative z-10 overflow-hidden">
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
              <span className="text-2xl font-bold text-foreground tracking-tight">{winRate}%</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between relative z-20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success-500/10 text-success-500 shadow-sm ring-1 ring-success-500/20">
              <Icon icon="lucide:trending-up" className="text-xl" />
            </div>
            <div className="flex flex-col">
              <span className="text-default-500 text-sm font-medium">Win / Lost</span>
              <span className="text-default-900 text-base font-bold">Deals</span>
            </div>
          </div>
        </div>

        {/* Value Display */}
        <div className="mt-2 mb-2 relative z-20">
          <h4 className="text-3xl font-bold text-foreground leading-none">{winRate}%</h4>
        </div>

        {/* Content */}
        <div className="flex items-end justify-between flex-1 gap-4 pt-1">
          <div className="flex flex-col gap-1 justify-end pb-3">
            <span className="text-xs text-default-400 font-medium">Sales Goal: {winRate}%</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold bg-gradient-to-r from-success-500 to-emerald-500 bg-clip-text text-transparent">{winRate}%</span>
              <span className="text-xs text-default-400">completed</span>
            </div>
          </div>
        </div>

      </CardBody>
    </Card>
  );
};
