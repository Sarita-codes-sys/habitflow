import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { useAuth } from '../store/AuthContext';
import HabitCard from '../components/habit/HabitCard';
import HabitModal from '../components/habit/HabitModal';
import HeroStatistics from '../components/dashboard/HeroStatistics';
import ProgressHeatmap from '../components/dashboard/ProgressHeatmap';
import AICoachWidget from '../components/dashboard/AICoachWidget';
import { Flame, LogOut, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<any>(null);

  // Category State
  const [showCategories, setShowCategories] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁');
  
  const fetchCategories = async () => {
    try {
      const res = await client.get('/categories');
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await client.post('/categories', { name: newCatName, icon: newCatIcon });
      setNewCatName('');
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Habits in it will become uncategorized.')) return;
    try {
      await client.delete(`/categories/${id}`);
      fetchCategories();
      refetch(); // Refetch habits since their category might have changed
    } catch (err) {
      console.error(err);
    }
  };
  
  const { data: habits, refetch, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const res = await client.get('/habits');
      return res.data;
    }
  });

  const handleSaveHabit = async (data: any) => {
    if (selectedHabit) {
      await client.put(`/habits/${selectedHabit.id}`, data);
    } else {
      await client.post('/habits', data);
    }
    refetch();
  };

  const handleDelete = async (id: number) => {
    try {
      await client.delete(`/habits/${id}`);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const completedToday = (habits || []).filter((h: any) => h.lastCompletedDate === new Date().toISOString().split('T')[0]).length;
  const totalHabits = (habits || []).length;
  const maxStreak = habits && habits.length > 0 ? Math.max(...habits.map((h: any) => h.currentStreak || 0)) : 0;

  React.useEffect(() => {
    if (totalHabits > 0 && completedToday === totalHabits) {
      // Fire massive confetti!
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#3b82f6', '#8b5cf6', '#10b981']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#3b82f6', '#8b5cf6', '#10b981']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [completedToday, totalHabits]);

  return (
    <div className="w-full">
      <main className="mx-auto max-w-4xl pt-4 pb-32">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
           <div>
             <h1 className="text-[28px] font-bold text-white tracking-tight mb-4">
               👋 Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.displayName || user?.email?.split('@')[0] || 'User'}
             </h1>
             <p className="text-slate-300 font-medium text-sm mb-1">
               {new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
             </p>
             <p className="text-slate-400 text-sm">
               {totalHabits === 0 
                 ? "Let's build some positive habits today!" 
                 : (totalHabits - completedToday) > 0 
                   ? `You're ${totalHabits - completedToday} habits away from keeping your streak!`
                   : "Amazing! You've completed all your habits for today! 🎉"}
             </p>
           </div>
           <div className="flex items-center gap-2 text-orange-400 font-bold bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20 shadow-sm mt-1">
             <Flame size={18} />
             <span className="text-sm">{maxStreak} Day Streak</span>
           </div>
        </div>
        
        <HeroStatistics habits={habits || []} />
        <ProgressHeatmap habits={habits || []} />

        <div className="mb-6 mt-10 flex items-center justify-between">
          <h2 className="text-[24px] font-bold text-white tracking-tight">Today's Habits</h2>
          <button 
            onClick={() => { setSelectedHabit(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-500"
          >
            <Plus size={18} />
            Add Habit
          </button>
        </div>

        {/* Habit Modal */}
        <HabitModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedHabit(null); }}
          onSave={handleSaveHabit}
          initialData={selectedHabit}
        />

        {isLoading ? (
          <div className="text-center text-slate-400">Loading habits...</div>
        ) : !habits || habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl glass-card p-12 text-center shadow-2xl mt-8">
            <div className="mb-6 h-48 w-48 overflow-hidden rounded-full border-4 border-slate-700/50 shadow-[0_0_40px_rgba(59,130,246,0.2)]">
              <img 
                src="/empty-state.jpg" 
                alt="Growth illustration" 
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
              />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-white">🚀 Build your first habit</h3>
            <p className="mb-8 max-w-md text-slate-400">
              Small habits become big transformations. Start tracking your daily goals and watch yourself level up!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-blue-400 hover:to-indigo-500 hover:shadow-blue-500/25"
            >
              <Plus size={20} />
              <span>Create My First Habit</span>
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Timeline UI */}
            {(() => {
              const safeHabits = habits || [];
              const scheduled = safeHabits.filter((h: any) => h.timeOfDay).sort((a: any, b: any) => a.timeOfDay.localeCompare(b.timeOfDay));
              const anytime = safeHabits.filter((h: any) => !h.timeOfDay);

              const formatTime = (time: string) => {
                const [h, m] = time.split(':');
                const hour = parseInt(h);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const formattedHour = hour % 12 || 12;
                return m === '00' ? `${formattedHour} ${ampm}` : `${formattedHour}:${m} ${ampm}`;
              };

              return (
                <div className="relative">
                  {scheduled.length > 0 && (
                    <div className="relative pl-6 sm:pl-16 md:pl-24 mb-10">
                      {/* Timeline Line */}
                      <div className="absolute left-[9px] sm:left-[35px] md:left-[67px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-pink-500/50 rounded-full" />
                      
                      <div className="space-y-8">
                        {scheduled.map((habit: any) => (
                          <div key={habit.id} className="relative">
                            {/* Timeline Node & Time */}
                            <div className="absolute -left-6 sm:-left-[45px] md:-left-[77px] top-1/2 -translate-y-1/2 flex items-center justify-end w-[60px] sm:w-[80px] md:w-[100px]">
                              <span className="text-[12px] md:text-[14px] font-bold text-slate-400 w-full text-right pr-6 md:pr-10">{formatTime(habit.timeOfDay)}</span>
                              <div className="absolute right-[4px] md:right-[6px] h-3 w-3 rounded-full bg-blue-500 ring-4 ring-slate-950 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                            </div>
                            
                            <HabitCard 
                              habit={habit} 
                              onComplete={refetch} 
                              onEdit={(h) => { setSelectedHabit(h); setIsModalOpen(true); }}
                              onDelete={handleDelete} 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {anytime.length > 0 && (
                    <div className="pl-0 sm:pl-16 md:pl-24">
                      {scheduled.length > 0 && <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 ml-2">Anytime</h3>}
                      <div className="space-y-4">
                        {anytime.map((habit: any) => (
                          <HabitCard 
                            key={habit.id} 
                            habit={habit} 
                            onComplete={refetch} 
                            onEdit={(h) => { setSelectedHabit(h); setIsModalOpen(true); }} 
                            onDelete={handleDelete} 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
        
        <div className="mt-12">
          <AICoachWidget habits={habits || []} />
        </div>

        <div className="fixed bottom-8 right-8 z-40 group flex flex-col gap-3">
          <button
            onClick={() => setShowCategories(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-slate-800 border border-slate-700 px-4 py-3 font-semibold text-slate-300 shadow-xl transition-all duration-300 hover:scale-105 hover:text-white"
          >
            <span>📁 Manage Categories</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="relative flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 font-semibold text-white shadow-xl shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/50"
          >
            <Plus size={24} />
            <span>Add Habit</span>
          </button>
        </div>

        {/* Manage Categories Modal */}
        {showCategories && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 transition-all animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl glass-card p-6 shadow-2xl border border-slate-700 bg-slate-900 animate-in zoom-in-95">
              <h3 className="text-xl font-bold text-white mb-4">Manage Categories</h3>
              
              <div className="space-y-2 max-h-60 overflow-y-auto mb-6 custom-scrollbar pr-2">
                {categories.length === 0 ? (
                  <p className="text-slate-500 text-sm italic text-center py-4">No categories yet.</p>
                ) : categories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-700/50 bg-slate-800/50">
                    <span className="text-slate-200 font-semibold">{cat.icon} {cat.name}</span>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/20">Delete</button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCreateCategory} className="border-t border-slate-700 pt-4">
                <h4 className="text-sm font-bold text-slate-400 mb-3">Add New Category</h4>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Icon (e.g. 🏃)"
                    className="w-16 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-center text-white focus:border-blue-500 focus:outline-none"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Category Name"
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    required
                  />
                  <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition">Add</button>
                </div>
                <div className="flex justify-end">
                   <button type="button" onClick={() => setShowCategories(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition">Close</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
