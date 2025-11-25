import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

const data = [
  { name: 'Mon', value: 12 },
  { name: 'Tue', value: 19 },
  { name: 'Wed', value: 3 },
  { name: 'Thu', value: 5 },
  { name: 'Fri', value: 2 },
  { name: 'Sat', value: 15 },
  { name: 'Sun', value: 8 },
];

export const DraftsWidget = ({ value, count }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Card className="h-full bg-content1/50 border-default-200/50 backdrop-blur-md shadow-sm overflow-hidden relative group">
       {/* Background Glow Effect */}
       <div className="absolute -top-10 -right-10 w-32 h-32 bg-warning-500/20 rounded-full blur-3xl group-hover:bg-warning-500/30 transition-all duration-500" />

      <CardBody className="p-4 flex flex-col h-full overflow-hidden relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning-500/10 text-warning-500 shadow-sm ring-1 ring-warning-500/20">
              <Icon icon="lucide:file-edit" className="text-xl" />
            </div>
            <div className="flex flex-col">
              <span className="text-default-500 text-sm font-medium">Drafts</span>
              <span className="text-default-900 text-base font-bold">Value</span>
            </div>
          </div>
        </div>

        {/* Value Display */}
        <div className="flex items-baseline gap-2 mb-4">
          <h4 className="text-3xl font-bold text-foreground">{value}</h4>
          <span className="text-xs text-default-400 font-medium">{count} drafts</span>
        </div>

        {/* Custom SVG Bar Chart */}
        <div className="flex-1 flex items-end gap-1.5 px-1 pb-2">
          {data.map((item, index) => {
            const heightPercent = (item.value / maxValue) * 100;
            const opacity = 0.5 + (index / data.length) * 0.5;
            
            return (
              <div key={item.name} className="flex-1 flex flex-col items-center gap-1 group/bar">
                {/* Bar */}
                <div className="w-full flex items-end" style={{ height: '80px' }}>
                  <div 
                    className="w-full rounded-t-md transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ 
                      height: `${heightPercent}%`,
                      background: `linear-gradient(180deg, #F5A524 0%, #D97706 100%)`,
                      opacity: opacity,
                      boxShadow: '0 0 8px rgba(245, 165, 36, 0.3)',
                    }}
                  >
                    {/* Glass overlay effect */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"
                      style={{ mixBlendMode: 'overlay' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};
