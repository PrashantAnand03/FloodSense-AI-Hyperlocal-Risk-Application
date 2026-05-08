import { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Droplets } from 'lucide-react';
import { calculateForecastRisk } from '../../services/api';

export default function ForecastPanel({ location }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location) {
      setForecast(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    
    calculateForecastRisk(location.lat, location.lon)
      .then(data => {
        if (isMounted && data.success) {
          setForecast(data.forecast);
        }
      })
      .catch(err => console.error('[Forecast] fetch error:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [location?.lat, location?.lon]);

  if (!location) {
    return (
      <div className="glass-card p-4 text-center">
        <Calendar className="w-6 h-6 text-slate-600 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Select a location to see 7-day forecast</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">7-Day Outlook</span>
        </div>
        {loading && <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
      </div>

      <div className="p-2">
        {loading && !forecast ? (
          <div className="flex justify-center py-6">
            <RefreshCw className="w-5 h-5 text-brand-400 animate-spin" />
          </div>
        ) : !forecast || forecast.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500">No forecast data available</div>
        ) : (
          <div className="space-y-1">
            {forecast.map((day, i) => {
              // Parse date (e.g. 2026-05-06 to "Wed")
              const d = new Date(day.date);
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
              
              const isHigh = day.risk.level === 'HIGH';
              const isMedium = day.risk.level === 'MEDIUM';
              
              const colorClass = isHigh ? 'text-red-400' : isMedium ? 'text-yellow-400' : 'text-green-400';
              const bgClass = isHigh ? 'bg-red-500/10 border-red-500/20' : isMedium ? 'bg-yellow-500/10 border-yellow-500/20' : 'hover:bg-white/5 border-transparent';

              return (
                <div key={day.date} className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${bgClass}`}>
                  <div className="flex items-center gap-3 w-20">
                    <span className="text-xs font-medium text-slate-300 w-8">{i === 0 ? 'Today' : dayName}</span>
                    <img src={day.weather.icon} alt="weather" className="w-6 h-6 object-contain filter drop-shadow-md" />
                  </div>
                  
                  <div className="flex items-center gap-1.5 w-16 justify-end">
                    <Droplets className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] text-slate-400">{day.weather.totalprecip_mm}mm</span>
                  </div>

                  <div className="flex flex-col items-end w-16">
                    <span className={`text-xs font-bold ${colorClass}`}>
                      {Math.round(day.risk.percentage)}%
                    </span>
                    <span className="text-[9px] text-slate-500">{day.risk.level}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
