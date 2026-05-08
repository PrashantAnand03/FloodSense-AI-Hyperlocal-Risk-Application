import { useState, useEffect } from 'react';
import { ArrowLeft, Users, BarChart3, Trash2, Search, Shield, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Admin Dashboard — User Management Panel
 * Only accessible to users with role='admin'
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied: admin only');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch all users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/auth/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      setUsers(response.data.users || []);

      // Calculate stats
      const totalUsers = response.data.users?.length || 0;
      const adminCount = response.data.users?.filter(u => u.role === 'admin').length || 0;
      const userCount = totalUsers - adminCount;

      setStats({
        totalUsers,
        adminCount,
        userCount,
        lastUpdated: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      toast.error('Failed to load users');
      console.error('[AdminDashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(userId);
    try {
      await axios.delete(`${API_BASE}/auth/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success(`Deleted user: ${userName}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
      console.error('[AdminDashboard] Delete error:', err);
    } finally {
      setDeleting(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-900 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="shrink-0 h-14 flex items-center gap-3 px-6 border-b border-white/10 bg-dark-800/90 backdrop-blur-md">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-ghost text-slate-400 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div>
          <h1 className="text-lg font-bold gradient-text flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-500" />
            Admin Dashboard
          </h1>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <StatsCard
                title="Total Users"
                value={stats.totalUsers}
                icon={Users}
                color="brand"
              />
              <StatsCard
                title="Admins"
                value={stats.adminCount}
                icon={Shield}
                color="blue"
              />
              <StatsCard
                title="Regular Users"
                value={stats.userCount}
                icon={Users}
                color="green"
              />
            </div>
          )}

          {/* Users Table */}
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent flex-1 outline-none text-sm text-white placeholder-slate-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-t border-white/5 bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">Role</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">Joined</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 text-white font-medium">{u.full_name}</td>
                        <td className="px-4 py-3 text-slate-300 text-xs font-mono">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold flex w-fit items-center gap-1 ${
                              u.role === 'admin'
                                ? 'bg-brand-500/20 text-brand-400'
                                : 'bg-slate-500/20 text-slate-300'
                            }`}
                          >
                            {u.role === 'admin' ? (
                              <Shield className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {u.id !== user?.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.full_name)}
                              disabled={deleting === u.id}
                              className="btn-danger text-xs flex items-center gap-1.5 mx-auto disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              {deleting === u.id ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Last updated */}
          {stats && (
            <p className="text-xs text-slate-500 text-center">
              Last updated: {stats.lastUpdated}
              <button
                onClick={fetchUsers}
                className="ml-2 text-brand-400 hover:text-brand-300"
              >
                Refresh
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Stats card component
 */
function StatsCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    brand: 'bg-brand-500/10 border-brand-500/30 text-brand-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
  };

  return (
    <div className={`glass-card p-4 border ${colorClasses[color]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <Icon className="w-6 h-6 opacity-50" />
      </div>
    </div>
  );
}
