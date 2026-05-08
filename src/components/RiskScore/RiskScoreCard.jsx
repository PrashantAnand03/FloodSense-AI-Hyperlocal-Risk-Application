import { useEffect, useRef } from 'react';
import { Droplets, Mountain, History, TrendingUp, Activity } from 'lucide-react';
import { getRiskBgClass, getRiskGlowClass, getRiskLabel, getRiskColor, formatElevation } from '../../utils/riskColors';

export default function RiskScoreCard({ riskData, loading }) {
  const prevScoreRef = useRef(null);

  if (loading) {
    return (
      <div className="glass-card p-5 space-y-4 animate-pulse">
        <div className="h-5 bg-white/10 rounded w-2/3" />
        <div className="h-24 bg-white/10 rounded-full w-24 mx-auto" />
        <div className="space-y-2">
          <div className="h-3 bg-white/10 rounded w-full" />
          <div className="h-3 bg-white/10 rounded w-4/5" />
          <div className="h-3 bg-white/10 rounded w-3/5" />
        </div>
      </div>
    );
  }

  if (!riskData) {
    return (
      <div className="glass-card p-5 flex flex-col items-center justify-center gap-3 text-center min-h-[220px]">
        <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center">
          <Activity className="w-7 h-7 text-slate-500" />
        </div>
        <p className="text-slate-500 text-sm">Select a location to<br />view flood risk score</p>
      </div>
    );
  }

  const { risk, elevation } = riskData;
  const { level, percentage, breakdown, color } = risk;
  const bgClass   = getRiskBgClass(level);
  const glowClass = getRiskGlowClass(level);

  // Breakdown factors
  const factors = [
    {
      key:     'rainfall',
      label:   'Rainfall Intensity',
      icon:    Droplets,
      value:   breakdown.rainfall.raw,
      weight:  50,
      color:   '#2aa3f5',
    },
    {
      key:     'elevation',
      label:   'Elevation Factor',
      icon:    Mountain,
      value:   breakdown.elevation.raw,
      weight:  30,
      color:   '#8b5cf6',
    },
    {
      key:     'historical',
      label:   'Historical Pattern',
      icon:    History,
      value:   breakdown.historical.raw,
      weight:  20,
      color:   '#f59e0b',
    },
  ];

  return (
    <div className={`glass-card p-5 space-y-4 ${glowClass} transition-all duration-500 animate-fade-in`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Risk Score</span>
        <TrendingUp className="w-4 h-4 text-slate-400" />
      </div>

      {/* Score circle */}
      <div className="flex flex-col items-center gap-2">
        <ScoreRing percentage={percentage} color={color} level={level} />
        <div className={`text-xs font-bold px-3 py-1 rounded-full border ${bgClass}`}>
          {level === 'HIGH' ? '🔴' : level === 'MEDIUM' ? '🟡' : '🟢'} {getRiskLabel(level)}
        </div>
      </div>

      {/* Elevation info */}
      {elevation?.meters !== null && (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-dark-700/50 rounded-lg px-3 py-2">
          <Mountain className="w-3.5 h-3.5 text-purple-400" />
          <span>Elevation: <span className="text-white font-medium">{formatElevation(elevation.meters)}</span> above sea level</span>
        </div>
      )}

      {/* AI Commentary */}
      {risk.ai_commentary && (
        <div className="text-xs italic text-slate-300 leading-relaxed bg-brand-900/20 border-l-2 border-brand-500 pl-3 py-1">
          {risk.ai_commentary}
        </div>
      )}

      {/* Factor breakdown */}
      <div className="space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider">Risk Breakdown</p>
        {factors.map(({ key, label, icon: Icon, value, weight, color: fColor }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Icon className="w-3.5 h-3.5" style={{ color: fColor }} />
                {label}
              </div>
              <span className="text-slate-400 font-mono">{weight}% weight</span>
            </div>
            <div className="relative h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.round(value * 100)}%`,
                  background: fColor,
                  boxShadow: `0 0 6px ${fColor}88`,
                }}
              />
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">{Math.round(value * 100)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Circular score ring ────────────────────────────────────────────────────

function ScoreRing({ percentage, color, level }) {
  const radius      = 44;
  const circumference = 2 * Math.PI * radius;
  const offset      = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Track */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="#1e3a6e"
          strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-3xl font-bold text-white" style={{ textShadow: `0 0 12px ${color}` }}>
          {percentage}
        </div>
        <div className="text-xs text-slate-400">/ 100</div>
      </div>
    </div>
  );
}
