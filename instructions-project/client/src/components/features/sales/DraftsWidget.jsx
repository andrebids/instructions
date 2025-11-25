import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

export const DraftsWidget = ({ value, count, goal = 1000000 }) => {
  // Parse value (e.g. "€ 450k" -> 450000)
  const parseValue = (str) => {
    if (!str) return 0;
    const clean = str.toString().replace(/[^0-9.km]/gi, '');
    let num = parseFloat(clean);
    if (str.toString().toLowerCase().includes('k')) num *= 1000;
    if (str.toString().toLowerCase().includes('m')) num *= 1000000;
    return num;
  };

  const currentVal = parseValue(value);
  const percentage = Math.min(100, Math.max(0, Math.round((currentVal / goal) * 100)));

  // SVG Configuration for Semi-Circle
  const width = 120;
  const height = 70; // Half height + padding
  const strokeWidth = 10;
  const radius = (width - strokeWidth) / 2;
  const cx = width / 2;
  const cy = height - 5; // Bottom align - reduced margin
  
  // Calculate path for the progress arc
  // Start from 180deg (left) to 0deg (right)
  // Angle in radians: PI to 0
  // We want to draw from left to right based on percentage
  const totalAngle = Math.PI; 
  const progressAngle = totalAngle * (percentage / 100);
  
  // Background Arc (Full Semi-Circle)
  const bgPath = `M ${strokeWidth/2},${cy} A ${radius},${radius} 0 0,1 ${width - strokeWidth/2},${cy}`;
  
  // Progress Arc
  // We need to calculate the end point based on angle
  // Angle starts at PI (left) and decreases to 0 (right)
  // Current angle = PI - progressAngle
  const currentAngle = Math.PI - progressAngle;
  const endX = cx + radius * Math.cos(currentAngle);
  const endY = cy - radius * Math.sin(currentAngle);
  
  const progressPath = `M ${strokeWidth/2},${cy} A ${radius},${radius} 0 0,1 ${endX},${endY}`;

  return (
    <Card className="h-full bg-content1/50 border-default-200/50 backdrop-blur-md shadow-sm overflow-hidden relative group">
       {/* Background Glow Effect - Blue to Teal gradient */}
       <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-500" />

      <CardBody className="p-5 pb-3 flex flex-col h-full relative z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 h-11">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 shadow-sm ring-1 ring-blue-500/20 backdrop-blur-sm">
              <Icon icon="lucide:target" className="text-xl text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-default-500 text-sm font-medium">Sales</span>
              <span className="text-default-900 text-base font-bold">Goal</span>
            </div>
          </div>
        </div>

        {/* Value Display */}
        <div className="mb-2 h-10 flex items-end">
          <h4 className="text-3xl font-bold text-foreground leading-none">{value}</h4>
        </div>

        {/* Content */}
        <div className="flex items-start justify-between flex-1 gap-4 pt-1">
          <div className="flex flex-col gap-1 justify-end">
             <span className="text-xs text-default-400 font-medium">Year Goal: € {(goal/1000000).toFixed(1)}M</span>
             <div className="flex items-center gap-2">
                 <span className="text-sm font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{percentage}%</span>
                 <span className="text-xs text-default-400">completed</span>
             </div>
          </div>

          {/* Gauge Chart */}
          <div className="relative flex items-end justify-center" style={{ width: width, height: height }}>
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
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                className="text-default-200/20"
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
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-0.5 text-blue-500/20">
                <Icon icon="lucide:trending-up" className="text-2xl" />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
