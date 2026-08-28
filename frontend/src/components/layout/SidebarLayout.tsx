import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import { LayoutDashboard, BarChart3, Lightbulb, User, LogOut, Flame, ChevronLeft, ChevronRight, Folder } from 'lucide-react';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { data: xpData } = useQuery({
    queryKey: ['xpData'],
    queryFn: async () => {
      const res = await client.get('/analytics/xp');
      return res.data;
    }
  });

  const level = xpData?.level || 1;
  const currentXP = xpData?.currentXP || 0;
  const nextLevelXP = Math.max(level * 1000, 1); // never 0
  const xpProgress = Math.min(Math.max((currentXP / nextLevelXP) * 100, 0), 100);
  
  const currentPath = location.pathname;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/categories', label: 'Categories', icon: Folder },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/insights', label: 'Insights', icon: Lightbulb },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Ambient Background Blobs */}
      <div className="fixed top-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-600/[0.06] blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-15%] left-[15%] w-[60vw] h-[60vw] rounded-full bg-blue-600/[0.06] blur-[140px] pointer-events-none" />

      {/* Sidebar */}
      <aside className={`border-r border-slate-800/50 bg-slate-900/30 backdrop-blur-xl flex flex-col fixed inset-y-0 z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-5 flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              HabitFlow
            </h1>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ${isCollapsed ? 'mx-auto mt-2' : ''}`}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        
        <div className="px-3 flex-1 mt-4">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={`group relative flex items-center gap-3 ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-xl transition-all duration-300 font-medium overflow-hidden ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/5 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] border border-blue-500/20' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:translate-x-1 border border-transparent'
                  }`}
                >
                  {/* Left Indicator Bar for Active State */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-2/3 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  )}
                  
                  <Icon size={20} className={`relative z-10 transition-transform duration-300 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'} ${isCollapsed && !isActive ? 'group-hover:scale-110' : ''}`} />
                  
                  {!isCollapsed && (
                    <span className="relative z-10">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800">
          {!isCollapsed ? (
            <Link to="/profile" className="flex items-center gap-3 mb-3 rounded-xl bg-slate-800/50 px-4 py-3 ring-1 ring-slate-700/50 hover:ring-indigo-500/40 transition-all cursor-pointer group">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow group-hover:scale-105 transition-transform">
                <span className="font-black text-white text-sm">{user?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-white truncate group-hover:text-indigo-300 transition-colors">
                  {user?.displayName || 'User'}
                </div>
                <div className="text-xs text-slate-500">Lv.{level} · {currentXP} XP</div>
              </div>
            </Link>
          ) : (
            <Link to="/profile" className="flex justify-center mb-4 group block" title={`Level ${level} · ${currentXP} XP`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 group-hover:scale-105 transition-transform">
                <span className="font-black text-white text-sm">{user?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
            </Link>
          )}
          
          <button 
            onClick={logout}
            title={isCollapsed ? "Logout" : undefined}
            className={`flex w-full items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-4'} gap-3 py-2 text-sm font-medium text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/10`}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 min-h-screen ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        {children}
      </main>
    </div>
  );
}
