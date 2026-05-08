import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, RefreshCw, Wifi, WifiOff, MapPin, BookmarkPlus, Trash2, LogOut, User, ShieldCheck, Layers } from 'lucide-react';
import ErrorBoundary from '../ErrorBoundary';
import FloodMap from '../Map/FloodMap';
import LocationSearch from '../Search/LocationSearch';
import RiskScoreCard from '../RiskScore/RiskScoreCard';
import AlertPanel from '../Alerts/AlertPanel';
import Sidebar from '../Sidebar/Sidebar';
import RiskHistoryPanel from '../History/RiskHistoryPanel';
import { useSocket } from '../../hooks/useSocket';
import {
  calculateRisk,
  fetchSavedLocations,
  saveLocationToDb,
  deleteLocationFromDb,
  saveAssessmentToDb,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [riskData,         setRiskData]         = useState(null);
  const [loading,          setLoading]           = useState(false);
  const [savedLocations,   setSavedLocations]    = useState([]);
  const [historyTrigger,   setHistoryTrigger]    = useState(0);
  const [showHeatmap,      setShowHeatmap]       = useState(false);
  const [simulateExtreme,  setSimulateExtreme]  = useState(false);

  const { connected, subscribeToLocation, riskData: socketData } = useSocket();

  // Sync socket data to local state
  useEffect(() => {
    if (socketData) {
      setRiskData(socketData);
    }
  }, [socketData]);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully');
  };

  // ── Load saved locations from Supabase on mount ───────────
  useEffect(() => {
    (async () => {
      try {
        const locs = await fetchSavedLocations();
        setSavedLocations(locs || []);
      } catch (err) {
        console.error('[Dashboard] Failed to load saved locations:', err);
      }
    })();
  }, []);

  // ── Compute risk for a location ──────────────────────────
  const handleLocationSelect = useCallback(async ({ lat, lon, name }) => {
    setSelectedLocation({ lat, lon, name });
    setLoading(true);
    setRiskData(null);

    try {
      const data = await calculateRisk(lat, lon, name, simulateExtreme);
      setRiskData(data);

      // Subscribe to real-time updates
      subscribeToLocation(lat, lon, name);

      // Save assessment to Supabase DB
      try {
        await saveAssessmentToDb({
          locationName:     data.location.name,
          lat:              data.location.lat,
          lon:              data.location.lon,
          riskScore:        data.risk.score,
          riskLevel:        data.risk.level,
          rainfallFactor:   data.risk.breakdown?.rainfall?.raw,
          elevationFactor:  data.risk.breakdown?.elevation?.raw,
          historicalFactor: data.risk.breakdown?.historical?.raw,
          elevationM:       data.elevation?.elevation,
          temperatureC:     data.weather?.current?.temp_c,
          humidityPct:      data.weather?.current?.humidity,
          windKph:          data.weather?.current?.wind_kph,
          precipMm:         data.weather?.current?.precip_mm,
          weatherSnapshot:  data.weather,
        });
        // Refresh history panel
        setHistoryTrigger(t => t + 1);
      } catch (saveErr) {
        console.warn('[Dashboard] Could not save assessment:', saveErr.message);
      }

      // Toast based on risk level
      const { level } = data.risk;
      if (level === 'HIGH') {
        toast.error(`🚨 HIGH FLOOD RISK detected at ${data.location.name}`, { duration: 5000 });
      } else if (level === 'MEDIUM') {
        toast(`⚠️ Moderate flood risk at ${data.location.name}`, {
          icon: '⚠️',
          style: { background: '#1e3a6e', color: '#fbbf24', border: '1px solid #f59e0b44' },
          duration: 4000,
        });
      } else {
        toast.success(`✅ ${data.location.name} is currently safe`, { duration: 3000 });
      }
    } catch (err) {
      toast.error('Failed to fetch risk data. Check server connection.');
      console.error('[Dashboard] Risk fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [subscribeToLocation]);

  // ── Map click handler ─────────────────────────────────────
  const handleMapClick = useCallback(({ lat, lon }) => {
    handleLocationSelect({
      lat,
      lon,
      name: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
    });
  }, [handleLocationSelect]);

  // ── Save location to Supabase ────────────────────────────
  const handleSaveLocation = async () => {
    if (!riskData) return;
    const { lat, lon, name } = riskData.location;

    const already = savedLocations.some(l =>
      parseFloat(l.lat) === lat && parseFloat(l.lon) === lon
    );
    if (already) {
      toast('Location already saved', { icon: '📌' });
      return;
    }

    try {
      const { location } = await saveLocationToDb(name, lat, lon);
      setSavedLocations(prev => [location, ...prev]);
      toast.success('Location saved! 📌');
    } catch (err) {
      if (err.response?.data?.error === 'Location already saved') {
        toast('Location already saved', { icon: '📌' });
      } else {
        toast.error('Failed to save location');
      }
    }
  };

  // ── Remove location from Supabase ────────────────────────
  const handleRemoveLocation = async (id) => {
    try {
      await deleteLocationFromDb(id);
      setSavedLocations(prev => prev.filter(l => l.id !== id));
      toast.success('Location removed');
    } catch {
      toast.error('Failed to remove location');
    }
  };

  // ── Refresh ───────────────────────────────────────────────
  const handleRefresh = () => {
    if (!selectedLocation) return;
    handleLocationSelect(selectedLocation);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-dark-900">
      {/* ── Top Navbar ─────────────────────────────────────── */}
      <header className="shrink-0 h-14 flex items-center justify-between px-4
                         border-b border-white/10 bg-dark-800/90 backdrop-blur-md z-50">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-glow-blue">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold gradient-text leading-none">FloodSense AI</h1>
            <p className="text-xs text-slate-500 leading-none">Hyperlocal Risk Platform</p>
          </div>
        </div>

        {/* Center — Search */}
        <div className="flex-1 max-w-xl mx-4">
          <LocationSearch onLocationSelect={handleLocationSelect} />
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-2">
          {/* Connection indicator */}
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border
            ${connected
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
            }`}>
            {connected
              ? <><Wifi className="w-3 h-3" /> Live</>
              : <><WifiOff className="w-3 h-3" /> Offline</>
            }
          </div>

          {/* Save button */}
          {riskData && (
            <button
              onClick={handleSaveLocation}
              className="btn-ghost text-xs flex items-center gap-1.5 py-1.5"
              title="Save to map"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={!selectedLocation || loading}
            className="btn-ghost text-xs flex items-center gap-1.5 py-1.5 disabled:opacity-40"
            title="Refresh risk data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Simulation Toggle */}
          <div className="flex items-center gap-2 ml-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
            <input
              type="checkbox"
              id="simulate-extreme"
              checked={simulateExtreme}
              onChange={(e) => setSimulateExtreme(e.target.checked)}
              className="w-3.5 h-3.5 accent-red-500 cursor-pointer"
            />
            <label htmlFor="simulate-extreme" className="text-[10px] text-red-400 font-bold uppercase cursor-pointer select-none">
              Simulate Rain
            </label>
          </div>

          {/* Heatmap Toggle */}
          {selectedLocation && (
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`btn-ghost text-xs flex items-center gap-1.5 py-1.5 ${
                showHeatmap ? 'text-brand-400' : 'text-slate-400'
              }`}
              title="Toggle risk heatmap"
            >
              <Layers className="w-3.5 h-3.5" />
              Heatmap
            </button>
          )}

          {/* Admin Panel (if admin) */}
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="btn-ghost text-xs flex items-center gap-1.5 py-1.5 text-brand-400 hover:text-brand-300"
              title="Admin panel"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* User Profile + Logout */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <div className="w-6 h-6 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center">
                <User className="w-3 h-3 text-brand-400" />
              </div>
              <div className="leading-none">
                <p className="text-xs font-medium text-white leading-none">
                  {user?.fullName?.split(' ')[0] || user?.email?.split('@')[0]}
                </p>
                {user?.role === 'admin' && (
                  <span className="text-[10px] text-brand-400 flex items-center gap-0.5 mt-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" /> Admin
                  </span>
                )}
              </div>
            </div>
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="btn-ghost text-xs flex items-center gap-1.5 py-1.5 text-red-400 hover:text-red-300"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left panel ──────────────────────────────────── */}
        <aside className="w-72 shrink-0 flex flex-col gap-3 p-3 overflow-y-auto
                          border-r border-white/10 bg-dark-800/60 backdrop-blur-sm">

          {/* Risk Score Card */}
          <RiskScoreCard riskData={riskData} loading={loading} />

          {/* Alert Panel */}
          <AlertPanel alerts={riskData?.alerts} location={riskData?.location} />

          {/* Saved Locations */}
          {savedLocations.length > 0 && (
            <SavedLocations
              locations={savedLocations}
              onSelect={(loc) => handleLocationSelect({ 
                lat: Number(loc.lat), 
                lon: Number(loc.lon), 
                name: loc.name 
              })}
              onRemove={(id) => handleRemoveLocation(id)}
            />
          )}

          {/* Risk History Panel */}
          <RiskHistoryPanel refreshTrigger={historyTrigger} />
        </aside>

        {/* ── Map ──────────────────────────────────────────── */}
        <main className="flex-1 relative">
          <ErrorBoundary>
            <FloodMap
              selectedLocation={selectedLocation}
              riskData={riskData}
              savedLocations={savedLocations}
              onMapClick={handleMapClick}
              showHeatmap={showHeatmap}
            />
          </ErrorBoundary>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-dark-900/50 flex items-center justify-center z-30 backdrop-blur-sm">
              <div className="glass-card px-6 py-4 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-brand-400 animate-spin" />
                <span className="text-sm text-white font-medium">Analyzing flood risk...</span>
              </div>
            </div>
          )}
        </main>

        {/* ── Right sidebar ──────────────────────────────── */}
        <aside className="w-64 shrink-0 flex flex-col gap-3 p-3
                          border-l border-white/10 bg-dark-800/60 backdrop-blur-sm overflow-y-auto">
          <Sidebar riskData={riskData} loading={loading} connected={connected} />
        </aside>
      </div>

      {/* ── Status bar ──────────────────────────────────── */}
      <footer className="shrink-0 h-7 flex items-center justify-between px-4
                         border-t border-white/5 bg-dark-900/80 text-xs text-slate-600">
        <span>Cognizant Blue Bolt · AIA BFS UK Hackathon 2026</span>
        <span>Risk = Rainfall×50% + Elevation×30% + Historical×20%</span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {savedLocations.length} saved · {selectedLocation ? 'Location active' : 'Click map to start'}
        </span>
      </footer>
    </div>
  );
}

// ── Saved Locations mini-list ─────────────────────────────────
function SavedLocations({ locations, onSelect, onRemove }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Saved Locations</span>
        <span className="text-xs text-slate-500">{locations.length}</span>
      </div>
      <div className="divide-y divide-white/5">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="flex items-center justify-between px-3 py-2 hover:bg-white/5
                       transition-colors group cursor-pointer"
            onClick={() => onSelect(loc)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0 bg-brand-500"
                   style={{ boxShadow: '0 0 4px #2aa3f5' }} />
              <span className="text-xs text-slate-300 truncate">{loc.name}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(loc.id); }}
              className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100
                         transition-all duration-150 ml-1 shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
