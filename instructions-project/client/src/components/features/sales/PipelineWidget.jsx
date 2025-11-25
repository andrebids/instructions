import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

// Sales pipeline data - percentages for each stage
const pipelineStages = [
  { name: 'Proposal', percentage: 40, color: '#A855F7', glowColor: 'rgba(168, 85, 247, 0.4)' }, // Purple
  { name: 'Negotiation', percentage: 35, color: '#3B82F6', glowColor: 'rgba(59, 130, 246, 0.4)' }, // Blue
  { name: 'Closing', percentage: 25, color: '#10B981', glowColor: 'rgba(16, 185, 129, 0.4)' }, // Green
];

export const PipelineWidget = ({ value, trend }) => {
  return (
    <Card className="h-full bg-content1/50 border-default-200/50 backdrop-blur-md shadow-sm overflow-hidden relative group">
       {/* Background Glow Effect - Purple to Pink gradient */}
       <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-500" />
       
      <CardBody className="p-4 flex flex-col h-full overflow-hidden relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 shadow-sm ring-1 ring-purple-500/20 backdrop-blur-sm">
              <Icon icon="lucide:bar-chart-3" className="text-xl text-purple-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-default-500 text-sm font-medium">Total</span>
              <span className="text-default-900 text-base font-bold">Pipeline</span>
            </div>
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
              <Icon icon="lucide:trending-up" />
              {trend}
            </div>
          )}
        </div>

        {/* Value Display */}
        <div className="mb-6">
          <h4 className="text-3xl font-bold text-foreground">{value}</h4>
        </div>

        {/* Horizontal Stacked Bar Chart */}
        <div className="flex-1 flex flex-col justify-center gap-4">
          {/* Progress Bar */}
          <div className="relative w-full h-8 rounded-full overflow-hidden bg-default-100/50 shadow-inner">
            <div className="absolute inset-0 flex h-full">
              {pipelineStages.map((stage, index) => {
                const leftOffset = pipelineStages
                  .slice(0, index)
                  .reduce((sum, s) => sum + s.percentage, 0);
                
                return (
                  <div
                    key={stage.name}
                    className="relative h-full transition-all duration-500 hover:brightness-110"
                    style={{
                      width: `${stage.percentage}%`,
                      backgroundColor: stage.color,
                      boxShadow: `0 0 20px ${stage.glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                    }}
                  >
                    {/* Shimmer effect */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      style={{
                        animation: 'shimmer 3s infinite',
                        animationDelay: `${index * 0.5}s`
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6">
            {pipelineStages.map((stage) => (
              <div key={stage.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: stage.color,
                    boxShadow: `0 0 8px ${stage.glowColor}`
                  }}
                />
                <span className="text-xs font-medium text-default-600">
                  {stage.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardBody>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </Card>
  );
};
