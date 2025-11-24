import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from 'recharts';

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
  return (
    <Card className="h-full bg-content1/50 border-default-200/50 backdrop-blur-md shadow-sm overflow-hidden relative group">
       {/* Background Glow Effect */}
       <div className="absolute -top-10 -right-10 w-32 h-32 bg-warning-500/20 rounded-full blur-3xl group-hover:bg-warning-500/30 transition-all duration-500" />

      <CardBody className="p-0 flex flex-col h-full overflow-hidden">
        <div className="p-6 pb-0 z-10 shrink-0">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-lg bg-warning-500/10 text-warning-500">
              <Icon icon="lucide:file-edit" className="text-xl" />
            </div>
          </div>
          <p className="text-default-500 text-sm font-medium">Drafts Value</p>
          <div className="flex items-baseline gap-2">
             <h4 className="text-3xl font-bold text-foreground">{value}</h4>
             <span className="text-sm text-default-400">({count} drafts)</span>
          </div>
        </div>

        <div className="flex-1 min-h-0 w-full mt-4 px-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <Tooltip
                cursor={{fill: 'transparent'}}
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '8px', border: 'none', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#F5A524" fillOpacity={0.6 + (index / data.length) * 0.4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
};
