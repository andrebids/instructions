import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

export const ConversionWidget = ({ value, trend }) => {
  // Parse numeric value from string (e.g. "68%")
  const numericValue = parseInt(value) || 0;
  
  const data = [
    {
      name: 'Conversion',
      value: numericValue,
      fill: '#17C964',
    },
  ];

  return (
    <Card className="h-full bg-content1/50 border-default-200/50 backdrop-blur-md shadow-sm overflow-hidden relative group">
       {/* Background Glow Effect */}
       <div className="absolute -top-10 -right-10 w-32 h-32 bg-success-500/20 rounded-full blur-3xl group-hover:bg-success-500/30 transition-all duration-500" />

      <CardBody className="p-0 flex flex-row h-full items-center overflow-hidden">
        <div className="p-6 flex-1 z-10 shrink-0">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-lg bg-success-500/10 text-success-500">
              <Icon icon="lucide:pie-chart" className="text-xl" />
            </div>
             {trend && (
               <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full text-xs font-medium">
                <Icon icon="lucide:trending-up" />
                {trend}
              </div>
            )}
          </div>
          <p className="text-default-500 text-sm font-medium">Conversion Rate</p>
          <h4 className="text-3xl font-bold text-foreground">{value}</h4>
          <p className="text-default-400 text-xs mt-1">Better than last month</p>
        </div>

        <div className="h-full w-[120px] relative flex items-center justify-center mr-2 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              innerRadius="60%" 
              outerRadius="90%" 
              barSize={10} 
              data={data} 
              startAngle={90} 
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background
                clockWise
                dataKey="value"
                cornerRadius={10}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <span className="text-sm font-bold text-success-500">{numericValue}%</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
