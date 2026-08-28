import { useState, useEffect } from 'react';
import client from '../../api/client';
import { Flame, CheckCircle, Activity, BookOpen, Dumbbell, Droplets, Moon, Target, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import ConfirmModal from '../ui/ConfirmModal';

const formatTime = (timeStr?: string | null) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${m} ${ampm}`;
};

interface HabitProps {
  habit: {
    id: number;
    name: string;
    categoryName?: string;
    frequency: string;
    currentStreak: number;
    lastCompletedDate: string | null;
    completions?: string[];
    timeOfDay?: string | null;
  };
  onComplete: () => void;
  onEdit: (habit: any) => void;
  onDelete: (habitId: number) => void;
}

const getHabitStyle = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('read') || lowerName.includes('study') || lowerName.includes('book')) {
    return { icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/10', bar: 'from-purple-500 to-fuchsia-500' };
  }
  if (lowerName.includes('work') || lowerName.includes('job') || lowerName.includes('office')) {
    return { icon: Target, color: 'text-indigo-400', bg: 'bg-indigo-500/10', bar: 'from-indigo-500 to-blue-500' };
  }
  if (lowerName.includes('gym') || lowerName.includes('exercise') || lowerName.includes('run') || lowerName.includes('fitness')) {
    return { icon: Dumbbell, color: 'text-orange-400', bg: 'bg-orange-500/10', bar: 'from-orange-500 to-red-500' };
  }
  if (lowerName.includes('water') || lowerName.includes('drink')) {
    return { icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-500/10', bar: 'from-cyan-500 to-blue-500' };
  }
  if (lowerName.includes('meditation') || lowerName.includes('mind') || lowerName.includes('yoga')) {
    return { icon: Activity, color: 'text-green-400', bg: 'bg-green-500/10', bar: 'from-green-500 to-emerald-500' };
  }
  if (lowerName.includes('sleep') || lowerName.includes('bed')) {
    return { icon: Moon, color: 'text-blue-400', bg: 'bg-blue-500/10', bar: 'from-blue-500 to-indigo-500' };
  }
  return { icon: Target, color: 'text-teal-400', bg: 'bg-teal-500/10', bar: 'from-teal-500 to-emerald-500' };
};

export default function HabitCard({ habit, onComplete, onEdit, onDelete }: HabitProps) {
  const [loading, setLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = habit.lastCompletedDate === today;

  const style = getHabitStyle(habit.name);
  const Icon = style.icon;

  const nextMilestone = Math.ceil((habit.currentStreak + 1) / 10) * 10;
  const progressPercent = Math.min((habit.currentStreak / nextMilestone) * 100, 100);

  const handleComplete = async () => {
    if (isCompletedToday || loading) return;
    setLoading(true);
    setIsCompleting(true);
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4ade80', '#3b82f6', '#f472b6']
    });

    try {
      await client.post(`/habits/${habit.id}/complete`);
      setShowXP(true);
      setTimeout(() => {
        setIsCompleting(false);
        onComplete();
      }, 500);
      
      setTimeout(() => setShowXP(false), 2000);
    } catch (err) {
      console.error('Failed to complete habit', err);
      setIsCompleting(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl glass-card p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-slate-900/40 border border-slate-700/50 group">
      
      {/* Top Row: Icon & Name */}
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${style.bg} ${style.color}`}>
          <Icon size={28} />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">{habit.name}</h3>
      </div>
      
      {/* Meta Row: Category, Time, Difficulty */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-4 text-sm font-semibold text-slate-400">
        <span className="text-slate-300">{habit.categoryName || 'General'}</span>
        {habit.timeOfDay && (
          <>
            <span className="text-slate-600">•</span>
            <span>{formatTime(habit.timeOfDay)}</span>
          </>
        )}
        <span className="text-slate-600">•</span>
        <span>Medium</span>
      </div>

      {/* Progress Section */}
      <div className="mt-5 mb-6">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Progress</div>
        <div className="flex items-center gap-3 font-mono text-sm sm:text-base">
          <span className={`${style.color} tracking-tight`}>
            {'█'.repeat(Math.round((progressPercent / 100) * 10))}
            <span className="opacity-30">
              {'█'.repeat(10 - Math.round((progressPercent / 100) * 10))}
            </span>
          </span>
          <span className="text-white font-bold">{Math.round(progressPercent)}%</span>
        </div>
      </div>

      {/* Bottom Row: Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <button 
            onClick={handleComplete}
            disabled={isCompletedToday || loading}
            className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-all duration-300 border ${
              isCompletedToday || isCompleting
                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]'
            }`}
          >
            {isCompletedToday || isCompleting ? (
              <>
                <CheckCircle size={16} className="text-green-400" />
                <span>Completed</span>
              </>
            ) : (
              <span>Complete</span>
            )}
          </button>
          
          {showXP && (
            <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 text-sm font-bold text-purple-400 animate-float-up drop-shadow-[0_0_8px_rgba(192,38,211,0.8)] whitespace-nowrap">
              +20 XP
            </div>
          )}
        </div>

        <button 
          onClick={() => onEdit(habit)}
          className="rounded-xl px-4 py-2 text-sm font-bold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all"
        >
          Edit
        </button>

        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="rounded-xl px-4 py-2 text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
        >
          Delete
        </button>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Habit"
        message="Are you sure you want to delete this habit? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(habit.id);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

    </div>
  );
}
