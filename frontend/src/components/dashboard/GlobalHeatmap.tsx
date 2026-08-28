import React from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';

export default function GlobalHeatmap() {
  const { data, isLoading } = useQuery({
    queryKey: ['globalHeatmap'],
    queryFn: async () => {
      const res = await client.get('/analytics/heatmap-global');
      return res.data;
    }
  });

  const getHeatmapColor = (rate: number | undefined) => {
    if (!rate || rate === 0) return 'bg-slate-800';
    if (rate <= 0.33) return 'bg-emerald-900/60';
    if (rate <= 0.66) return 'bg-emerald-700/80';
    if (rate < 1.0) return 'bg-emerald-500';
    return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'; // Full completion gets a glow!
  };

  // Generate date grid aligned to weeks (starting on Sunday)
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 180);
  
  // Adjust to previous Sunday to align grid perfectly
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  const dates: string[] = [];
  const current = new Date(startDate);
  while (current <= today) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  // Calculate months for labels (rough approximation for headers)
  const monthLabels: { month: string, colIndex: number }[] = [];
  let lastMonth = -1;
  dates.forEach((date, i) => {
    if (i % 7 === 0) {
      const m = new Date(date).getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ month: new Date(date).toLocaleString('default', { month: 'short' }), colIndex: i / 7 });
        lastMonth = m;
      }
    }
  });

  return (
    <div className="mb-8 rounded-xl glass-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Consistency Map
          </h2>
          <p className="text-sm text-slate-400 mt-1">Last 6 months of habit activity</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="h-32 flex items-center justify-center text-slate-500 animate-pulse">Loading heatmap...</div>
      ) : (
        <div className="relative w-full overflow-x-auto pb-4 custom-scrollbar">
          <div className="min-w-max flex gap-2">
            {/* Days of week labels */}
            <div className="flex flex-col gap-1.5 text-xs font-medium text-slate-500 pt-6 pr-2">
              <div className="h-3.5"></div>
              <div className="h-3.5 flex items-center">Mon</div>
              <div className="h-3.5"></div>
              <div className="h-3.5 flex items-center">Wed</div>
              <div className="h-3.5"></div>
              <div className="h-3.5 flex items-center">Fri</div>
              <div className="h-3.5"></div>
            </div>

            <div className="flex flex-col gap-2">
              {/* Month labels row */}
              <div className="flex relative h-4 text-xs font-medium text-slate-500">
                {monthLabels.map((lbl, idx) => (
                  <span key={idx} className="absolute" style={{ left: `${lbl.colIndex * (14 + 4)}px` }}>
                    {lbl.month}
                  </span>
                ))}
              </div>
              
              {/* Heatmap Grid */}
              <div 
                className="grid gap-1.5" 
                style={{ 
                  gridTemplateRows: 'repeat(7, 14px)',
                  gridAutoFlow: 'column',
                  gridAutoColumns: '14px'
                }}
              >
                {dates.map((date) => {
                  const rate = data?.days?.[date] || 0;
                  return (
                    <div
                      key={date}
                      title={`${date}: ${Math.round(rate * 100)}%`}
                      className={`h-3.5 w-3.5 rounded-sm transition-all duration-300 hover:ring-2 hover:ring-slate-300 hover:scale-125 cursor-pointer ${getHeatmapColor(rate)}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-end gap-2 text-xs font-medium text-slate-400">
            <span>Less</span>
            <div className="h-3 w-3 rounded-sm bg-slate-800" />
            <div className="h-3 w-3 rounded-sm bg-emerald-900/60" />
            <div className="h-3 w-3 rounded-sm bg-emerald-700/80" />
            <div className="h-3 w-3 rounded-sm bg-emerald-500" />
            <div className="h-3 w-3 rounded-sm bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  );
}
