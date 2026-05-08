import { useEffect, useState } from 'react';
import { CircleMarker, FeatureGroup, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getRiskColor } from '../../utils/riskColors';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Heatmap Overlay Component
 * Generates a grid of risk assessment points around the center location
 * Shows color-coded circles indicating flood risk at different locations
 */
export function HeatmapOverlay({ lat, lon, show, onDataLoaded }) {
  const [gridPoints, setGridPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!show || !lat || !lon) {
      setGridPoints([]);
      return;
    }

    generateAndFetchHeatmap(lat, lon);
  }, [show, lat, lon]);

  const generateAndFetchHeatmap = async (centerLat, centerLon) => {
    setLoading(true);
    setError(null);

    try {
      // Generate grid of points in a 10km radius (approximately 0.09 degrees at equator)
      const gridRadius = 0.09;
      const gridSize =5; // 5x5 grid = 25 points
      const points = generateGridPoints(centerLat, centerLon, gridRadius, gridSize);

      // Batch request for all points (limited to 10)
      const chunkedPoints = chunkArray(points, 10);
      const allResults = [];

      for (const chunk of chunkedPoints) {
        try {
          const response = await axios.post(`${API_BASE}/risk/multi`, {
            locations: chunk.map(p => ({
              lat: p.lat,
              lon: p.lon,
              name: `Grid ${p.lat.toFixed(4)}, ${p.lon.toFixed(4)}`,
            })),
          });

          if (response.data?.data) {
            allResults.push(...response.data.data);
          }
        } catch (err) {
          console.warn('[Heatmap] Chunk fetch error:', err.message);
        }
      }

      const enrichedPoints = points.map((p, idx) => {
        const result = allResults[idx];
        return {
          ...p,
          risk: result?.risk || { level: 'UNKNOWN', score: 0 },
          data: result,
        };
      });

      setGridPoints(enrichedPoints);
      if (onDataLoaded) onDataLoaded(enrichedPoints);
    } catch (err) {
      console.error('[Heatmap] Generation error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show || gridPoints.length === 0) {
    return null;
  }

  return (
    <FeatureGroup>
      {gridPoints.map((point, idx) => {
        const color = getRiskColor(point.risk?.level);
        const opacity = 0.5 + (point.risk?.score || 0) * 0.5; // More opaque = higher risk

        return (
          <CircleMarker
            key={`heatmap-${idx}`}
            center={[point.lat, point.lon]}
            radius={8}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: opacity,
              weight: 2,
              opacity: 0.8,
            }}
          >
            {/* Popup on click */}
            {point.data && (
              <Popup>
                <div className="text-xs" style={{ maxWidth: '200px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {point.data.name}
                  </p>
                  <div style={{ color: color, fontWeight: 'bold', marginBottom: '4px' }}>
                    {point.risk?.level} RISK — {point.risk?.percentage}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                    <div>🌧️ Rain: {point.data.weather?.precip_mm}mm</div>
                    <div>💧 Condition: {point.data.weather?.condition}</div>
                  </div>
                </div>
              </Popup>
            )}
          </CircleMarker>
        );
      })}
    </FeatureGroup>
  );
}

/**
 * Generate a grid of points around a center location
 * @param {number} centerLat - Center latitude
 * @param {number} centerLon - Center longitude
 * @param {number} radius - Radius in degrees
 * @param {number} gridSize - Number of points per side (gridSize x gridSize)
 * @returns {array} Array of {lat, lon} points
 */
function generateGridPoints(centerLat, centerLon, radius, gridSize) {
  const points = [];
  const step = (radius * 2) / (gridSize - 1);

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = centerLat - radius + i * step;
      const lon = centerLon - radius + j * step;

      // Validate coordinates
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        points.push({ lat, lon });
      }
    }
  }

  return points;
}

/**
 * Chunk an array into smaller arrays
 */
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
