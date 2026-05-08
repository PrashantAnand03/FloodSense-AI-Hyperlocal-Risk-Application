import { useState } from 'react';
import { BellRing, ChevronDown, ChevronUp, X } from 'lucide-react';

const COLOR_MAP = {
  red:    { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    dot: 'bg-red-500'    },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400',  dot: 'bg-green-500'  },
};

export default function AlertPanel({ alerts, location }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());

  if (!alerts || alerts.length === 0) {
    return (
      <div className="glass-card p-4 flex items-center gap-3 text-slate-500">
        <BellRing className="w-4 h-4 shrink-0" />
        <span className="text-sm">No active alerts for this area</span>
      </div>
    );
  }

  const visible = alerts.filter((_, i) => !dismissed.has(i));
  const highCount = visible.filter(a => a.color === 'red').length;

  return (
    <div className="glass-card overflow-hidden animate-slide-in">
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 
                   hover:bg-white/5 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <BellRing className={`w-4 h-4 ${highCount > 0 ? 'text-red-400' : 'text-yellow-400'}`} />
            {highCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping-slow" />
            )}
          </div>
          <span className="text-sm font-semibold text-white">
            Active Alerts
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold
            ${highCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            {visible.length}
          </span>
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
      </button>

      {/* Alert list */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-2">
          {/* Location tag */}
          {location?.name && (
            <div className="text-xs text-slate-500 px-1 pb-1 border-b border-white/5">
              📍 {location.name}
            </div>
          )}

          {visible.map((alert, idx) => {
            const c = COLOR_MAP[alert.color] || COLOR_MAP.green;
            return (
              <div
                key={idx}
                className={`relative flex items-start gap-3 p-3 rounded-lg border 
                            ${c.bg} ${c.border} animate-fade-in`}
              >
                {/* Dot */}
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${c.dot} 
                                 ${alert.color === 'red' ? 'animate-pulse' : ''}`} />

                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${c.text} flex items-center gap-1.5`}>
                    <span>{alert.icon}</span>
                    <span>{alert.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{alert.message}</p>
                </div>

                {/* Dismiss */}
                <button
                  onClick={() => setDismissed(prev => new Set([...prev, alerts.indexOf(alert)]))}
                  className="text-slate-600 hover:text-slate-300 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {visible.length === 0 && (
            <div className="text-center text-slate-500 text-xs py-2">
              All alerts dismissed
            </div>
          )}
        </div>
      )}
    </div>
  );
}
