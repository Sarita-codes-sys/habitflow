import React from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import { Trophy, Flame, Zap, BookOpen, Droplets, Lock } from 'lucide-react';

const BADGES = [
  { id: 'FIRST_HABIT', title: 'First Habit', description: 'Complete your very first habit', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { id: '7_DAY_STREAK', title: '7 Day Streak', description: 'Maintain a 7-day streak', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/20' },
  { id: 'EARLY_BIRD', title: 'Early Bird', description: 'Complete a habit before 8 AM', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { id: 'BOOKWORM', title: 'Bookworm', description: 'Complete a reading or study habit', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { id: 'HYDRATION_HERO', title: 'Hydration Hero', description: 'Complete a water habit', icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
];

export default function AchievementBadges() {
  const { data: earnedBadges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const res = await client.get('/analytics/badges');
      return res.data;
    }
  });

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-white mb-4">Achievements</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {BADGES.map(badge => {
          const isEarned = earnedBadges.includes(badge.id);
          const Icon = isEarned ? badge.icon : Lock;
          
          return (
            <div 
              key={badge.id}
              title={badge.description}
              className={`relative overflow-hidden rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                isEarned 
                  ? `glass-card hover:-translate-y-1 hover:shadow-lg hover:shadow-${badge.color.split('-')[1]}/20` 
                  : 'glass-card opacity-50 grayscale'
              }`}
            >
              {isEarned && (
                <div className={`absolute inset-0 opacity-10 bg-gradient-to-br from-transparent to-${badge.color.split('-')[1]}/50`} />
              )}
              
              <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full transition-transform ${isEarned ? badge.bg + ' ' + badge.color : 'bg-slate-700 text-slate-500'}`}>
                <Icon size={28} className={isEarned ? 'drop-shadow-lg' : ''} />
              </div>
              
              <h3 className={`text-sm font-bold ${isEarned ? 'text-white' : 'text-slate-400'}`}>
                {badge.title}
              </h3>
              
              {isEarned && (
                <span className="mt-1 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Unlocked
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
