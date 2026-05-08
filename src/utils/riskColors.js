/**
 * Utility functions for risk level colors, labels, and icons
 */

export function getRiskColor(level) {
  switch (level) {
    case 'HIGH':   return '#ef4444';
    case 'MEDIUM': return '#f59e0b';
    case 'LOW':    return '#22c55e';
    default:       return '#94a3b8';
  }
}

export function getRiskBgClass(level) {
  switch (level) {
    case 'HIGH':   return 'bg-risk-high/20 border-risk-high/40 text-risk-high';
    case 'MEDIUM': return 'bg-risk-medium/20 border-risk-medium/40 text-risk-medium';
    case 'LOW':    return 'bg-risk-low/20 border-risk-low/40 text-risk-low';
    default:       return 'bg-slate-700/20 border-slate-600/40 text-slate-400';
  }
}

export function getRiskGlowClass(level) {
  switch (level) {
    case 'HIGH':   return 'shadow-glow-red';
    case 'MEDIUM': return 'shadow-glow-yellow';
    case 'LOW':    return 'shadow-glow-green';
    default:       return '';
  }
}

export function getRiskLabel(level) {
  switch (level) {
    case 'HIGH':   return 'High Risk';
    case 'MEDIUM': return 'Moderate Risk';
    case 'LOW':    return 'Low Risk';
    default:       return 'Unknown';
  }
}

export function getRiskIcon(level) {
  switch (level) {
    case 'HIGH':   return '🔴';
    case 'MEDIUM': return '🟡';
    case 'LOW':    return '🟢';
    default:       return '⚪';
  }
}

export function getRiskEmoji(level) {
  switch (level) {
    case 'HIGH':   return '🚨';
    case 'MEDIUM': return '⚠️';
    case 'LOW':    return '✅';
    default:       return 'ℹ️';
  }
}

export function formatPercentage(score) {
  return `${Math.round(score * 100)}%`;
}

export function formatElevation(meters) {
  if (meters === null || meters === undefined) return 'Unknown';
  return `${Math.round(meters)}m`;
}

export function formatTimestamp(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatWeatherIcon(iconUrl) {
  if (!iconUrl) return null;
  // WeatherAPI returns //cdn.weatherapi.com/... — add https:
  return iconUrl.startsWith('//') ? `https:${iconUrl}` : iconUrl;
}
