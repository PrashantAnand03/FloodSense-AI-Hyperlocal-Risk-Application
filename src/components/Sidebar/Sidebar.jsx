import { Wind, Droplets, Thermometer, Eye, Cloud, Clock, Gauge, Navigation, CloudRain, Sun, Calendar } from 'lucide-react';
import ForecastPanel from '../Forecast/ForecastPanel';
import DownloadReport from './DownloadReport';
import ForecastStrip from '../Forecast/ForecastStrip';
import { formatWeatherIcon, formatTimestamp } from '../../utils/riskColors';

export default function Sidebar({ riskData, loading, connected }) {
  return (
    <aside className="w-full h-full flex flex-col gap-3 panel-scroll pr-1">
      {/* Connection badge */}
      <div className="flex items-center gap-2 px-1">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-xs text-slate-400">
          {connected ? 'Live Data Connected' : 'Connecting...'}
        </span>
      </div>

      {/* Location header */}
      {riskData?.location && (
        <LocationHeader location={riskData.location} timestamp={riskData.timestamp} />
      )}

      {/* Weather details */}
      {riskData?.weather ? (
        <WeatherCard weather={riskData.weather} />
      ) : (
        <div className="glass-card p-4 space-y-3 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-4 bg-white/10 rounded w-full" />
          ))}
        </div>
      )}

      {/* 7-Day Forecast Panel */}
      <ForecastPanel location={riskData?.location} />

      {/* Legend */}
      <RiskLegend />

      {/* Demo Tip */}
      <DemoTip />

      {/* Download Report Button */}
      <DownloadReport riskData={riskData} />
    </aside>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function LocationHeader({ location, timestamp }) {
  return (
    <div className="glass-card p-4 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-white font-semibold text-sm leading-tight">
            📍 {location.name}
          </h2>
          {location.region && (
            <p className="text-slate-400 text-xs mt-0.5">{location.region}, {location.country}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
        <Clock className="w-3 h-3" />
        <span>Updated: {formatTimestamp(timestamp)}</span>
      </div>
      <div className="text-xs text-slate-600 font-mono mt-0.5">
        {location.lat?.toFixed(5)}°N, {location.lon?.toFixed(5)}°E
      </div>
    </div>
  );
}

function WeatherCard({ weather }) {
  const iconUrl = formatWeatherIcon(weather.icon);

  const stats = [
    { icon: Droplets,     label: 'Rainfall',    value: `${weather.precip_mm ?? 0} mm`,  color: 'text-blue-400'   },
    { icon: Thermometer,  label: 'Temperature', value: `${weather.temp_c}°C`,            color: 'text-orange-400' },
    { icon: Droplets,     label: 'Humidity',    value: `${weather.humidity}%`,            color: 'text-cyan-400'   },
    { icon: Wind,         label: 'Wind',        value: `${weather.wind_kph} km/h ${weather.wind_dir || ''}`, color: 'text-slate-300' },
    { icon: Eye,          label: 'Visibility',  value: `${weather.vis_km ?? '—'} km`,    color: 'text-slate-300'  },
    { icon: Cloud,        label: 'Cloud Cover', value: `${weather.cloud ?? '—'}%`,        color: 'text-slate-400'  },
  ];

  return (
    <div className="glass-card p-4 space-y-3 animate-fade-in">
      {/* Condition row */}
      <div className="flex items-center gap-3 pb-2 border-b border-white/5">
        {iconUrl && (
          <img src={iconUrl} alt={weather.condition} className="w-10 h-10" />
        )}
        <div>
          <p className="text-white font-medium text-sm">{weather.condition}</p>
          <p className="text-xs text-slate-400">Feels like {weather.feelslike_c ?? weather.temp_c}°C</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-2 bg-dark-700/50 rounded-lg px-2.5 py-2">
            <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
            <div>
              <p className="text-xs text-slate-500 leading-none">{label}</p>
              <p className="text-xs font-semibold text-white mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskLegend() {
  const levels = [
    { color: '#22c55e', label: 'Low Risk',      desc: '< 40% score'  },
    { color: '#f59e0b', label: 'Moderate Risk', desc: '40–65% score' },
    { color: '#ef4444', label: 'High Risk',     desc: '> 65% score'  },
  ];

  return (
    <div className="glass-card p-4">
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Map Legend</p>
      <div className="space-y-2">
        {levels.map(({ color, label, desc }) => (
          <div key={label} className="flex items-center gap-3">
            <div
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
            />
            <div>
              <span className="text-xs text-white font-medium">{label}</span>
              <span className="text-xs text-slate-500 ml-2">{desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoTip() {
  return (
    <div className="glass-card p-4 border-brand-500/20 bg-brand-900/10">
      <p className="text-[10px] text-brand-400 uppercase tracking-widest mb-2 font-bold">💡 Test Tip</p>
      <p className="text-xs text-slate-300 leading-relaxed">
        To trigger a <b>High Risk</b> alert (and test the Email feature), click on 
        <b> low-elevation coastal areas</b> (like <b>Kochi, India</b> or 
        the <b>Netherlands</b>) when heavy rain is present.
      </p>
    </div>
  );
}
