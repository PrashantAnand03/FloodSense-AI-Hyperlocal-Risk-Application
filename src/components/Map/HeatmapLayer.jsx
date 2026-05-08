import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // points format: [lat, lon, intensity (0-1)]
    const heatData = points.map(p => [p.lat, p.lon, p.intensity]);

    const heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 12,
      gradient: {
        0.4: '#22c55e', // green (low risk)
        0.65: '#f59e0b', // yellow (medium risk)
        0.8: '#ef4444', // red (high risk)
        1.0: '#991b1b'  // dark red (severe)
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}
