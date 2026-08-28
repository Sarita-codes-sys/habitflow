import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';

interface ProgressHeatmapProps {
  habits: any[];
}

export default function ProgressHeatmap({ habits = [] }: ProgressHeatmapProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.lastCompletedDate === todayStr).length;
  const percent = totalHabits === 0 ? 0 : Math.round((completedToday / totalHabits) * 100);
  
  const animPercent = useCountUp(percent);
  const animCompleted = useCountUp(completedToday);

  // Generate last 28 days (7 columns x 4 rows)
  const last28Days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return d.toISOString().split('T')[0];
  });

  // Calculate heatmap state for last 5 days
  const getDayStatus = (dateStr: string) => {
    if (totalHabits === 0) return 'empty';
    const completed = habits.filter(h => h.completions?.includes(dateStr)).length;
    if (completed === 0) return 'empty';
    if (completed === totalHabits) return 'perfect';
    if (completed >= totalHabits / 2) return 'good';
    return 'partial';
  };

  const getColorClass = (status: string) => {
    switch (status) {
      case 'perfect': return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
      case 'good': return 'bg-green-400/80';
      case 'partial': return 'bg-yellow-500/80';
      default: return 'bg-slate-800/50';
    }
  };

  return (
    <div className="mb-8 grid grid-cols-2 gap-4">
      {/* Today's Progress */}
      <div className="rounded-2xl glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden group">
        <h3 className="text-sm font-semibold text-slate-400 mb-4 tracking-wide uppercase">Today's Progress</h3>
        
        <div className="relative flex items-center justify-center mt-4 mb-2">
          <svg className="h-40 w-40 -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              className="text-slate-800 stroke-current"
              strokeWidth="6"
              cx="50"
              cy="50"
              r="44"
              fill="transparent"
            />
            <circle
              className="text-blue-500 stroke-current transition-all duration-1000 ease-out"
              strokeWidth="6"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="44"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={(2 * Math.PI * 44) - ((animPercent / 100) * (2 * Math.PI * 44))}
              style={{ filter: 'drop-shadow(0px 0px 6px rgba(59,130,246,0.5))' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-white">{animPercent}%</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {animCompleted} / {totalHabits} Habits
            </span>
          </div>
        </div>
        <p className="mt-3 text-[14px] font-semibold text-slate-300">
          {percent === 100 ? "Amazing work! 🎉" : percent >= 50 ? "Almost there! 🔥" : totalHabits === 0 ? "Add a habit to start!" : "Keep going 💪"}
        </p>
      </div>

      {/* GitHub-style Heatmap */}
      <div className="rounded-2xl glass-card p-6 flex flex-col items-center justify-center">
        <h3 className="text-sm font-semibold text-slate-400 mb-6 tracking-wide uppercase">Past 4 Weeks</h3>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {last28Days.map(date => (
            <div 
              key={date}
              title={date}
              className={`h-4 w-4 sm:h-5 sm:w-5 rounded-[4px] transition-colors duration-500 hover:scale-110 ${getColorClass(getDayStatus(date))}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
