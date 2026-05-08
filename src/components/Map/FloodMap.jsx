import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, CircleMarker, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRiskColor } from '../../utils/riskColors';
import { HeatmapOverlay } from './HeatmapOverlay';

// Fix Leaflet default icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Custom colored risk marker ─────────────────────────────────────────────

function createRiskIcon(color) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative; width:28px; height:28px;">
        <div style="
          width:28px; height:28px;
          background:${color};
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 0 12px ${color}99;
          position:absolute;
          top:0; left:0;
        "></div>
        <div style="
          width:40px; height:40px;
          background:${color}33;
          border-radius:50%;
          position:absolute;
          top:-6px; left:-6px;
          animation: ripple 1.8s ease-out infinite;
        "></div>
      </div>
    `,
    iconSize:   [28, 28],
    iconAnchor: [14, 14],
    popupAnchor:[0, -16],
  });
}

// ── Map click handler ──────────────────────────────────────────────────────

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

// ── Main FloodMap component ────────────────────────────────────────────────

export default function FloodMap({ selectedLocation, riskData, savedLocations, onMapClick, showHeatmap = false }) {
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Default center: UK (as per hackathon context)
  const defaultCenter = [51.505, -0.09];
  const defaultZoom   = 6;

  // Pan map when location changes
  useEffect(() => {
    if (mapReady && selectedLocation && mapRef.current) {
      mapRef.current.flyTo(
        [selectedLocation.lat, selectedLocation.lon],
        13,
        { animate: true, duration: 1.5 }
      );
    }
  }, [selectedLocation, mapReady]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      {/* Ripple animation keyframe injected inline */}
      <style>{`
        @keyframes ripple {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        zoomControl={false}
        className="w-full h-full"
        ref={mapRef}
        whenReady={() => setMapReady(true)}
      >
        {/* Dark tile layer — CartoDB Dark Matter */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
        />

        <ZoomControl position="bottomright" />
        <MapClickHandler onMapClick={onMapClick} />

        {/* Heatmap overlay */}
        {showHeatmap && selectedLocation && (
          <HeatmapOverlay
            lat={selectedLocation.lat}
            lon={selectedLocation.lon}
            show={showHeatmap}
          />
        )}

        {/* Saved location markers */}
        {savedLocations && savedLocations.map((loc, idx) => {
          const color = loc.risk?.level ? getRiskColor(loc.risk.level) : '#2aa3f5'; // Brand blue for saved
          return (
            <Marker
              key={`saved-${idx}`}
              position={[loc.lat, loc.lon]}
              icon={createRiskIcon(color)}
            >
              <Popup>
                <PopupContent loc={loc} />
              </Popup>
            </Marker>
          );
        })}

        {/* Active selected location marker */}
        {selectedLocation && riskData && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lon]}
            icon={createRiskIcon(getRiskColor(riskData.risk?.level))}
          >
            <Popup>
              <PopupContent
                loc={{
                  lat:  selectedLocation.lat,
                  lon:  selectedLocation.lon,
                  name: riskData.location?.name,
                  risk: riskData.risk,
                  weather: riskData.weather,
                }}
              />
            </Popup>
          </Marker>
        )}

        {/* Pending click — grey marker with no risk yet */}
        {selectedLocation && !riskData && (
          <CircleMarker
            center={[selectedLocation.lat, selectedLocation.lon]}
            radius={10}
            pathOptions={{ color: '#94a3b8', fillColor: '#94a3b8', fillOpacity: 0.5 }}
          />
        )}
      </MapContainer>

      {/* Map overlay hint */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-[500] 
                      bg-dark-800/80 backdrop-blur-sm border border-white/10 
                      text-slate-400 text-xs px-3 py-1.5 rounded-full pointer-events-none">
        Click anywhere on the map to assess flood risk
      </div>
    </div>
  );
}

// ── Popup content ──────────────────────────────────────────────────────────

function PopupContent({ loc }) {
  const { name, risk, weather } = loc;
  const color = getRiskColor(risk?.level);

  return (
    <div className="min-w-[180px]">
      <div className="font-semibold text-sm mb-2" style={{ color: '#e2e8f0' }}>
        📍 {name || `${loc.lat?.toFixed(4)}, ${loc.lon?.toFixed(4)}`}
      </div>

      {risk && (
        <div
          className="text-sm font-bold mb-1 px-2 py-1 rounded"
          style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
        >
          {risk.level === 'HIGH' ? '🔴' : risk.level === 'MEDIUM' ? '🟡' : '🟢'}{' '}
          {risk.level} RISK — {risk.percentage}%
        </div>
      )}

      {weather && (
        <div className="text-xs space-y-0.5 mt-2" style={{ color: '#94a3b8' }}>
          <div>🌧️ Rainfall: {weather.precip_mm ?? 0}mm</div>
          <div>💧 Humidity: {weather.humidity}%</div>
          <div>🌡️ Temp: {weather.temp_c}°C</div>
        </div>
      )}
    </div>
  );
}
