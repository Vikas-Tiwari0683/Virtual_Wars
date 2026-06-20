// =============================================================================
// SECTION: Log Activity parts
// LiveCarbonPreview, PlaceInput, RouteDistancePicker, TodaysLog.
// Extracted from LogActivityPage.jsx.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import MaterialIcon from '../atoms/MaterialIcon';
import { autocomplete, getRouteDistance } from '../../services/mapsService';
import { CATEGORIES, TRAVEL_MODE_MAP, carbonColor } from './logActivityData';

// =============================================================================
// LiveCarbonPreview — animated preview of the computed carbon value.
// =============================================================================
export function LiveCarbonPreview({ kg }) {
  const equiv =
    kg === 0 ? 'Zero emissions — great choice!'
    : kg < 1  ? `≈ ${Math.round(kg * 1000)}g — lighter than a coffee`
    : kg < 5  ? `≈ charging ${Math.round(kg * 121)} smartphones`
    : `≈ driving ${Math.round(kg / 0.21)} km in a petrol car`;

  const bg = kg === 0 ? 'bg-[#b1f2be]' : kg <= 5 ? 'bg-[#fef3c7]' : 'bg-[#ffdad6]';

  return (
    <div className={`${bg} rounded-2xl p-5 text-center transition-all duration-300`} aria-live="polite" aria-atomic="true">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#3e4a3d] mb-1">Carbon Preview</p>
      <p className={`font-mono text-5xl font-bold mb-1 ${carbonColor(kg)}`}>{kg.toFixed(2)}</p>
      <p className="text-sm font-semibold text-[#3e4a3d]">kg CO₂e</p>
      <p className="text-xs text-[#3e4a3d] mt-2">{equiv}</p>
    </div>
  );
}
LiveCarbonPreview.propTypes = { kg: PropTypes.number.isRequired };

// =============================================================================
// PlaceInput — Google Maps Places autocomplete field.
// =============================================================================
export function PlaceInput({ id, label, value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open,        setOpen]        = useState(false);
  const [loading,     setLoading]     = useState(false);
  const debounceRef = useRef(null);
  const wrapRef     = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    clearTimeout(debounceRef.current);
    if (!val) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const { data } = await autocomplete(val);
      setSuggestions(data);
      setOpen(data.length > 0);
      setLoading(false);
    }, 350);
  };

  const handlePick = (s) => {
    onChange(s.description);
    onSelect(s);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={id} className="block text-xs font-bold text-[#3e4a3d] uppercase mb-1">{label}</label>
      <div className="relative">
        <MaterialIcon name="location_on" fill={1}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#006b2c] text-lg pointer-events-none" />
        <input id={id} type="text" value={value} onChange={handleChange} placeholder="Search a place…"
          autoComplete="off"
          className="w-full pl-9 pr-4 py-2.5 bg-[#f1f3ff] rounded-xl border-0 focus:ring-2 focus:ring-[#006b2c] text-[#141b2b] placeholder:text-[#bdcaba] text-sm" />
        {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#bdcaba] border-t-[#006b2c] rounded-full animate-spin" />}
      </div>
      {open && (
        <ul role="listbox" aria-label={`${label} suggestions`}
          className="absolute z-50 w-full mt-1 bg-white border border-[#bdcaba] rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button role="option" onMouseDown={() => handlePick(s)}
                className="w-full text-left px-4 py-2.5 text-sm text-[#141b2b] hover:bg-[#f0fdf4] flex items-center gap-2 transition-colors">
                <MaterialIcon name="place" className="text-[#006b2c] text-base flex-shrink-0" />
                {s.description}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
PlaceInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};

// =============================================================================
// RouteDistancePicker — origin/destination → distance via Routes API.
// =============================================================================
export function RouteDistancePicker({ subtypeId, onDistanceFound }) {
  const [origin,   setOrigin]   = useState('');
  const [dest,     setDest]     = useState('');
  const [originId, setOriginId] = useState(null);
  const [destId,   setDestId]   = useState(null);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const canCalculate = originId && destId;

  const handleCalculate = useCallback(async () => {
    setLoading(true); setError(null); setResult(null);
    const mode = TRAVEL_MODE_MAP[subtypeId] || 'DRIVE';
    const { data, error: err } = await getRouteDistance(originId, destId, mode);
    setLoading(false);
    if (err) { setError(err); return; }
    setResult(data);
  }, [originId, destId, subtypeId]);

  useEffect(() => {
    setOrigin(''); setDest('');
    setOriginId(null); setDestId(null);
    setResult(null); setError(null);
  }, [subtypeId]);

  return (
    <div className="bg-[#f0fdf4] border border-[#b1f2be] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
        </div>
        <div>
          <p className="text-[11px] font-bold text-[#006b2c] uppercase tracking-wider">Google Maps — Route Distance</p>
          <p className="text-[10px] text-[#3e4a3d]">Search origin & destination to auto-fill km</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 mb-4">
        <PlaceInput id="route-origin" label="From" value={origin}
          onChange={(v) => { setOrigin(v); setOriginId(null); setResult(null); }}
          onSelect={(s) => setOriginId(s.placeId)} />
        <div className="flex items-center gap-2">
          <div className="flex-1 border-t border-dashed border-[#b1f2be]" />
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#b1f2be]">
            <MaterialIcon name="swap_vert" className="text-[#006b2c] text-sm" />
          </div>
          <div className="flex-1 border-t border-dashed border-[#b1f2be]" />
        </div>
        <PlaceInput id="route-dest" label="To" value={dest}
          onChange={(v) => { setDest(v); setDestId(null); setResult(null); }}
          onSelect={(s) => setDestId(s.placeId)} />
      </div>
      <button onClick={handleCalculate} disabled={!canCalculate || loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#006b2c] text-white text-sm font-bold hover:bg-[#00873a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-3">
        {loading ? (
          <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Calculating…</>
        ) : (
          <><MaterialIcon name="route" fill={1} className="text-base" />Calculate Route</>
        )}
      </button>
      {error && (
        <div className="flex items-start gap-2 bg-[#fff1f0] border border-[#ffdad6] rounded-xl p-3 mb-3" role="alert">
          <MaterialIcon name="error" fill={1} className="text-[#ba1a1a] text-base flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#ba1a1a]">{error}</p>
        </div>
      )}
      {result && (
        <div className="bg-white rounded-xl p-4 flex items-center justify-between border border-[#b1f2be]">
          <div>
            <p className="text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider mb-0.5">Route Distance</p>
            <p className="font-mono text-2xl font-bold text-[#006b2c]">
              {result.distanceKm} <span className="text-sm font-normal text-[#3e4a3d]">km</span>
            </p>
            <p className="text-[11px] text-[#3e4a3d] mt-0.5">≈ {result.durationMin} min · {result.mode.toLowerCase()}</p>
          </div>
          <button onClick={() => onDistanceFound(result.distanceKm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#006b2c] text-white text-xs font-bold rounded-xl hover:bg-[#00873a] transition-colors">
            <MaterialIcon name="check" className="text-sm" />Use This
          </button>
        </div>
      )}
    </div>
  );
}
RouteDistancePicker.propTypes = {
  subtypeId: PropTypes.string,
  onDistanceFound: PropTypes.func.isRequired,
};

// =============================================================================
// TodaysLog — right-column list of today's logged activities + progress bar.
// =============================================================================
export function TodaysLog({ logged, loadingLog, todayTotal, onDelete }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#bdcaba]/30 sticky top-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-lg font-bold text-[#141b2b]">Today's Log</h3>
          <p className={`font-mono text-sm font-bold mt-0.5 ${carbonColor(todayTotal)}`}>
            {todayTotal.toFixed(2)} kg total
          </p>
        </div>
      </div>

      {loadingLog ? (
        <div className="flex flex-col gap-2 animate-pulse">
          {[1,2,3].map((i) => <div key={i} className="h-12 bg-[#f1f3ff] rounded-xl" />)}
        </div>
      ) : logged.length === 0 ? (
        <div className="text-center py-10">
          <MaterialIcon name="eco" fill={1} className="text-[#bdcaba] text-5xl block mx-auto mb-2" />
          <p className="text-sm text-[#3e4a3d]">No activities logged yet today.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 max-h-[480px] overflow-y-auto" role="list">
          {logged.map((act) => {
            const cat = CATEGORIES.find((c) => c.id === act.category);
            return (
              <li key={act.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f9f9ff] transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cat?.accent || '#3b82f6'}15` }}>
                    <MaterialIcon name={cat?.icon || 'eco'} className="text-xl" style={{ color: cat?.accent || '#3b82f6' }} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#141b2b] capitalize">{act.subtype?.replace(/_/g, ' ')}</p>
                    <p className="text-[11px] text-[#3e4a3d]">{act.quantity} {act.unit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-sm font-bold ${carbonColor(parseFloat(act.carbon_kg))}`}>
                    {parseFloat(act.carbon_kg).toFixed(2)} kg
                  </span>
                  <button onClick={() => onDelete(act.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#ffdad6] transition-all"
                    aria-label={`Delete ${act.subtype}`}>
                    <MaterialIcon name="delete" className="text-[#ba1a1a] text-base" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5 pt-4 border-t border-[#bdcaba]/30">
        <div className="flex justify-between text-[11px] font-bold text-[#3e4a3d] mb-1 uppercase">
          <span>Daily Goal: 10 kg</span>
          <span>{Math.min(100, Math.round((todayTotal / 10) * 100))}%</span>
        </div>
        <div className="h-2 bg-[#e1e8fd] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              todayTotal > 10 ? 'bg-[#ba1a1a]' : todayTotal > 7 ? 'bg-[#d97706]' : 'bg-[#006b2c]'
            }`}
            style={{ width: `${Math.min(100, (todayTotal / 10) * 100)}%` }}
            role="progressbar"
            aria-valuenow={Math.min(100, Math.round((todayTotal / 10) * 100))}
            aria-valuemin={0} aria-valuemax={100}
            aria-label="Daily carbon goal progress" />
        </div>
      </div>
    </div>
  );
}
TodaysLog.propTypes = {
  logged: PropTypes.array.isRequired,
  loadingLog: PropTypes.bool,
  todayTotal: PropTypes.number.isRequired,
  onDelete: PropTypes.func.isRequired,
};
