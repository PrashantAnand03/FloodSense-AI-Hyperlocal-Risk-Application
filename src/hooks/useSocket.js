import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected]   = useState(false);
  const [riskData,  setRiskData]    = useState(null);
  const [loading,   setLoading]     = useState(false);
  const [error,     setError]       = useState(null);

  // Initialize socket once
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[Socket] Disconnected');
    });

    socket.on('risk_update', (data) => {
      setRiskData(data);
      setLoading(false);
    });

    socket.on('error', (err) => {
      setError(err.message);
      setLoading(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Subscribe to a location for real-time updates
  const subscribeToLocation = useCallback((lat, lon, locationName = '') => {
    if (!socketRef.current) return;
    setLoading(true);
    setError(null);
    socketRef.current.emit('subscribe_location', { lat, lon, locationName });
  }, []);

  // Manual refresh
  const refreshRisk = useCallback((lat, lon, locationName = '') => {
    if (!socketRef.current) return;
    setLoading(true);
    socketRef.current.emit('refresh_risk', { lat, lon, locationName });
  }, []);

  // Unsubscribe
  const unsubscribe = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('unsubscribe_location');
    setRiskData(null);
  }, []);

  return {
    connected,
    riskData,
    loading,
    error,
    subscribeToLocation,
    refreshRisk,
    unsubscribe,
  };
}
