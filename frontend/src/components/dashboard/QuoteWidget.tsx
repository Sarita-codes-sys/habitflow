import React from 'react';
import { Quote } from 'lucide-react';

const QUOTES = [
  "Success is the sum of small efforts, repeated day in and day out.",
  "Motivation is what gets you started. Habit is what keeps you going.",
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
  "Chains of habit are too light to be felt until they are too heavy to be broken.",
  "Small daily improvements over time lead to stunning results.",
  "The secret of your future is hidden in your daily routine.",
  "You do not rise to the level of your goals. You fall to the level of your systems.",
  "Drop by drop is the water pot filled."
];

interface QuoteWidgetProps {
  totalHabits: number;
  completedToday: number;
}

export default function QuoteWidget({ totalHabits, completedToday }: QuoteWidgetProps) {
  // Use today's date to pick a "random" quote that stays consistent for the day
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const quoteIndex = dayOfYear % QUOTES.length;
  const quote = QUOTES[quoteIndex];
  
  const targetGoal = totalHabits > 0 ? totalHabits : 3;
  const remaining = Math.max(0, targetGoal - completedToday);

  return (
    <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 p-6 border border-blue-500/20 shadow-lg relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 text-blue-500/10 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
        <Quote size={120} />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 text-blue-400">
            <Quote size={16} className="rotate-180" />
            <span className="text-xs font-bold uppercase tracking-widest">Quote of the Day</span>
          </div>
          <p className="text-lg md:text-xl font-medium text-slate-200 italic leading-relaxed">
            "{quote}"
          </p>
        </div>
        
        <div className="md:border-l border-slate-700 md:pl-6 flex flex-col items-center md:items-start min-w-[180px]">
          <span className="text-sm font-bold text-slate-400 mb-1">Today's Goal:</span>
          {remaining > 0 ? (
            <div className="text-white font-semibold">
              Complete <span className="text-2xl text-blue-400 mx-1">{remaining}</span> more {remaining === 1 ? 'habit' : 'habits'}
            </div>
          ) : targetGoal > 0 ? (
            <div className="text-emerald-400 font-semibold flex items-center gap-2">
              <span className="text-2xl">🎉</span> Goal Crushed!
            </div>
          ) : (
            <div className="text-white font-semibold">
              Add a habit to start!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
