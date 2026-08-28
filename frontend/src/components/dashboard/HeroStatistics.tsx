import React from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import { Flame, CheckCircle2, TrendingUp, Star } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';

interface HeroStatisticsProps {
  habits: any[];
}

export default function HeroStatistics({ habits = [] }: HeroStatisticsProps) {
  const { data: analytics } = useQuery({
    queryKey: ['analyticsScore'],
    queryFn: async () => {
      const res = await client.get('/analytics/productivity-score');
      return res.data;
    }
  });

  const { data: xpData } = useQuery({
    queryKey: ['xpData'],
    queryFn: async () => {
      const res = await client.get('/analytics/xp');
      return res.data;
    }
  });

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Calculate max streak
  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.currentStreak || 0)) : 0;
  
  // Calculate completed today
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.lastCompletedDate === todayStr).length;

  // XP logic
  const currentXP = xpData?.currentXP || 0;

  // Consistency score
  const consistencyTarget = analytics?.score || Math.round((completedToday / (totalHabits || 1)) * 100);

  // Animated Values
  const animStreak = useCountUp(maxStreak);
  const animCompleted = useCountUp(completedToday);
  const animTotal = useCountUp(totalHabits);
  const animConsistency = useCountUp(consistencyTarget);
  const animXP = useCountUp(currentXP, 1000);

  return (
    <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      
      {/* Streak */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center group hover:-translate-y-1 transition-all duration-300 border border-slate-700/50">
        <span className="font-bold text-xl sm:text-2xl text-white tracking-tight mb-1 flex items-center gap-2">
          <span className="text-2xl">🔥</span> {animStreak}
        </span>
        <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Day Streak</span>
      </div>

      {/* XP */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center group hover:-translate-y-1 transition-all duration-300 border border-slate-700/50">
        <span className="font-bold text-xl sm:text-2xl text-white tracking-tight mb-1 flex items-center gap-2">
          <span className="text-2xl">⭐</span> {animXP}
        </span>
        <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">XP</span>
      </div>

      {/* Today */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center group hover:-translate-y-1 transition-all duration-300 border border-slate-700/50">
        <span className="font-bold text-xl sm:text-2xl text-white tracking-tight mb-1 flex items-center gap-2">
          <span className="text-2xl">✅</span> {animCompleted}/{animTotal}
        </span>
        <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Completed</span>
      </div>

      {/* Consistency */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center group hover:-translate-y-1 transition-all duration-300 border border-slate-700/50">
        <span className="font-bold text-xl sm:text-2xl text-white tracking-tight mb-1 flex items-center gap-2">
          <span className="text-2xl">📈</span> {animConsistency}%
        </span>
        <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest text-balance">Weekly Success</span>
      </div>
      
    </div>
  );
}
