import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { Award, User, Settings } from 'lucide-react';

export default function ProfilePage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await client.get('/profile');
      return res.data;
    }
  });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>
      
      {isLoading ? (
        <div className="text-slate-400">Loading profile...</div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg bg-slate-800 p-6 shadow-md flex items-center gap-4">
            <div className="rounded-full bg-slate-700 p-4">
              <User size={48} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{profile?.email}</h2>
              <p className="text-sm text-slate-400">HabitFlow Member</p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-800 p-6 shadow-md">
            <h2 className="text-xl font-semibold text-slate-200 mb-6 flex items-center gap-2">
              <Award className="text-yellow-400" />
              Your Badges
            </h2>
            
            {profile?.badges?.length === 0 ? (
              <p className="text-slate-400 text-sm">No badges earned yet. Keep building those habits!</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profile?.badges?.map((badge: any) => (
                  <div key={badge.id} className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-700">
                    <Award size={40} className="text-yellow-400 mb-2" />
                    <span className="text-xs font-semibold text-white text-center">
                      {badge.badgeType.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="rounded-lg bg-slate-800 p-6 shadow-md">
            <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Settings className="text-slate-400" />
              Settings
            </h2>
            <p className="text-slate-400 text-sm">Email Reminders are currently active.</p>
          </div>
        </div>
      )}
    </div>
  );
}
