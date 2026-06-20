// =============================================================================
// SECTION: LogActivityPage
// Fully connected — Log Activity calls activitiesAPI.create(),
// delete calls activitiesAPI.remove(), and today's log loads from
// activitiesAPI.list() on mount.
// =============================================================================

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import DashboardShell from '../components/layout/DashboardShell';
import MaterialIcon   from '../components/atoms/MaterialIcon';
import Button         from '../components/atoms/Button';
import Badge          from '../components/atoms/Badge';
import { activitiesAPI } from '../services/api';
import { autocomplete, getRouteDistance } from '../services/mapsService';
import { parseActivitiesCsv } from '../utils/csv';

// =============================================================================
// SECTION: Emission data
// =============================================================================
const CATEGORIES = [
  {
    id: 'transport', label: 'Transport', icon: 'commute',
    bg: 'bg-blue-50', color: 'text-blue-600', accent: '#3b82f6',
    subtypes: [
      { id: 'car_petrol', label: 'Car (Petrol)', factor: 0.21,  unit: 'km' },
      { id: 'car_ev',     label: 'Car (EV)',     factor: 0.05,  unit: 'km' },
      { id: 'bus',        label: 'Bus',          factor: 0.089, unit: 'km' },
      { id: 'train',      label: 'Train',        factor: 0.041, unit: 'km' },
      { id: 'flight',     label: 'Flight',       factor: 0.255, unit: 'km' },
      { id: 'cycle',      label: 'Cycling',      factor: 0,     unit: 'km' },
    ],
  },
  {
    id: 'diet', label: 'Diet', icon: 'restaurant',
    bg: 'bg-orange-50', color: 'text-orange-600', accent: '#f97316',
    subtypes: [
      { id: 'beef',    label: 'Beef meal',    factor: 6.61, unit: 'serving' },
      { id: 'chicken', label: 'Chicken meal', factor: 1.26, unit: 'serving' },
      { id: 'fish',    label: 'Fish meal',    factor: 2.04, unit: 'serving' },
      { id: 'vegan',   label: 'Vegan meal',   factor: 0.50, unit: 'serving' },
      { id: 'dairy',   label: 'Dairy (milk)', factor: 3.15, unit: 'litre' },
    ],
  },
  {
    id: 'energy', label: 'Energy', icon: 'bolt',
    bg: 'bg-yellow-50', color: 'text-yellow-600', accent: '#eab308',
    subtypes: [
      { id: 'elec',    label: 'Electricity',  factor: 0.233, unit: 'kWh' },
      { id: 'gas',     label: 'Natural gas',  factor: 2.04,  unit: 'm³' },
      { id: 'heating', label: 'Oil heating',  factor: 2.52,  unit: 'litre' },
    ],
  },
  {
    id: 'shopping', label: 'Shopping', icon: 'shopping_bag',
    bg: 'bg-purple-50', color: 'text-purple-600', accent: '#9333ea',
    subtypes: [
      { id: 'clothing', label: 'New clothing item', factor: 8.1,  unit: 'item' },
      { id: 'laptop',   label: 'Laptop/device',     factor: 300,  unit: 'item' },
      { id: 'online',   label: 'Online parcel',     factor: 0.43, unit: 'parcel' },
    ],
  },
  {
    id: 'waste', label: 'Waste', icon: 'delete',
    bg: 'bg-teal-50', color: 'text-teal-600', accent: '#14b8a6',
    subtypes: [
      { id: 'landfill', label: 'Landfill waste',    factor: 0.57, unit: 'kg' },
      { id: 'recycled', label: 'Recycled waste',    factor: 0.02, unit: 'kg' },
      { id: 'compost',  label: 'Composted organic', factor: 0.01, unit: 'kg' },
    ],
  },
];

function carbonColor(kg) {
  if (kg <= 2) return 'text-[#006b2c]';
  if (kg <= 8) return 'text-[#d97706]';
  return 'text-[#dc2626]';
}

// =============================================================================
// SECTION: LiveCarbonPreview
// =============================================================================
function LiveCarbonPreview({ kg }) {
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

// =============================================================================
// SECTION: PlaceInput — Google Maps autocomplete
// =============================================================================
function PlaceInput({ id, label, value, onChange, onSelect }) {
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

// =============================================================================
// SECTION: RouteDistancePicker
// =============================================================================
const TRAVEL_MODE_MAP = {
  car_petrol: 'DRIVE', car_ev: 'DRIVE',
  bus: 'TRANSIT', train: 'TRANSIT',
  flight: 'DRIVE', cycle: 'BICYCLE',
};

function RouteDistancePicker({ subtypeId, onDistanceFound }) {
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
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
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

// =============================================================================
// SECTION: LogActivityPage — Default Export
// =============================================================================
export default function LogActivityPage() {
  const [selCategory, setSelCategory] = useState(null);
  const [selSubtype,  setSelSubtype]  = useState(null);
  const [quantity,    setQuantity]    = useState(1);
  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0]);
  const [notes,       setNotes]       = useState('');
  const [logged,      setLogged]      = useState([]);
  const [toast,       setToast]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [loadingLog,  setLoadingLog]  = useState(true);
  const [importing,   setImporting]   = useState(false);
  const csvInputRef = useRef(null);

  // FR-012: Quick-log favorites — stored in localStorage
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ct_favorites') || '[]'); }
    catch { return []; }
  });

  const saveFavorite = useCallback(() => {
    const cat = CATEGORIES.find((c) => c.id === selCategory);
    const sub = cat?.subtypes.find((s) => s.id === selSubtype);
    if (!cat || !sub) return;
    const fav = {
      id:          `${selCategory}_${selSubtype}`,
      label:       `${cat.label} · ${sub.label}`,
      categoryId:  selCategory,
      subtypeId:   selSubtype,
      defaultQty:  quantity,
      unit:        sub.unit,
      icon:        cat.icon,
      accent:      cat.accent,
    };
    setFavorites((prev) => {
      const next = [fav, ...prev.filter((f) => f.id !== fav.id)].slice(0, 6);
      localStorage.setItem('ct_favorites', JSON.stringify(next));
      return next;
    });
    showToast('Added to Quick Log!');
  }, [selCategory, selSubtype, quantity]);

  const removeFavorite = useCallback((favId) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== favId);
      localStorage.setItem('ct_favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const logFavorite = useCallback(async (fav) => {
    const cat = CATEGORIES.find((c) => c.id === fav.categoryId);
    const sub = cat?.subtypes.find((s) => s.id === fav.subtypeId);
    if (!cat || !sub) return;
    const carbonKg = Math.round(fav.defaultQty * sub.factor * 1000) / 1000;
    setSaving(true);
    const { data, error } = await activitiesAPI.create({
      category:    fav.categoryId,
      subtype:     fav.subtypeId,
      quantity:    fav.defaultQty,
      unit:        fav.unit,
      carbon_kg:   carbonKg,
      notes:       '',
      logged_date: new Date().toISOString().split('T')[0],
    });
    setSaving(false);
    if (error) { showToast(`Error: ${error}`); return; }
    setLogged((prev) => [data, ...prev]);
    showToast(`Quick logged! +${carbonKg.toFixed(2)} kg CO₂e`);
  }, []);

  const category = CATEGORIES.find((c) => c.id === selCategory);
  const subtype  = category?.subtypes.find((s) => s.id === selSubtype);

  const carbonKg = useMemo(() => {
    if (!subtype) return 0;
    return Math.round(quantity * subtype.factor * 1000) / 1000;
  }, [quantity, subtype]);

  const todayTotal = useMemo(() => logged.reduce((sum, a) => sum + parseFloat(a.carbon_kg), 0), [logged]);

  // Load today's activities on mount — cancelled flag prevents state update after unmount
  useEffect(() => {
    let cancelled = false;
    const today = new Date().toISOString().split('T')[0];
    activitiesAPI.list({ date_from: today, date_to: today, limit: 50 }).then(({ data }) => {
      if (cancelled) return;
      if (data?.activities) setLogged(data.activities);
      setLoadingLog(false);
    });
    return () => { cancelled = true; };
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Log Activity → POST /api/activities
  const handleLog = async () => {
    if (!category || !subtype || quantity <= 0) return;
    setSaving(true);
    const { data, error } = await activitiesAPI.create({
      category:  selCategory,
      subtype:   selSubtype,
      quantity,
      unit:      subtype.unit,
      carbon_kg: carbonKg,
      notes,
      logged_date: date,
    });
    setSaving(false);
    if (error) { showToast(`Error: ${error}`); return; }
    setLogged((prev) => [data, ...prev]);
    showToast(`Logged! +${carbonKg.toFixed(2)} kg CO₂e`);
    setSelSubtype(null);
    setQuantity(1);
    setNotes('');
  };

  // Delete → DELETE /api/activities/:id
  const handleDelete = async (id) => {
    setLogged((prev) => prev.filter((a) => a.id !== id)); // optimistic
    const { error } = await activitiesAPI.remove(id);
    if (error) {
      // revert by reloading
      const today = new Date().toISOString().split('T')[0];
      const { data } = await activitiesAPI.list({ date_from: today, date_to: today, limit: 50 });
      if (data?.activities) setLogged(data.activities);
    }
  };

  // ==========================================================================
  // SECTION: handleCsvImport — FR-013 CSV bulk import
  // Expected CSV format (header row required):
  //   category,subtype,quantity,unit,carbon_kg,notes,logged_date
  // Rows with missing required fields are skipped with a warning.
  // ==========================================================================
  const handleCsvImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so same file can be re-selected

    setImporting(true);
    const text = await file.text();

    const { rows, skipped, error } = parseActivitiesCsv(text);
    if (error) {
      showToast(`Error: ${error}`);
      setImporting(false);
      return;
    }

    let imported = 0;
    let failed   = skipped;

    for (const activity of rows) {
      const { data, error: apiErr } = await activitiesAPI.create(activity);
      if (apiErr) { failed++; }
      else { setLogged((prev) => [data, ...prev]); imported++; }
    }

    setImporting(false);
    showToast(
      failed > 0
        ? `Imported ${imported} activities (${failed} rows skipped)`
        : `Imported ${imported} activities successfully`
    );
  };

  return (
    <DashboardShell>
      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite"
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 ${
            toast.startsWith('Error') ? 'bg-[#ba1a1a]' : 'bg-[#006b2c]'
          } text-white`}>
          <MaterialIcon name={toast.startsWith('Error') ? 'error' : 'check_circle'} fill={1} className="text-lg" />
          {toast}
        </div>
      )}

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#141b2b]">Log Activity</h1>
          <p className="text-sm text-[#3e4a3d] mt-1">What did you do today? We'll calculate the carbon impact instantly.</p>
        </div>
        {/* FR-013: CSV bulk import */}
        <div className="hidden md:block">
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvImport}
            className="sr-only"
            aria-label="Import activities from CSV file"
            id="csv-file-input"
          />
          <button
            onClick={() => csvInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 border border-[#bdcaba] px-4 py-2 rounded-xl text-sm font-semibold text-[#3e4a3d] hover:bg-[#e9edff] transition-colors disabled:opacity-50"
            aria-label="Import CSV file"
          >
            {importing ? (
              <><span className="w-4 h-4 border-2 border-[#bdcaba] border-t-[#006b2c] rounded-full animate-spin" aria-hidden="true" />Importing…</>
            ) : (
              <><MaterialIcon name="upload_file" className="text-lg" aria-hidden="true" />Import CSV</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT — Log Form */}
        <div className="lg:col-span-7 flex flex-col gap-5">

          {/* FR-012: Quick Log — pinned favorites */}
          {favorites.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bdcaba]/30">
              <p className="text-[11px] font-bold text-[#3e4a3d] uppercase tracking-widest mb-3">
                ⚡ Quick Log
              </p>
              <div className="flex flex-wrap gap-2">
                {favorites.map((fav) => (
                  <div key={fav.id} className="flex items-center gap-1 bg-[#f0fdf4] border border-[#b1f2be] rounded-full pr-1">
                    <button
                      onClick={() => logFavorite(fav)}
                      disabled={saving}
                      className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold text-[#006b2c] hover:bg-[#b1f2be] rounded-full transition-colors"
                      aria-label={`Quick log ${fav.label}`}
                    >
                      <MaterialIcon name={fav.icon} className="text-sm" aria-hidden="true" style={{ color: fav.accent }} />
                      {fav.label}
                      <span className="text-[10px] opacity-60">{fav.defaultQty}{fav.unit}</span>
                    </button>
                    <button
                      onClick={() => removeFavorite(fav.id)}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[#3e4a3d] hover:bg-[#ffdad6] hover:text-[#ba1a1a] transition-colors"
                      aria-label={`Remove ${fav.label} from favorites`}
                    >
                      <MaterialIcon name="close" className="text-xs" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 — Category */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#bdcaba]/30">
            <p className="text-[11px] font-bold text-[#3e4a3d] uppercase tracking-widest mb-4">1 · Choose a Category</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3" role="group" aria-label="Emission category">
              {CATEGORIES.map((cat) => {
                const active = selCategory === cat.id;
                return (
                  <button key={cat.id}
                    onClick={() => { setSelCategory(cat.id); setSelSubtype(null); }}
                    aria-pressed={active}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      active ? 'border-[#006b2c] bg-[#f0fdf4] shadow-md' : 'border-[#bdcaba] hover:border-[#006b2c] hover:bg-[#f9f9ff]'
                    }`}>
                    {active && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#006b2c] rounded-full flex items-center justify-center">
                        <MaterialIcon name="check" className="text-white text-xs" />
                      </span>
                    )}
                    <span className={`p-2 rounded-lg ${cat.bg} ${cat.color}`}>
                      <MaterialIcon name={cat.icon} className="text-xl" />
                    </span>
                    <span className="text-[11px] font-bold text-[#141b2b] text-center leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 — Subtype */}
          {category && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#bdcaba]/30">
              <p className="text-[11px] font-bold text-[#3e4a3d] uppercase tracking-widest mb-4">2 · Select Activity Type</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Activity subtype">
                {category.subtypes.map((sub) => {
                  const active = selSubtype === sub.id;
                  return (
                    <button key={sub.id} onClick={() => setSelSubtype(sub.id)} aria-pressed={active}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                        active ? 'bg-[#006b2c] text-white border-[#006b2c]' : 'bg-white text-[#3e4a3d] border-[#bdcaba] hover:border-[#006b2c]'
                      }`}>
                      {sub.label}
                      <span className="ml-1 opacity-60 text-[11px]">
                        {sub.factor > 0 ? `~${sub.factor} kg/${sub.unit}` : '0 kg'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Route Distance Picker — transport km only */}
          {subtype && selCategory === 'transport' && subtype.unit === 'km' && (
            <RouteDistancePicker subtypeId={selSubtype} onDistanceFound={(km) => setQuantity(km)} />
          )}

          {/* Step 3 — Quantity */}
          {subtype && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#bdcaba]/30">
              <p className="text-[11px] font-bold text-[#3e4a3d] uppercase tracking-widest mb-4">3 · Enter Quantity</p>
              <div className="flex items-center gap-4 mb-4">
                <button onClick={() => setQuantity((q) => Math.max(0.5, parseFloat((q - 0.5).toFixed(1))))}
                  className="w-11 h-11 rounded-full bg-[#f1f3ff] text-[#141b2b] text-2xl font-bold flex items-center justify-center hover:bg-[#e1e8fd]"
                  aria-label="Decrease quantity">−</button>
                <div className="flex-1 text-center">
                  <input type="number" min="0" step="0.5" value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-28 text-center font-mono text-4xl font-bold text-[#141b2b] bg-transparent border-b-2 border-[#006b2c] focus:outline-none"
                    aria-label={`Quantity in ${subtype.unit}`}
                    aria-describedby="qty-unit-label" />
                  <p id="qty-unit-label" className="text-sm text-[#3e4a3d] mt-1 font-semibold">{subtype.unit}</p>
                </div>
                <button onClick={() => setQuantity((q) => parseFloat((q + 0.5).toFixed(1)))}
                  className="w-11 h-11 rounded-full bg-[#f1f3ff] text-[#141b2b] text-2xl font-bold flex items-center justify-center hover:bg-[#e1e8fd]"
                  aria-label="Increase quantity">+</button>
              </div>
              <input type="range" min="0"
                max={subtype.unit === 'km' ? 200 : subtype.unit === 'kWh' ? 100 : 20}
                step="0.5" value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value))}
                className="w-full accent-[#006b2c]" aria-label="Quantity slider" />
            </div>
          )}

          {/* Live preview */}
          {subtype && <LiveCarbonPreview kg={carbonKg} />}

          {/* Step 4 — Date & Notes */}
          {subtype && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#bdcaba]/30">
              <p className="text-[11px] font-bold text-[#3e4a3d] uppercase tracking-widest mb-4">4 · Date & Notes</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="activity-date" className="block text-xs font-bold text-[#3e4a3d] uppercase mb-1">Date</label>
                  <input id="activity-date" type="date" value={date}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f1f3ff] rounded-lg border-0 focus:ring-2 focus:ring-[#006b2c] text-[#141b2b]" />
                </div>
                <div>
                  <label htmlFor="activity-notes" className="block text-xs font-bold text-[#3e4a3d] uppercase mb-1">Notes (optional)</label>
                  <div className="relative">
                    <input id="activity-notes" type="text" placeholder="e.g. drove to client meeting"
                      value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={160}
                      className="w-full px-4 py-2.5 pr-10 bg-[#f1f3ff] rounded-lg border-0 focus:ring-2 focus:ring-[#006b2c] text-[#141b2b] placeholder:text-[#bdcaba]" />
                    {/* FR-014: Voice-to-text using Web Speech API */}
                    {'webkitSpeechRecognition' in window || 'SpeechRecognition' in window ? (
                      <button
                        type="button"
                        aria-label="Dictate notes using voice"
                        onClick={() => {
                          const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                          const rec = new SR();
                          rec.lang = 'en-US';
                          rec.interimResults = false;
                          rec.onresult = (e) => {
                            setNotes((prev) => (prev ? prev + ' ' : '') + e.results[0][0].transcript);
                          };
                          rec.start();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#3e4a3d] hover:bg-[#e1e8fd] transition-colors"
                      >
                        <MaterialIcon name="mic" className="text-lg" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <Button fullWidth className="mt-5 py-4 text-base rounded-xl" onClick={handleLog}
                disabled={!selCategory || !selSubtype || quantity <= 0 || saving}>
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                ) : (
                  <><MaterialIcon name="add_circle" fill={1} className="text-xl" />Log Activity</>
                )}
              </Button>
              {/* FR-012: Save current selection as a quick-log favorite */}
              <button
                type="button"
                onClick={saveFavorite}
                className="w-full mt-2 text-[11px] font-bold text-[#006b2c] hover:underline flex items-center justify-center gap-1"
                aria-label="Save as Quick Log favorite"
              >
                <MaterialIcon name="bookmark" fill={1} className="text-sm" aria-hidden="true" />
                Save as Quick Log
              </button>
            </div>
          )}

          {!selCategory && (
            <div className="bg-[#f1f3ff] rounded-2xl p-10 text-center border-2 border-dashed border-[#bdcaba]">
              <MaterialIcon name="touch_app" className="text-[#bdcaba] text-5xl mb-3 block mx-auto" />
              <p className="text-base font-semibold text-[#3e4a3d]">Select a category above to start logging</p>
              <p className="text-sm text-[#6e7b6c] mt-1">Takes under 2 minutes</p>
            </div>
          )}
        </div>

        {/* RIGHT — Today's log */}
        <div className="lg:col-span-5">
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
                          <MaterialIcon name={cat?.icon || 'eco'} className="text-xl"
                            style={{ color: cat?.accent || '#3b82f6' }} />
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
                        <button onClick={() => handleDelete(act.id)}
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

            {/* Daily progress bar */}
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
        </div>
      </div>
    </DashboardShell>
  );
}
