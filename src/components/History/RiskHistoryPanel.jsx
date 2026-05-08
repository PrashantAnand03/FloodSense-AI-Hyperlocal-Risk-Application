import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import { History, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import { fetchHistory, fetchHistoryStats, deleteAssessmentFromDb } from '../../services/api';
import toast from 'react-hot-toast';

// Custom chart tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const color = d.risk_level === 'HIGH' ? '#ef4444' : d.risk_level === 'MEDIUM' ? '#f59e0b' : '#22c55e';
  return (
    <div className="glass rounded-lg px-3 py-2 border border-white/10 text-xs">
      <p className="text-gray-300 mb-1">{d.location_name}</p>
      <p className="font-bold" style={{ color }}>{d.risk_level} — {Math.round(d.risk_score * 100)}%</p>
      <p className="text-gray-500">{label}</p>
    </div>
  );
};

export default function RiskHistoryPanel({ refreshTrigger }) {
  const [history, setHistory]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'list'

  const load = async () => {
    setLoading(true);
    try {
      const [hist, st] = await Promise.all([fetchHistory(30), fetchHistoryStats()]);
      setHistory(hist || []);
      setStats(st);
    } catch (err) {
      console.error('[History] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshTrigger]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteAssessmentFromDb(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      toast.success('Record deleted');
    } catch {
      toast.error('Failed to delete record');
    }
  };

  // Prepare chart data (reverse so oldest is left)
  const chartData = [...history].reverse().map(h => ({
    ...h,
    time: new Date(h.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    score_pct: Math.round(parseFloat(h.risk_score) * 100),
    fill: h.risk_level === 'HIGH' ? '#ef4444' : h.risk_level === 'MEDIUM' ? '#f59e0b' : '#22c55e',
  }));

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Risk History</span>
          {history.length > 0 && (
            <span className="text-xs text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-full">{history.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Tabs */}
          <button
            onClick={() => setActiveTab('chart')}
            className={`text-xs px-2 py-1 rounded transition-all ${activeTab === 'chart' ? 'bg-brand-600/30 text-brand-300' : 'text-slate-500 hover:text-slate-300'}`}
          >Chart</button>
          <button
            onClick={() => setActiveTab('list')}
            className={`text-xs px-2 py-1 rounded transition-all ${activeTab === 'list' ? 'bg-brand-600/30 text-brand-300' : 'text-slate-500 hover:text-slate-300'}`}
          >List</button>
          <button onClick={load} className="text-slate-500 hover:text-slate-300 ml-1 p-1 rounded transition-colors">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 text-brand-400 animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 px-4">
          <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No history yet</p>
          <p className="text-xs text-slate-600 mt-1">Search a location to start tracking</p>
        </div>
      ) : (
        <>
          {/* Stats Bar */}
          {stats && (
            <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
              <div className="px-3 py-2 text-center">
                <p className="text-xs text-red-400 font-bold">{stats.highCount}</p>
                <p className="text-[10px] text-slate-500">High</p>
              </div>
              <div className="px-3 py-2 text-center">
                <p className="text-xs text-yellow-400 font-bold">{stats.mediumCount}</p>
                <p className="text-[10px] text-slate-500">Medium</p>
              </div>
              <div className="px-3 py-2 text-center">
                <p className="text-xs text-green-400 font-bold">{stats.lowCount}</p>
                <p className="text-[10px] text-slate-500">Low</p>
              </div>
            </div>
          )}

          {/* Chart Tab */}
          {activeTab === 'chart' && (
            <div className="px-2 pt-3 pb-2">
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2aa3f5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2aa3f5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={65} stroke="#ef444466" strokeDasharray="3 3" />
                  <ReferenceLine y={35} stroke="#22c55e66" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="score_pct"
                    stroke="#2aa3f5"
                    strokeWidth={2}
                    fill="url(#riskGrad)"
                    dot={{ fill: '#2aa3f5', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-between mt-1 px-1">
                <span className="text-[9px] text-slate-600 flex items-center gap-1">
                  <span className="w-6 border-t border-red-400 border-dashed inline-block" /> High threshold (65%)
                </span>
                <span className="text-[9px] text-slate-600 flex items-center gap-1">
                  <span className="w-6 border-t border-green-400 border-dashed inline-block" /> Low threshold (35%)
                </span>
              </div>
            </div>
          )}

          {/* List Tab */}
          {activeTab === 'list' && (
            <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
              {history.slice(0, 20).map(h => {
                const color = h.risk_level === 'HIGH' ? 'text-red-400' : h.risk_level === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400';
                const dot   = h.risk_level === 'HIGH' ? 'bg-red-500' : h.risk_level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500';
                return (
                  <div key={h.id} className="flex items-center justify-between px-3 py-2 hover:bg-white/5 group transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-300 truncate">{h.location_name}</p>
                        <p className="text-[10px] text-slate-600">
                          {new Date(h.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold ${color}`}>{Math.round(parseFloat(h.risk_score) * 100)}%</span>
                      <button
                        onClick={(e) => handleDelete(h.id, e)}
                        className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
