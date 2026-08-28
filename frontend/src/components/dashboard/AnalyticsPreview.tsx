import React from 'react';
import { TrendingUp, Award, Calendar } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';

interface AnalyticsPreviewProps {
  habits: any[];
}

export default function AnalyticsPreview({ habits = [] }: AnalyticsPreviewProps) {
  // Calculate active days this week
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - i);
    return d.toISOString().split('T')[0];
  });

  const allCompletions = habits.flatMap(h => h.completions || []);
  const uniqueActiveDays = new Set(allCompletions.filter(date => last7Days.includes(date))).size;
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - i - 7);
    return d.toISOString().split('T')[0];
  });
  const pastUniqueActiveDays = new Set(allCompletions.filter(date => past7Days.includes(date))).size;
  const diff = uniqueActiveDays - pastUniqueActiveDays;
  const trend = diff > 0 ? `+${diff}` : `${diff}`;
  // Calculate most consistent habit based on 7-day completion rate
  let bestHabit = { name: 'No Data Yet', percent: 0, icon: '🎯' };
  
  if (habits.length > 0) {
    const sorted = [...habits].sort((a, b) => {
      const aRate = (a.completions?.length || 0) / 7;
      const bRate = (b.completions?.length || 0) / 7;
      if (aRate === bRate) return b.currentStreak - a.currentStreak;
      return bRate - aRate;
    });
    
    if (sorted[0]) {
      bestHabit = {
        name: sorted[0].name,
        percent: Math.round(((sorted[0].completions?.length || 0) / 7) * 100),
        icon: sorted[0].name.toLowerCase().includes('read') ? '📚' : 
              sorted[0].name.toLowerCase().includes('water') ? '💧' : 
              sorted[0].name.toLowerCase().includes('run') ? '🏃' : '⭐'
      };
    }
  }

  // Animation values
  const animDays = useCountUp(uniqueActiveDays);
  const animPercent = useCountUp(bestHabit.percent);

  return (
    <div className="mb-8 grid grid-cols-2 gap-4">
      {/* This Week Card */}
      <div className="glass-card rounded-xl p-4 flex flex-col justify-between group">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-blue-400">
            <Calendar size={18} />
            <span className="text-[12px] font-bold uppercase tracking-wider">This Week</span>
          </div>
          <span className="text-[12px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">{trend}</span>
        </div>
        
        <div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-[28px] font-bold text-white leading-none">{animDays}</span>
            <span className="text-[14px] font-medium text-slate-400 mb-1">/ 7 Days Active</span>
          </div>
          
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out"
              style={{ width: `${(uniqueActiveDays / 7) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Most Consistent Card */}
      <div className="glass-card rounded-xl p-4 flex flex-col justify-between group">
        <div className="flex items-center gap-2 text-purple-400 mb-4">
          <Award size={18} />
          <span className="text-[12px] font-bold uppercase tracking-wider">Most Consistent</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[18px] font-bold text-white truncate max-w-[120px] md:max-w-xs flex items-center gap-2">
              <span>{bestHabit.icon}</span> {bestHabit.name}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[28px] font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent leading-none">
              {animPercent}%
            </span>
            <span className="text-[12px] font-medium text-slate-400 mt-1">7-Day Success</span>
          </div>
        </div>
      </div>
    </div>
  );
}
