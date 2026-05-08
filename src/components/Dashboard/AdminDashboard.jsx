import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { fetchUsers } from '../../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalRiskAssessments: 0, totalSavedLocations: 0, recentAlerts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    fetchAdminData();
  }, [user, navigate]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch users from backend (ensures RLS/Admin role is respected)
      const profiles = await fetchUsers();
      setUsers(profiles || []);

      // Fetch basic counts
      const [{ count: riskCount }, { count: locationCount }, { count: alertCount }] = await Promise.all([
        supabase.from('risk_assessments').select('*', { count: 'exact', head: true }),
        supabase.from('saved_locations').select('*', { count: 'exact', head: true }),
        supabase.from('alerts_history').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalRiskAssessments: riskCount || 0,
        totalSavedLocations: locationCount || 0,
        recentAlerts: alertCount || 0
      });

    } catch (err) {
      console.error('[Admin] Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-dark-900 text-white">Loading Admin Panel...</div>;
  }

  return (
    <div className="h-screen w-screen overflow-y-auto bg-dark-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-brand-500" />
                Admin Console
              </h1>
              <p className="text-sm text-slate-400">System overview and user management</p>
            </div>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-5 border-l-4 border-l-brand-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Users</p>
                <h3 className="text-3xl font-bold mt-1">{users.length}</h3>
              </div>
              <Users className="w-6 h-6 text-brand-400 opacity-50" />
            </div>
          </div>
          
          <div className="glass-card p-5 border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Risk Queries</p>
                <h3 className="text-3xl font-bold mt-1">{stats.totalRiskAssessments}</h3>
              </div>
              <Activity className="w-6 h-6 text-blue-400 opacity-50" />
            </div>
          </div>

          <div className="glass-card p-5 border-l-4 border-l-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Alerts Triggered</p>
                <h3 className="text-3xl font-bold mt-1">{stats.recentAlerts}</h3>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 bg-dark-800/50">
            <h2 className="font-semibold">Registered Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-dark-800/80 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 font-medium">{u.full_name || 'N/A'}</td>
                    <td className="px-5 py-3 text-slate-300">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-slate-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
