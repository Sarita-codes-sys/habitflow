import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any | null;
}

export default function HabitModal({ isOpen, onClose, onSave, initialData }: HabitModalProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [targetPerWeek, setTargetPerWeek] = useState<number>(7);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await client.get('/categories');
      return res.data;
    },
    enabled: isOpen
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setCategoryId(initialData.categoryId ? initialData.categoryId.toString() : '');
        setFrequency(initialData.frequency || 'DAILY');
        setTargetPerWeek(initialData.targetPerWeek || 7);
        setTimeOfDay(initialData.timeOfDay || '');
      } else {
        setName('');
        setCategoryId('');
        setFrequency('DAILY');
        setTargetPerWeek(7);
        setTimeOfDay('');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      await onSave({
        name,
        categoryId: categoryId ? BigInt(categoryId) : null,
        frequency,
        targetPerWeek: frequency === 'DAILY' ? null : targetPerWeek,
        timeOfDay: timeOfDay || null
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              {initialData ? 'Edit Habit' : 'Create New Habit'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-1.5">Habit Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Drink 4L Water"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-1.5">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="">General</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-1.5">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as 'DAILY' | 'WEEKLY')}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-1.5">Goal (Times/Week)</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  disabled={frequency === 'DAILY'}
                  value={frequency === 'DAILY' ? 7 : targetPerWeek}
                  onChange={(e) => setTargetPerWeek(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-1.5">Reminder Time (Optional)</label>
              <input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? 'Saving...' : (
                  <>
                    <Check size={18} />
                    {initialData ? 'Save Changes' : 'Create Habit'}
                  </>
                )}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
