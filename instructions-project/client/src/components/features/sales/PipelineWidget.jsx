import React from "react";
import { Card, CardBody, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";

// Sales pipeline data - percentages for each stage with mock project details
const pipelineStages = [
  { 
    name: 'Proposal', 
    percentage: 40, 
    color: '#A855F7', 
    glowColor: 'rgba(168, 85, 247, 0.4)',
    projectCount: 8,
    totalValue: '€ 480k',
    projects: [
      { name: 'Hotel Algarve', value: '€ 85k' },
      { name: 'Shopping Center Lisboa', value: '€ 120k' },
      { name: 'Restaurant Porto', value: '€ 45k' },
    ]
  },
  { 
    name: 'Negotiation', 
    percentage: 35, 
    color: '#3B82F6', 
    glowColor: 'rgba(59, 130, 246, 0.4)',
    projectCount: 6,
    totalValue: '€ 420k',
    projects: [
      { name: 'Corporate Office Braga', value: '€ 95k' },
      { name: 'Retail Store Cascais', value: '€ 65k' },
      { name: 'Event Venue Sintra', value: '€ 78k' },
    ]
  },
  { 
    name: 'Closing', 
    percentage: 25, 
    color: '#10B981', 
    glowColor: 'rgba(16, 185, 129, 0.4)',
    projectCount: 4,
    totalValue: '€ 300k',
    projects: [
      { name: 'Municipal Building Faro', value: '€ 110k' },
      { name: 'Private Villa Comporta', value: '€ 92k' },
      { name: 'Boutique Hotel Óbidos', value: '€ 98k' },
    ]
  },
];

export const PipelineWidget = ({ value }) => {
  return (
    <Card className="h-full bg-content1/50 border-default-200/50 backdrop-blur-md shadow-sm overflow-hidden relative group">
       {/* Background Glow Effect - Purple to Pink gradient */}
       <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-500" />
       
      <CardBody className="p-5 pb-3 flex flex-col h-full relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 shadow-sm ring-1 ring-purple-500/20 backdrop-blur-sm">
              <Icon icon="lucide:bar-chart-3" className="text-xl text-purple-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-default-500 text-sm font-medium">Total</span>
              <span className="text-default-900 text-base font-bold">Pipeline</span>
            </div>
          </div>
        </div>

        {/* Value Display */}
        <div className="mt-2 mb-2">
          <h4 className="text-3xl font-bold text-foreground leading-none">{value}</h4>
        </div>

        {/* Horizontal Stacked Bar Chart */}
        <div className="flex-1 flex flex-col justify-end gap-1.5 min-h-0 pt-1">
          {/* Progress Bar */}
          <div className="relative w-full h-6 rounded-full bg-default-100/50 shadow-inner" style={{ overflow: 'visible' }}>
            <div className="absolute inset-0 flex h-full rounded-full" style={{ overflow: 'visible' }}>
              {pipelineStages.map((stage, index) => {
                const leftOffset = pipelineStages
                  .slice(0, index)
                  .reduce((sum, s) => sum + s.percentage, 0);
                
                return (
                  <Tooltip
                    key={stage.name}
                    content={
                      <div className="px-3 py-3 min-w-[200px]">
                        <div className="text-base font-bold mb-2 text-foreground">{stage.name}</div>
                        <div className="text-sm mb-3 text-foreground-600 font-medium">
                          {stage.projectCount} projects • {stage.totalValue}
                        </div>
                        <div className="space-y-2">
                          {stage.projects.map((project, idx) => (
                            <div key={idx} className="flex justify-between gap-4 text-sm">
                              <span className="text-foreground-700">{project.name}</span>
                              <span className="font-bold text-foreground">{project.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    }
                    placement="top"
                    classNames={{
                      base: "py-2 px-3",
                      content: "py-3 px-3 bg-content1 border-2 border-default-300 shadow-lg backdrop-blur-md"
                    }}
                  >
                    <div
                      className="relative h-full transition-all duration-500 hover:brightness-110 cursor-pointer first:rounded-l-full last:rounded-r-full"
                      style={{
                        width: `${stage.percentage}%`,
                        backgroundColor: stage.color,
                        filter: `drop-shadow(0 0 4px ${stage.glowColor})`,
                      }}
                    />

                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 flex-wrap px-1">
            {pipelineStages.map((stage) => (
              <div key={stage.name} className="flex items-center gap-1.5">
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ 
                    backgroundColor: stage.color,
                    boxShadow: `0 0 6px ${stage.glowColor}`
                  }}
                />
                <span className="text-xs font-medium text-default-600 whitespace-nowrap">
                  {stage.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardBody>

    </Card>
  );
};
