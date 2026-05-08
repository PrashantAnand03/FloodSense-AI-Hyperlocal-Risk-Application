import { Cloud, CloudRain, CloudDrizzle, Sun, Wind, Droplets } from 'lucide-react';
import { getRiskColor } from '../../utils/riskColors';

/**
 * 3-Day Forecast Strip Component
 * Displays upcoming weather and flood risk for next 3 days
 */
export default function ForecastStrip({ forecast }) {
  if (!forecast || forecast.length === 0) {
    return (
      <div className="text-center text-slate-600 text-xs py-4">
        No forecast data available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {forecast.map((day, idx) => (
        <ForecastDay key={idx} day={day} />
      ))}
    </div>
  );
}

/**
 * Individual day forecast card
 */
function ForecastDay({ day }) {
  const riskColor = getRiskColor(day.riskLevel);
  const date = new Date(day.date);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Icon based on condition
  const IconComponent = getWeatherIcon(day.condition);

  return (
    <div className="glass-card p-3 space-y-2 border-l-2" style={{ borderColor: riskColor }}>
      {/* Date and risk level */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-white">{dayName}</p>
          <p className="text-[10px] text-slate-500">{monthDay}</p>
        </div>
        <div
          className="px-2 py-1 rounded text-[10px] font-bold"
          style={{ background: `${riskColor}22`, color: riskColor, border: `1px solid ${riskColor}55` }}
        >
          {day.riskLevel}
        </div>
      </div>

      {/* Weather icon and condition */}
      <div className="flex items-center gap-2">
        {day.icon ? (
          <img src={day.icon} alt={day.condition} className="w-8 h-8" />
        ) : (
          <IconComponent className="w-6 h-6 text-slate-400" />
        )}
        <span className="text-xs text-slate-300">{day.condition}</span>
      </div>

      {/* Temperature and precipitation */}
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div className="flex items-center gap-1" title="Temperature range">
          <span className="text-slate-500">🌡️</span>
          <span className="text-slate-300">
            {day.minTemp?.toFixed(0)}–{day.maxTemp?.toFixed(0)}°C
          </span>
        </div>
        <div className="flex items-center gap-1" title="Rainfall">
          <Droplets className="w-3 h-3 text-blue-400" />
          <span className="text-slate-300">{day.rainMm?.toFixed(1) || '0'}mm</span>
        </div>
        <div className="flex items-center gap-1" title="Risk indicator">
          <div className="w-2 h-2 rounded-full" style={{ background: riskColor }} />
          <span className="text-slate-400 text-[9px]">{day.riskLevel === 'HIGH' ? '⚠️' : day.riskLevel === 'MEDIUM' ? '📍' : '✓'}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Returns appropriate weather icon based on condition text
 */
function getWeatherIcon(condition) {
  if (!condition) return Cloud;

  const lower = condition.toLowerCase();
  if (lower.includes('rain') || lower.includes('drizzle')) return CloudRain;
  if (lower.includes('cloud')) return Cloud;
  if (lower.includes('clear') || lower.includes('sunny')) return Sun;
  if (lower.includes('wind')) return Wind;

  return Cloud;
}
