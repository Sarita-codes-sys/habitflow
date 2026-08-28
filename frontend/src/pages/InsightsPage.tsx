import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { Lightbulb, AlertCircle, Trophy, Activity, Brain, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';
import { isToday, isYesterday, formatDistanceToNow, differenceInMinutes, format } from 'date-fns';
import { useState, useEffect } from 'react';
import HabitModal from '../components/habit/HabitModal';
import confetti from 'canvas-confetti';

const NumberCounter = ({ value, duration = 1000 }: { value: number, duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <>{count}</>;
};

const formatTimestamp = (dateString: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const minutes = Math.abs(differenceInMinutes(new Date(), d));
  
  if (minutes < 1) return 'Just now';
  
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
  if (isYesterday(d)) return 'Yesterday';
  
  return formatDistanceToNow(d, { addSuffix: true });
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
};

const getHabitIcon = (title: string, description?: string) => {
  const n = (title + ' ' + (description || '')).toLowerCase();
  if (n.includes('run') || n.includes('jog')) return '🏃';
  if (n.includes('water') || n.includes('drink')) return '💧';
  if (n.includes('read') || n.includes('book')) return '📚';
  if (n.includes('gym') || n.includes('workout') || n.includes('lift')) return '💪';
  if (n.includes('meditat') || n.includes('yoga') || n.includes('breath')) return '🧘';
  if (n.includes('code') || n.includes('program') || n.includes('dev')) return '💻';
  if (n.includes('sleep') || n.includes('bed')) return '🌙';
  if (n.includes('consistency') || n.includes('growth')) return '📈';
  if (n.includes('trajectory') || n.includes('drop')) return '📉';
  if (n.includes('routine') || n.includes('schedule')) return '📅';
  return '✨';
};

const PriorityChip = ({ priority }: { priority?: string }) => {
  if (!priority) return null;
  const colors: Record<string, string> = {
    HIGH: 'text-red-400 bg-red-500/10 border-red-500/20',
    MEDIUM: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    LOW: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  };
  const theme = colors[priority] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';

  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${theme} w-fit`}>
      {priority}
    </span>
  );
};

export default function InsightsPage() {
  const [timelineFilter, setTimelineFilter] = useState('All');
  const [snoozedInsights, setSnoozedInsights] = useState<Set<string>>(new Set());
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);

  const { data: serverInsights, isLoading: loadingInsights, refetch: refetchInsights } = useQuery({
    queryKey: ['insights'],
    queryFn: async () => {
      const res = await client.get('/insights');
      return res.data;
    }
  });

  const { data: dynamicInsights, isLoading: loadingDynamic, refetch: refetchDynamic } = useQuery({
    queryKey: ['dynamic-insights'],
    queryFn: async () => {
      const res = await client.get('/insights/dynamic');
      return res.data;
    }
  });

  const { data: habits, isLoading: loadingHabits, refetch: refetchHabits } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const res = await client.get('/habits');
      return res.data;
    }
  });

  const [showInsightModal, setShowInsightModal] = useState(false);
  const [editingInsight, setEditingInsight] = useState<any>(null);
  const [insightForm, setInsightForm] = useState({ message: '', ruleId: 'CUSTOM' });

  const handleSaveInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insightForm.message.trim()) return;

    try {
      if (editingInsight) {
        await client.put(`/insights/${editingInsight.id}`, insightForm);
      } else {
        await client.post('/insights', insightForm);
      }
      setShowInsightModal(false);
      setEditingInsight(null);
      setInsightForm({ message: '', ruleId: 'CUSTOM' });
      refetchInsights();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInsight = async (id: string) => {
    if (!confirm('Are you sure you want to delete this insight?')) return;
    try {
      await client.delete(`/insights/${id}`);
      refetchInsights();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteHabit = async (habitId: number) => {
    if (!habitId) return;
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#3b82f6', '#f472b6']
      });
      await client.post(`/habits/${habitId}/complete`);
      refetchHabits();
      refetchDynamic();
    } catch (err) {
      console.error('Failed to complete habit from insights', err);
    }
  };

  const handleSnooze = (insightId: string) => {
    setSnoozedInsights(prev => {
      const newSet = new Set(prev);
      newSet.add(insightId);
      return newSet;
    });
  };

  const handleEditHabit = (habitId: number) => {
    const habitToEdit = habits?.find((h: any) => h.id === habitId);
    if (habitToEdit) {
      setEditingHabit(habitToEdit);
      setIsHabitModalOpen(true);
    }
  };

  // Helper for Comparison
  const getComparison = (currentDays: number, previousDays: number) => {
    let currentTotal = 0;
    let previousTotal = 0;
    const now = new Date();
    
    habits?.forEach((h: any) => {
      h.completions?.forEach((c: any) => {
        const d = new Date(c.completedDate || c);
        const diffTime = Math.abs(now.getTime() - d.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < currentDays) currentTotal++;
        else if (diffDays >= currentDays && diffDays < (currentDays + previousDays)) previousTotal++;
      });
    });

    const totalPossibleCurrent = (habits?.length || 1) * currentDays;
    const totalPossiblePrev = (habits?.length || 1) * previousDays;

    const currentRate = Math.round((currentTotal / totalPossibleCurrent) * 100) || 0;
    const prevRate = Math.round((previousTotal / totalPossiblePrev) * 100) || 0;
    const diff = currentRate - prevRate;

    return { rate: currentRate, diff };
  };

  const combinedInsights = (dynamicInsights || []).filter((i: any) => !snoozedInsights.has(i.id));

  const achievements = combinedInsights.filter((i: any) => i.type === 'positive');
  const warnings = combinedInsights.filter((i: any) => i.type === 'warning');
  const recommendations = combinedInsights.filter((i: any) => i.type === 'suggestion');

  // AI Summary generation
  const weekComparison = getComparison(7, 7);
  const bestStreak = habits?.reduce((max: number, h: any) => Math.max(max, h.streak?.currentStreak || h.currentStreak || 0), 0) || 0;
  
  const completedThisWeek = habits?.reduce((total: number, h: any) => {
    const now = new Date();
    let count = 0;
    h.completions?.forEach((c: any) => {
      const d = new Date(c.completedDate || c);
      if (Math.abs(now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000) count++;
    });
    return total + count;
  }, 0) || 0;

  const sortedHabits = habits?.slice().sort((a: any, b: any) => (b.completions?.length || 0) - (a.completions?.length || 0)) || [];
  const worstHabit = sortedHabits[sortedHabits.length - 1];

  let priorityMessage = "Keep up the momentum on your habits!";
  if (warnings.length > 0) priorityMessage = `⚠ Address ${warnings[0].title} as soon as possible.`;
  else if (recommendations.length > 0) priorityMessage = `💡 ${recommendations[0].title}`;
  else if (achievements.length > 0) priorityMessage = `🏃 Keep up the great work on ${achievements[0].title}!`;

  const getIcon = (ruleId: string) => {
    switch(ruleId) {
      case 'STREAK_RISK': return <AlertCircle className="text-orange-400" size={20} />;
      case 'STREAK_MILESTONE': return <Trophy className="text-emerald-400" size={20} />;
      case 'INACTIVITY_NUDGE': return <Activity className="text-blue-400" size={20} />;
      default: return <Lightbulb className="text-purple-400" size={20} />;
    }
  };

  const timelineSource = serverInsights || [];

  const filteredInsights = timelineSource?.filter((insight: any) => {
    if (timelineFilter === 'All') return true;
    if (timelineFilter === 'Warnings') return insight.ruleId === 'STREAK_RISK';
    if (timelineFilter === 'Achievements') return insight.ruleId === 'STREAK_MILESTONE';
    if (timelineFilter === 'Suggestions') return insight.ruleId === 'INACTIVITY_NUDGE';
    if (timelineFilter === 'Completed') return insight.ruleId === 'COMPLETED'; 
    return true;
  });

  const groupedTimeline = filteredInsights?.reduce((groups: any, insight: any) => {
    let label = 'Older';
    const d = new Date(insight.generatedAt);
    if (isToday(d)) label = 'Today';
    else if (isYesterday(d)) label = 'Yesterday';
    else label = format(d, 'EEEE');
    
    if (!groups[label]) groups[label] = [];
    groups[label].push(insight);
    return groups;
  }, {});

  if (loadingHabits || loadingDynamic) {
    return <div className="p-8 text-slate-400">Loading Intelligence Hub...</div>;
  }

  if (combinedInsights.length === 0 && serverInsights?.length === 0) {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-8 animate-in fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Everything looks great!</h2>
        <p className="text-slate-400 text-lg mb-1">You're on track today.</p>
        <p className="text-slate-500 text-sm">Keep maintaining your habits.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/30 text-blue-400">
          <Brain size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Intelligence Hub</h1>
          <p className="text-slate-400 text-sm">Your AI-powered habit analysis and coaching</p>
        </div>
      </div>

      {/* 1. Dashboard Hero */}
      <div className="rounded-3xl glass-card bg-gradient-to-br from-indigo-900/40 via-slate-900/80 to-slate-900 border border-indigo-500/20 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden animate-slide-up opacity-0" style={{ animationDelay: '100ms' }}>
        
        {/* Background Effects */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

        {/* AI Coach Badge */}
        <div className="hidden md:flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/50 absolute top-6 right-6 backdrop-blur-md shadow-lg animate-fade-in opacity-0" style={{ animationDelay: '500ms' }}>
           <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] animate-pulse">
             🤖
           </div>
           <div className="flex flex-col">
             <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">AI Coach</span>
             <span className="text-[10px] text-slate-400 font-medium mt-0.5">Updated just now</span>
           </div>
        </div>

        <div className="flex-1 relative z-10 w-full animate-fade-in opacity-0" style={{ animationDelay: '300ms' }}>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span>🤖</span> Good {getGreeting()}, Rahul
          </h2>
          
          <div className="flex flex-col gap-2 mt-5">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Overall Score</span>
              <span className="text-emerald-400 font-black text-lg"><NumberCounter value={weekComparison.rate} />%</span>
            </div>
            <div className="h-2.5 w-full max-w-sm bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${weekComparison.rate > 80 ? 'bg-emerald-500' : weekComparison.rate > 50 ? 'bg-blue-500' : 'bg-orange-500'}`} 
                style={{ width: `${weekComparison.rate}%` }} 
              />
            </div>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              You're {weekComparison.diff >= 0 ? 'improving' : 'dropping'} {Math.abs(weekComparison.diff)}% compared to last week.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex-1 w-full flex flex-col justify-center space-y-5 md:border-l md:border-slate-700/50 md:pl-8">
          <div>
             <h3 className="text-[11px] text-blue-400 font-bold uppercase tracking-widest mb-3">Today's Priority</h3>
             <div className="bg-slate-900/60 border border-blue-500/20 p-3.5 rounded-xl text-sm text-slate-200 font-semibold shadow-sm">
               {priorityMessage}
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded-lg border border-orange-500/20 text-sm font-bold shadow-sm">
               🔥 {bestStreak} Day Streak
             </div>
             <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded-lg border border-yellow-500/20 text-sm font-bold shadow-sm">
               ⭐ Level 8
             </div>
          </div>
        </div>
      </div>

      {/* 2. Categorized Highlights (Achievements & Warnings) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Achievements Column */}
        <div className="space-y-4 animate-slide-up opacity-0" style={{ animationDelay: '200ms' }}>
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2.5 border-b border-slate-700/50 pb-3">
             <Trophy size={14} className="text-emerald-400" />
             Achievements
          </h2>
          {achievements.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm glass-card rounded-2xl border border-slate-700/50 bg-slate-800/20">
               Keep building your habits to unlock achievements!
            </div>
          ) : (
            achievements.map((insight: any, i: number) => (
              <div key={insight.id || i} className="glass-card bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800/60 transition-all hover:-translate-y-1 hover:border-emerald-500/30">
                 <div className="flex justify-between items-start mb-3">
                    <PriorityChip priority={insight.priority} />
                    {insight.subtitle && (
                      <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">
                         {insight.subtitle}
                      </span>
                    )}
                 </div>
                 <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                    <span className="text-xl">{getHabitIcon(insight.title)}</span>
                    {insight.title}
                 </h3>
                 <p className="text-sm text-slate-400 leading-relaxed font-medium">
                    {insight.description}
                 </p>
                 {insight.trend && (
                   <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded border border-emerald-500/20 text-emerald-400 bg-emerald-500/10">
                     {insight.trend.direction === 'up' ? <TrendingUp size={12} /> : insight.trend.direction === 'down' ? <TrendingDown size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                     {insight.trend.value}
                   </div>
                 )}
              </div>
            ))
          )}
        </div>

        {/* Warnings Column */}
        <div className="space-y-4 animate-slide-up opacity-0" style={{ animationDelay: '300ms' }}>
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2.5 border-b border-slate-700/50 pb-3">
             <AlertCircle size={14} className="text-orange-400" />
             Needs Attention
          </h2>
          {warnings.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm glass-card rounded-2xl border border-slate-700/50 bg-slate-800/20">
               All good! No pressing issues found.
            </div>
          ) : (
            warnings.map((insight: any, i: number) => (
              <div key={insight.id || i} className="glass-card relative overflow-hidden bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800/60 transition-all hover:-translate-y-1 hover:border-orange-500/30">
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-red-500" />
                 
                 <div className="flex justify-between items-start mb-3">
                    <PriorityChip priority={insight.priority} />
                    {insight.subtitle && (
                      <span className="text-[10px] uppercase tracking-widest text-orange-400 font-bold bg-orange-500/10 px-2 py-1 rounded flex items-center gap-1">
                         <AlertCircle size={10} /> {insight.subtitle}
                      </span>
                    )}
                 </div>
                 <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                    <span className="text-xl">{getHabitIcon(insight.title)}</span>
                    {insight.title}
                 </h3>
                 <p className="text-sm text-slate-400 leading-relaxed font-medium mb-4">
                    {insight.description}
                 </p>
                 
                 <div className="flex gap-2 mt-1">
                    {insight.habitId ? (
                      <>
                        <button onClick={() => handleCompleteHabit(insight.habitId)} className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-lg shadow-orange-500/20 text-[10px] uppercase tracking-wider font-bold py-1.5 rounded transition-all">Complete Now</button>
                        <button onClick={() => handleSnooze(insight.id)} className="flex-1 bg-transparent hover:bg-slate-800 active:scale-95 text-slate-300 border border-slate-600 text-[10px] uppercase tracking-wider font-bold py-1.5 rounded transition-all">Snooze</button>
                        <button onClick={() => handleEditHabit(insight.habitId)} className="flex-1 bg-transparent hover:bg-slate-800/50 active:scale-95 text-slate-500 hover:text-slate-300 text-[10px] uppercase tracking-wider font-bold py-1.5 rounded transition-all">Edit Habit</button>
                      </>
                    ) : (
                      <button onClick={() => handleSnooze(insight.id)} className="flex-1 bg-transparent hover:bg-slate-800 active:scale-95 text-slate-300 border border-slate-600 text-[10px] uppercase tracking-wider font-bold py-1.5 rounded transition-all">Dismiss</button>
                    )}
                 </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Smart Recommendations (AI Coaching) */}
      <div className="animate-slide-up opacity-0" style={{ animationDelay: '400ms' }}>
         <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2.5 border-b border-slate-700/50 pb-3 mb-6">
            <Lightbulb size={14} className="text-purple-400" />
            Smart Recommendations
         </h2>
         
         <div className="grid grid-cols-1 gap-4">
           {recommendations.length === 0 ? (
             <div className="p-6 text-center text-slate-500 text-sm glass-card rounded-2xl border border-slate-700/50 bg-slate-800/20">
               Keep logging habits to receive personalized AI recommendations.
             </div>
           ) : (
             recommendations.map((insight: any, i: number) => (
               <div key={insight.id || i} className="glass-card bg-gradient-to-r from-purple-900/20 to-slate-900 border border-purple-500/20 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-purple-500/10 group">
                 <div className="p-4 bg-purple-500/10 rounded-2xl text-3xl border border-purple-500/20 group-hover:scale-110 transition-transform">
                   {getHabitIcon(insight.title, insight.description)}
                 </div>
                 <div className="flex-1">
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="text-lg font-black text-white">{insight.title}</h3>
                     {insight.confidence && (
                       <div className="text-xs font-bold bg-slate-800 border border-slate-700 px-2 py-1 rounded text-slate-300">
                         AI Confidence: <span className="text-purple-400">{insight.confidence}%</span>
                       </div>
                     )}
                   </div>
                   <p className="text-sm text-slate-300 leading-relaxed font-medium mb-3">{insight.description}</p>
                   
                   {insight.smartRecommendation && (
                     <div className="mt-4 bg-slate-900/80 rounded-xl p-4 border border-slate-700/50 text-sm">
                       <div className="flex items-center gap-3 mb-3">
                         <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded border border-slate-600">{insight.smartRecommendation.from}</span>
                         <span className="text-slate-500">→</span>
                         <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">{insight.smartRecommendation.to}</span>
                       </div>
                       <p className="text-slate-400 mb-2 italic">"{insight.smartRecommendation.reason}"</p>
                       {insight.smartRecommendation.improvement && (
                         <span className="text-xs font-bold text-emerald-400">Expected Improvement: {insight.smartRecommendation.improvement}</span>
                       )}
                     </div>
                   )}
                   
                   {insight.dataPoints && (
                     <p className="text-xs text-slate-500 mt-4 uppercase tracking-widest font-bold">Data: {insight.dataPoints}</p>
                   )}
                 </div>
                 <div className="flex flex-col gap-2 w-full md:w-auto self-stretch justify-center border-t md:border-t-0 md:border-l border-slate-700/50 pt-4 md:pt-0 md:pl-6">
                   {insight.habitId && (
                     <button onClick={() => handleEditHabit(insight.habitId)} className="w-full whitespace-nowrap bg-purple-500 hover:bg-purple-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-purple-500/25 active:scale-95 transition-all">
                       Apply Schedule
                     </button>
                   )}
                   <button onClick={() => handleSnooze(insight.id)} className="w-full whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm px-6 py-2.5 rounded-xl border border-slate-600 active:scale-95 transition-all">
                     Dismiss
                   </button>
                 </div>
               </div>
             ))
           )}
         </div>
      </div>

      {/* 4. Timeline (Server Insights) and Weekly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up opacity-0" style={{ animationDelay: '500ms' }}>
        
        {/* Timeline */}
        <div className="md:col-span-2 rounded-2xl glass-card border border-slate-700/50 bg-slate-800/40 p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-3 mb-4 shrink-0">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2.5">
               <Activity size={14} className="text-blue-400" />
               Recent Insights Timeline
            </h2>
            <div className="flex gap-1.5">
               {['All', 'Warnings', 'Achievements', 'Suggestions'].map(f => (
                 <button
                   key={f}
                   onClick={() => setTimelineFilter(f)}
                   className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded transition-colors ${
                     timelineFilter === f 
                       ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                       : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                   }`}
                 >
                   {f}
                 </button>
               ))}
            </div>
          </div>
          <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 relative">
            {loadingInsights ? (
              <div className="text-slate-500 text-sm">Loading historical insights...</div>
            ) : !groupedTimeline || Object.keys(groupedTimeline).length === 0 ? (
              <div className="text-slate-500 text-sm italic">No insights found for this filter.</div>
            ) : (
              <div className="relative border-l border-slate-700/50 ml-3 space-y-6 pb-2 mt-2">
                {Object.entries(groupedTimeline).map(([dateLabel, items]: [string, any]) => (
                  <div key={dateLabel} className="relative">
                    <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] border-2 border-slate-900" />
                    
                    <div className="pl-6">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                        {dateLabel}
                      </h3>
                      
                      <div className="space-y-3">
                        {items.map((insight: any) => (
                          <div key={insight.id} className="flex gap-4 p-3 rounded-xl bg-slate-900/30 hover:bg-slate-800/50 transition-colors group border border-slate-700/50">
                            <div className="mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                              {getIcon(insight.ruleId)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-300 leading-relaxed font-medium">{insight.message}</p>
                              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mt-1 block">
                                {formatTimestamp(insight.generatedAt)}
                              </span>
                            </div>
                            {insight.ruleId === 'CUSTOM' && (
                              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingInsight(insight); setInsightForm({ message: insight.message, ruleId: 'CUSTOM' }); setShowInsightModal(true); }} className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">Edit</button>
                                <button onClick={() => handleDeleteInsight(insight.id)} className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">Delete</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="rounded-2xl glass-card border border-slate-700/50 bg-slate-800/40 p-5 flex flex-col hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-slate-800/60 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] transition-all duration-300 animate-slide-up opacity-0" style={{ animationDelay: '600ms' }}>
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2.5 border-b border-slate-700/50 pb-3">
            <span className="text-lg">📊</span> Weekly Summary
          </h2>
          <div className="flex-1 flex flex-col justify-center gap-3">
             <div className="flex items-center justify-between bg-slate-900/50 p-3.5 rounded-xl border border-slate-700/50 shadow-sm">
                <span className="text-sm font-medium text-slate-300 flex items-center gap-2.5"><span className="text-emerald-400 text-base">✅</span> Completed</span>
                <span className="font-black text-white"><NumberCounter value={completedThisWeek} /> <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">habits</span></span>
             </div>
             
             <div className="flex items-center justify-between bg-slate-900/50 p-3.5 rounded-xl border border-slate-700/50 shadow-sm">
                <span className="text-sm font-medium text-slate-300 flex items-center gap-2.5"><span className="text-orange-400 text-base">🔥</span> Longest streak</span>
                <span className="font-black text-white"><NumberCounter value={bestStreak} /> <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">days</span></span>
             </div>

             <div className="flex items-center justify-between bg-slate-900/50 p-3.5 rounded-xl border border-slate-700/50 shadow-sm">
                <span className="text-sm font-medium text-slate-300 flex items-center gap-2.5"><span className="text-blue-400 text-base">📈</span> Improved</span>
                <span className={`font-black ${weekComparison.diff >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {weekComparison.diff > 0 ? '+' : ''}<NumberCounter value={weekComparison.diff} />%
                </span>
             </div>

             <div className="flex items-center justify-between bg-slate-900/50 p-3.5 rounded-xl border border-slate-700/50 shadow-sm">
                <span className="text-sm font-medium text-slate-300 flex items-center gap-2.5"><span className="text-red-400 text-base">⚠</span> Needs work</span>
                <span className="font-bold text-slate-400 truncate max-w-[120px]">{worstHabit?.name || 'None'}</span>
             </div>
          </div>
        </div>

      </div>

      {showInsightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-black text-white mb-4">
              {editingInsight ? 'Edit Insight' : 'New Custom Insight'}
            </h3>
            <form onSubmit={handleSaveInsight} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Message</label>
                <textarea 
                  value={insightForm.message}
                  onChange={(e) => setInsightForm({...insightForm, message: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-blue-500 h-24 resize-none"
                  placeholder="E.g., You're doing great with your morning routine!"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowInsightModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 rounded-xl text-sm font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all"
                >
                  Save Insight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Habit Modal */}
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => { setIsHabitModalOpen(false); setEditingHabit(null); }}
        initialData={editingHabit}
        onSave={async (data) => {
          if (editingHabit) await client.put(`/habits/${editingHabit.id}`, data);
          else await client.post('/habits', data);
          refetchHabits();
          refetchDynamic();
          setIsHabitModalOpen(false);
        }}
      />
    </div>
  );
}
