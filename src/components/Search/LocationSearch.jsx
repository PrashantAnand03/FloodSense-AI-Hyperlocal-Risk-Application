import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { searchLocations } from '../../services/api';

export default function LocationSearch({ onLocationSelect }) {
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef  = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);

    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchLocations(val);
        setResults(data || []);
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const handleSelect = (location) => {
    setQuery(`${location.name}, ${location.country}`);
    setShowResults(false);
    onLocationSelect({
      lat:  location.lat,
      lon:  location.lon,
      name: `${location.name}, ${location.region || location.country}`,
    });
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Search input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 text-slate-400 w-4 h-4 pointer-events-none" />

        <input
          id="location-search"
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search location, city, postcode..."
          className="input-dark pl-10 pr-10 text-sm"
          autoComplete="off"
        />

        {/* Right icon: loading or clear */}
        <div className="absolute right-3">
          {loading ? (
            <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
          ) : query ? (
            <button onClick={handleClear} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 glass-card border border-white/10 overflow-hidden animate-fade-in">
          {results.map((loc, idx) => (
            <button
              key={`${loc.lat}-${loc.lon}-${idx}`}
              onClick={() => handleSelect(loc)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-600/20 
                         transition-colors duration-150 border-b border-white/5 last:border-b-0 text-left"
            >
              <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
              <div>
                <div className="text-sm font-medium text-white">{loc.name}</div>
                <div className="text-xs text-slate-400">{loc.region}{loc.region && ', '}{loc.country}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showResults && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 glass-card px-4 py-3 text-sm text-slate-400">
          No locations found for "{query}"
        </div>
      )}
    </div>
  );
}
