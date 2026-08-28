import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface AICoachWidgetProps {
  habits: any[];
}

export default function AICoachWidget({ habits = [] }: AICoachWidgetProps) {
  const getCoachMessage = () => {
    if (habits.length === 0) {
      return {
        title: "Welcome to HabitFlow!",
        message: "I'm your AI Coach. Add your first habit below, and I'll start tracking your progress and giving you personalized advice.",
        color: "text-blue-400",
        bg: "bg-blue-500/10"
      };
    }

    const activeHabits = habits.filter(h => h.currentStreak > 0);
    const bestHabit = [...habits].sort((a, b) => b.currentStreak - a.currentStreak)[0];
    const strugglingHabit = habits.find(h => h.currentStreak === 0 && h.completions && h.completions.length > 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(h => h.lastCompletedDate === todayStr).length;

    // Rule 1: One habit left today
    if (habits.length > 1 && completedToday === habits.length - 1) {
      return {
        title: "Almost Done!",
        message: "You're doing well. Complete one more habit to maintain your streak.",
        color: "text-blue-400",
        bg: "bg-blue-500/10"
      };
    }

    // Rule 2: Awesome Streak
    if (bestHabit && bestHabit.currentStreak >= 7) {
      return {
        title: "Incredible Momentum!",
        message: `Great job! You've completed ${bestHabit.name} for ${bestHabit.currentStreak} days. Maybe consider increasing your goal slightly to keep challenging yourself?`,
        color: "text-purple-400",
        bg: "bg-purple-500/10"
      };
    }

    // Rule 3: Struggling Habit
    if (strugglingHabit) {
      return {
        title: "Rebuild Your Habit",
        message: `I noticed you missed ${strugglingHabit.name} recently. Don't worry! Try doing it for just 2 minutes today to get back on track.`,
        color: "text-orange-400",
        bg: "bg-orange-500/10"
      };
    }

    // Rule 4: Perfect Day yesterday/today
    if (habits.length > 0 && activeHabits.length === habits.length) {
      return {
        title: "You're on Fire! 🔥",
        message: "Every single one of your habits has an active streak. Keep riding this amazing wave of consistency!",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10"
      };
    }

    // Default
    return {
      title: "Daily Tip",
      message: "Consistency is more important than intensity. Focus on just showing up today, even if it's only for a few minutes.",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10"
    };
  };

  const coach = getCoachMessage();

  return (
    <div className="mb-6 rounded-2xl glass-card p-6 relative overflow-hidden border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] group hover:-translate-y-1 transition-transform duration-300">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-600/10 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none group-hover:from-purple-500/20 transition-colors duration-500" />
      
      <div className="relative z-10 flex gap-4">
        <div className="flex-shrink-0">
          <div className="relative">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${coach.bg} ${coach.color} border border-white/5`}>
              <Bot size={24} />
            </div>
            <Sparkles size={14} className="absolute -top-1 -right-1 text-purple-400 animate-pulse" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[16px] font-bold text-white tracking-wide">🤖 AI Coach</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              Beta
            </span>
          </div>
          <p className="text-[14px] text-slate-300 leading-relaxed font-medium">
            <span className="text-white font-bold block mb-0.5">{coach.title}</span>
            {coach.message}
          </p>
        </div>
      </div>
    </div>
  );
}
