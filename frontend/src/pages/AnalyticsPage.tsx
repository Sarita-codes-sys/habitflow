import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  Download, ChevronDown, FileText, FileJson, FileSpreadsheet,
  Check, TrendingUp, Zap, Flame, Target, Trophy, BarChart3,
  Grid, Activity, Lightbulb, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useCountUp } from '../hooks/useCountUp';
import { useAuth } from '../store/AuthContext';

// ─── helpers ──────────────────────────────────────────────────────────────────
const getCategoryName = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('read') || lower.includes('study') || lower.includes('book')) return 'Learning';
  if (lower.includes('work') || lower.includes('job') || lower.includes('office')) return 'Work';
  if (lower.includes('gym') || lower.includes('exercise') || lower.includes('run') || lower.includes('fitness')) return 'Fitness';
  if (lower.includes('water') || lower.includes('drink')) return 'Health';
  if (lower.includes('meditation') || lower.includes('mind') || lower.includes('yoga')) return 'Mindfulness';
  if (lower.includes('sleep') || lower.includes('bed')) return 'Rest';
  return 'Other';
};

const getColorForRate = (rate: number) => {
  if (rate >= 90) return 'text-emerald-400';
  if (rate >= 70) return 'text-yellow-400';
  if (rate >= 50) return 'text-orange-400';
  return 'text-red-400';
};

const getHeatmapColor = (rate: number) => {
  if (rate === 0) return 'bg-slate-800';
  if (rate < 0.5) return 'bg-orange-900/40';
  if (rate < 0.7) return 'bg-orange-500';
  if (rate < 0.9) return 'bg-yellow-400';
  return 'bg-emerald-400';
};

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#f97316', '#06b6d4', '#10b981', '#f43f5e', '#64748b'];
const TABS = ['Overview', 'Progress', 'Categories', 'History'] as const;
type Tab = typeof TABS[number];

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: 12 },
  itemStyle: { color: '#f8fafc' },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color: string }) => (
  <div className="rounded-2xl p-4 flex flex-col gap-2 glass-card border border-slate-700/50 group hover:-translate-y-0.5 transition-all duration-200">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-lg">{icon}</span>
    </div>
    <div className={`text-2xl font-black ${color}`}>{value}</div>
    {sub && <div className="text-xs text-slate-500 font-medium">{sub}</div>}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { user } = useAuth();
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);
  const [timeFilter, setTimeFilter] = useState('Week');
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node))
        setShowExportMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: productivity } = useQuery({
    queryKey: ['productivityScore'],
    queryFn: () => client.get('/analytics/productivity-score').then(r => r.data),
  });
  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: () => client.get('/habits').then(r => r.data),
  });
  const { data: heatmap } = useQuery({
    queryKey: ['heatmap', year, month],
    queryFn: () => client.get(`/analytics/heatmap?year=${year}&month=${month}`).then(r => r.data),
  });
  const { data: xpData } = useQuery({
    queryKey: ['xp'],
    queryFn: async () => {
      const res = await client.get('/users/me');
      return res.data;
    }
  });

  const { data: dynamicInsights } = useQuery({
    queryKey: ['dynamic-insights'],
    queryFn: async () => {
      const res = await client.get('/insights/dynamic');
      return res.data;
    }
  });

  // ── Derived data ─────────────────────────────────────────────────────────
  const getDaysForFilter = () => ({ 'Today': 1, 'Week': 7, 'Month': 30, 'Year': 90 }[timeFilter] || 7);
  const chartDays = getDaysForFilter();

  const trendData = Array.from({ length: Math.min(chartDays, 14) }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (Math.min(chartDays, 14) - 1 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = habits?.filter((h: any) => h.completions?.includes(dateStr)).length || 0;
    const total = habits?.length || 1;
    return { name: format(d, chartDays > 7 ? 'MMM d' : 'EEE'), rate: Math.round((count / total) * 100) };
  });

  const categoryData = (() => {
    const counts: Record<string, number> = {};
    (habits || []).forEach((h: any) => {
      const cat = getCategoryName(h.name);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  const tableData = (habits || []).map((h: any) => {
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });
    const completedCount = last30.filter(ds => h.completions?.includes(ds)).length;
    const rate = Math.round((completedCount / 30) * 100);
    const cat = getCategoryName(h.name);
    const emojiMap: Record<string, string> = { Learning: '📚', Work: '💼', Fitness: '🏃', Health: '💧', Mindfulness: '🧘', Rest: '🌙', Other: '🎯' };
    const historyLast14 = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (13 - i));
      return h.completions?.includes(d.toISOString().split('T')[0]) ? '🟢' : '⚫';
    });
    return { id: h.id, name: h.name, emoji: emojiMap[cat] || '🎯', rate, streak: h.currentStreak || 0, history: historyLast14 };
  }).sort((a: any, b: any) => b.rate - a.rate);

  const maxStreak = habits?.length > 0 ? Math.max(...habits.map((h: any) => h.currentStreak || 0)) : 0;
  const today = new Date().toISOString().split('T')[0];
  const completedToday = habits?.filter((h: any) => h.completions?.includes(today)).length || 0;
  const totalHabits = habits?.length || 0;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const level = xpData?.level || 1;
  const currentXP = xpData?.currentXP || 0;

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

  const thisWeek = getComparison(7, 7);
  const latestInsight = dynamicInsights?.[0] || null;

  // Animated counters
  const animScore = useCountUp(productivity?.score || 0);
  const animStreak = useCountUp(maxStreak);
  const animRate = useCountUp(completionRate);
  const animXP = useCountUp(currentXP);
  const animWeekDiff = useCountUp(Math.abs(thisWeek.diff));

  // Export
  const handleExport = async (formatType: 'csv' | 'json' | 'pdf') => {
    setShowExportMenu(false);
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
    try {
      if (formatType === 'pdf') { window.print(); return; }
      if (formatType === 'json') {
        const blob = new Blob([JSON.stringify(habits, null, 2)], { type: 'application/json' });
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'habitflow.json' });
        a.click(); return;
      }
      const res = await client.get('/reports/export', { responseType: 'blob' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([res.data])), download: 'habitflow.csv' });
      a.click();
    } catch (e) { console.error(e); }
  };

  // Heatmap renderer
  const renderHeatmap = () => {
    if (!heatmap?.days) return <div className="text-center text-slate-500 py-8 text-sm">No heatmap data yet</div>;
    const entries = Object.entries(heatmap.days);
    const firstDate = entries[0]?.[0];
    const startOffset = firstDate ? new Date(`${firstDate}T00:00:00Z`).getUTCDay() : 0;
    return (
      <div>
        <div className="flex items-start gap-2 overflow-x-auto pb-2">
          <div className="grid grid-rows-7 gap-1 text-[10px] text-slate-600 font-bold uppercase pt-1 shrink-0">
            {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="h-4 w-4 flex items-center">{d}</div>)}
          </div>
          <div className="grid grid-rows-7 grid-flow-col gap-1">
            {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} className="h-4 w-4 rounded-sm" />)}
            {entries.map(([date, rate]: [string, any]) => (
              <div key={date} title={`${date}: ${Math.round(rate * 100)}%`}
                className={`h-4 w-4 rounded-sm ${getHeatmapColor(rate)} hover:scale-125 transition-transform cursor-pointer`} />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-slate-500">
          <span className="mr-1">Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map(v => <div key={v} className={`h-3 w-3 rounded-sm ${getHeatmapColor(v)}`} />)}
          <span className="ml-1">More</span>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl p-4 pb-16">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Welcome back, <span className="text-indigo-400 font-semibold">{user?.displayName || 'User'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Filter */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            {(['Week','Month','Year'] as const).map(f => (
              <button key={f} onClick={() => setTimeFilter(f)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timeFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Export */}
          <div className="relative" ref={exportMenuRef}>
            <button onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition">
              {isExporting ? <Check size={14} className="text-emerald-400" /> : <Download size={14} />}
              Export
              <ChevronDown size={12} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-10 w-36 rounded-xl bg-slate-800 border border-slate-700 shadow-xl z-50 overflow-hidden">
                {[{ label: 'CSV', icon: <FileSpreadsheet size={14} className="text-emerald-400"/>, fn: () => handleExport('csv') },
                  { label: 'JSON', icon: <FileJson size={14} className="text-yellow-400"/>, fn: () => handleExport('json') },
                  { label: 'PDF', icon: <FileText size={14} className="text-red-400"/>, fn: () => handleExport('pdf') }
                ].map(({ label, icon, fn }) => (
                  <button key={label} onClick={fn}
                    className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition">
                    {icon} {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Summary Stats Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard icon="⚡" label="XP Earned" value={animXP} sub={`Level ${level}`} color="text-indigo-400" />
        <StatCard icon="🔥" label="Best Streak" value={`${animStreak}d`} sub="days in a row" color="text-orange-400" />
        <StatCard icon="✅" label="Today" value={`${animRate}%`} sub={`${completedToday}/${totalHabits} done`} color="text-emerald-400" />
        <StatCard icon="📈" label="vs Last Week" value={`${thisWeek.diff >= 0 ? '+' : '-'}${animWeekDiff}%`} sub={thisWeek.diff >= 0 ? 'Improving' : 'Needs focus'} color={thisWeek.diff >= 0 ? 'text-emerald-400' : 'text-red-400'} />
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 mb-5 w-fit">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Overview' && (
        <div className="space-y-4">

          {/* Row 1: Trend + Category side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Completion Trend */}
            <div className="rounded-2xl glass-card p-4 border border-slate-700/50 group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp size={12} /> {timeFilter} Trend
                </h3>
                <span className={`text-xs font-black ${thisWeek.diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {thisWeek.diff >= 0 ? '↑' : '↓'} {Math.abs(thisWeek.diff)}%
                </span>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis domain={[0,100]} hide />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Completion']} />
                    <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} fill="url(#trendGrad)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Split */}
            <div className="rounded-2xl glass-card p-4 border border-slate-700/50 group hover:border-purple-500/30 transition-all">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <Grid size={12} /> Category Split
              </h3>
              {categoryData.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-slate-500 text-sm">Add habits to see categories</div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-44 w-44 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={42} outerRadius={64} dataKey="value" stroke="none">
                          {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip {...TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    {categoryData.slice(0,6).map((c, i) => (
                      <div key={c.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-slate-300 truncate">{c.name}</span>
                        <span className="text-slate-500 ml-auto font-bold">{c.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Heatmap + Top Habits side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Heatmap */}
            <div className="rounded-2xl glass-card p-4 border border-slate-700/50 group hover:border-emerald-500/30 transition-all">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <Activity size={12} /> Activity Heatmap — {format(new Date(year, month-1), 'MMM yyyy')}
              </h3>
              {renderHeatmap()}
            </div>

            {/* Top Habits */}
            <div className="rounded-2xl glass-card p-4 border border-slate-700/50 group hover:border-blue-500/30 transition-all">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <Trophy size={12} /> Top Habits
              </h3>
              {tableData.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-slate-500 text-sm">No habits yet</div>
              ) : (
                <div className="space-y-2">
                  {tableData.slice(0,5).map((row: any, i: number) => (
                    <div key={row.id} className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-600 w-4">{i+1}</span>
                      <span className="text-base">{row.emoji}</span>
                      <span className="text-sm font-medium text-slate-200 flex-1 truncate">{row.name}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${row.rate}%` }} />
                        </div>
                        <span className={`text-xs font-black ${getColorForRate(row.rate)}`}>{row.rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Latest Insight widget */}
          {latestInsight && (
            <div className="rounded-2xl glass-card p-4 border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-4 group hover:border-indigo-500/40 transition-all cursor-pointer"
              onClick={() => setActiveTab('Progress')}>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb size={16} className="text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">💡 Today's Insight</div>
                <p className="text-sm font-medium text-slate-200 leading-relaxed line-clamp-2">{latestInsight.description}</p>
              </div>
              <div className="flex items-center gap-1 text-indigo-400 text-xs font-bold shrink-0 mt-1">
                View all <ChevronRight size={12} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: PROGRESS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Progress' && (
        <div className="space-y-4">
          {/* Productivity Score + Weekly Bar side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Productivity Score donut */}
            <div className="rounded-2xl glass-card p-4 border border-slate-700/50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Zap size={12} /> Productivity Score
              </h3>
              <div className="flex items-center gap-4">
                <div className="h-36 w-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { value: productivity?.score || 0 },
                        { value: 100 - (productivity?.score || 0) }
                      ]} cx="50%" cy="50%" innerRadius={42} outerRadius={60} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                        <Cell fill="#6366f1" />
                        <Cell fill="#1e293b" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="text-4xl font-black text-indigo-400">{animScore}</div>
                  <div className="text-slate-500 text-sm">out of 100</div>
                  <div className="mt-2 text-xs text-slate-400">Based on streak, completion & consistency</div>
                </div>
              </div>
            </div>

            {/* Completion by day bar chart */}
            <div className="rounded-2xl glass-card p-4 border border-slate-700/50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <BarChart3 size={12} /> Daily Completions
              </h3>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Rate']} />
                    <Bar dataKey="rate" fill="#6366f1" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* All AI Insights */}
          <div className="rounded-2xl glass-card p-4 border border-slate-700/50">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Lightbulb size={12} /> AI Insights
            </h3>
            {!dynamicInsights || dynamicInsights.length === 0 ? (
              <div className="text-center p-8 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <p className="text-slate-400">Keep logging to get AI insights.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dynamicInsights.slice(0, 3).map((insight: any, i: number) => {
                  const borderColor = insight.type === 'positive' ? 'border-l-emerald-500' : insight.type === 'warning' ? 'border-l-orange-500' : 'border-l-blue-500';
                  const subColor = insight.type === 'positive' ? 'text-emerald-400' : insight.type === 'warning' ? 'text-orange-400' : 'text-blue-400';
                  return (
                    <div key={i} className={`p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 border-l-4 ${borderColor}`}>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="font-bold text-slate-200 text-sm">{insight.title}</span>
                        {insight.subtitle && <span className={`text-xs font-bold ${subColor} shrink-0`}>{insight.subtitle}</span>}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{insight.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: CATEGORIES
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pie large */}
            <div className="rounded-2xl glass-card p-4 border border-slate-700/50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Category Distribution</h3>
              {categoryData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-slate-500 text-sm">Add habits to see categories</div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" stroke="none" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                        {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip {...TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Category breakdown list */}
            <div className="rounded-2xl glass-card p-4 border border-slate-700/50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Breakdown</h3>
              <div className="space-y-3">
                {categoryData.length === 0 ? (
                  <div className="text-slate-500 text-sm text-center py-8">No data yet</div>
                ) : categoryData.map((c, i) => {
                  const pct = Math.round((c.value / (habits?.length || 1)) * 100);
                  return (
                    <div key={c.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">{c.name}</span>
                        <span className="text-slate-500">{c.value} habit{c.value !== 1 ? 's' : ''} · {pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: HISTORY
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'History' && (
        <div className="space-y-4">
          {/* Heatmap full */}
          <div className="rounded-2xl glass-card p-4 border border-slate-700/50">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Activity size={12} /> Activity Heatmap — {format(new Date(year, month-1), 'MMMM yyyy')}
            </h3>
            {renderHeatmap()}
          </div>

          {/* Performance table */}
          <div className="rounded-2xl glass-card p-4 border border-slate-700/50">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Target size={12} /> Habit Performance (Last 30 Days)
            </h3>
            {tableData.length === 0 ? (
              <div className="text-center text-slate-500 py-8 text-sm">No habits yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest">
                      <th className="pb-2 pr-4">Habit</th>
                      <th className="pb-2 pr-4 text-center">30d Rate</th>
                      <th className="pb-2 pr-4 text-center hidden sm:table-cell">Last 14d</th>
                      <th className="pb-2 text-center">Streak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {tableData.map((row: any) => (
                      <tr key={row.id} className="group hover:bg-slate-800/20 transition-colors">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{row.emoji}</span>
                            <span className="text-sm font-medium text-slate-200 truncate max-w-[120px]">{row.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 text-center">
                          <span className={`text-xs font-black ${getColorForRate(row.rate)}`}>{row.rate}%</span>
                        </td>
                        <td className="py-2.5 pr-4 text-center hidden sm:table-cell">
                          <div className="flex items-center justify-center gap-[2px]">
                            {row.history.map((icon: string, i: number) => (
                              <span key={i} className={`text-[9px] ${icon === '⚫' ? 'opacity-25' : ''}`}>{icon}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                            🔥{row.streak}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
