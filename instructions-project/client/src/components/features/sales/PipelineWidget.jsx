import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from "react-i18next";

// Mapear código do idioma do i18n para locale do toLocaleDateString
const getLocaleFromLanguage = (lang) => {
  const localeMap = {
    'pt': 'pt-PT',
    'en': 'en-US',
    'fr': 'fr-FR'
  };
  return localeMap[lang] || 'pt-PT';
};

// Gerar dados com dias da semana traduzidos
const generateWeekdayData = (locale) => {
  const values = [4000, 3000, 2000, 2780, 1890, 2390, 3490];
  const baseDate = new Date(2024, 0, 1); // Segunda-feira como base
  const weekdays = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    const weekdayName = date.toLocaleDateString(locale, { weekday: 'short' });
    weekdays.push({ name: weekdayName, value: values[i] });
  }
  
  return weekdays;
};

export const PipelineWidget = ({ value, trend }) => {
  const { i18n } = useTranslation();
  const locale = getLocaleFromLanguage(i18n.language);
  const data = React.useMemo(() => generateWeekdayData(locale), [locale]);
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
        <div className="mb-4">
          <h4 className="text-3xl font-bold text-foreground">{value}</h4>
        </div>

        <div className="flex-1 min-h-0 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="pipelineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '8px', border: 'none', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                cursor={{ stroke: '#8B5CF6', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#8B5CF6" 
                fill="url(#pipelineGradient)" 
                strokeWidth={3}
                style={{ filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
};
