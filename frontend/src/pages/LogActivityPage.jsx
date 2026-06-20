// =============================================================================
// SECTION: LogActivityPage
// Logs activities (manual + CSV + quick-log favorites). Sub-components and
// emission data live in components/log/.
// =============================================================================

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import DashboardShell from '../components/layout/DashboardShell';
import MaterialIcon   from '../components/atoms/MaterialIcon';
import Button         from '../components/atoms/Button';
import { activitiesAPI } from '../services/api';
import { parseActivitiesCsv } from '../utils/csv';
import { CATEGORIES } from '../components/log/logActivityData';
import { LiveCarbonPreview, RouteDistancePicker, TodaysLog } from '../components/log/LogActivityParts';

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

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

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
      id: `${selCategory}_${selSubtype}`, label: `${cat.label} · ${sub.label}`,
      categoryId: selCategory, subtypeId: selSubtype, defaultQty: quantity,
      unit: sub.unit, icon: cat.icon, accent: cat.accent,
    };
    setFavorites((prev) => {
      const next = [fav, ...prev.filter((f) => f.id !== fav.id)].slice(0, 6);
      localStorage.setItem('ct_favorites', JSON.stringify(next));
      return next;
    });
    showToast('Added to Quick Log!');
  }, [selCategory, selSubtype, quantity, showToast]);

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
    const kg = Math.round(fav.defaultQty * sub.factor * 1000) / 1000;
    setSaving(true);
    const { data, error } = await activitiesAPI.create({
      category: fav.categoryId, subtype: fav.subtypeId, quantity: fav.defaultQty,
      unit: fav.unit, carbon_kg: kg, notes: '', logged_date: new Date().toISOString().split('T')[0],
    });
    setSaving(false);
    if (error) { showToast(`Error: ${error}`); return; }
    setLogged((prev) => [data, ...prev]);
    showToast(`Quick logged! +${kg.toFixed(2)} kg CO₂e`);
  }, [showToast]);

  const category = CATEGORIES.find((c) => c.id === selCategory);
  const subtype  = category?.subtypes.find((s) => s.id === selSubtype);

  const carbonKg = useMemo(() => {
    if (!subtype) return 0;
    return Math.round(quantity * subtype.factor * 1000) / 1000;
  }, [quantity, subtype]);

  const todayTotal = useMemo(() => logged.reduce((sum, a) => sum + parseFloat(a.carbon_kg), 0), [logged]);

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

  const handleLog = async () => {
    if (!category || !subtype || quantity <= 0) return;
    setSaving(true);
    const { data, error } = await activitiesAPI.create({
      category: selCategory, subtype: selSubtype, quantity,
      unit: subtype.unit, carbon_kg: carbonKg, notes, logged_date: date,
    });
    setSaving(false);
    if (error) { showToast(`Error: ${error}`); return; }
    setLogged((prev) => [data, ...prev]);
    showToast(`Logged! +${carbonKg.toFixed(2)} kg CO₂e`);
    setSelSubtype(null);
    setQuantity(1);
    setNotes('');
  };

  const handleDelete = async (id) => {
    setLogged((prev) => prev.filter((a) => a.id !== id)); // optimistic
    const { error } = await activitiesAPI.remove(id);
    if (error) {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await activitiesAPI.list({ date_from: today, date_to: today, limit: 50 });
      if (data?.activities) setLogged(data.activities);
    }
  };

  // FR-013: CSV bulk import — parsing delegated to parseActivitiesCsv util.
  const handleCsvImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setImporting(true);
    const text = await file.text();
    const { rows, skipped, error } = parseActivitiesCsv(text);
    if (error) { showToast(`Error: ${error}`); setImporting(false); return; }

    let imported = 0;
    let failed   = skipped;
    for (const activity of rows) {
      const { data, error: apiErr } = await activitiesAPI.create(activity);
      if (apiErr) { failed++; }
      else { setLogged((prev) => [data, ...prev]); imported++; }
    }
    setImporting(false);
    showToast(failed > 0
      ? `Imported ${imported} activities (${failed} rows skipped)`
      : `Imported ${imported} activities successfully`);
  };

  return (
    <DashboardShell>
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
        <div className="hidden md:block">
          <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={handleCsvImport}
            className="sr-only" aria-label="Import activities from CSV file" id="csv-file-input" />
          <button onClick={() => csvInputRef.current?.click()} disabled={importing}
            className="flex items-center gap-2 border border-[#bdcaba] px-4 py-2 rounded-xl text-sm font-semibold text-[#3e4a3d] hover:bg-[#e9edff] transition-colors disabled:opacity-50"
            aria-label="Import CSV file">
            {importing ? (
              <><span className="w-4 h-4 border-2 border-[#bdcaba] border-t-[#006b2c] rounded-full animate-spin" aria-hidden="true" />Importing…</>
            ) : (
              <><MaterialIcon name="upload_file" className="text-lg" aria-hidden="true" />Import CSV</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col gap-5">

          {favorites.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bdcaba]/30">
              <p className="text-[11px] font-bold text-[#3e4a3d] uppercase tracking-widest mb-3">⚡ Quick Log</p>
              <div className="flex flex-wrap gap-2">
                {favorites.map((fav) => (
                  <div key={fav.id} className="flex items-center gap-1 bg-[#f0fdf4] border border-[#b1f2be] rounded-full pr-1">
                    <button onClick={() => logFavorite(fav)} disabled={saving}
                      className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold text-[#006b2c] hover:bg-[#b1f2be] rounded-full transition-colors"
                      aria-label={`Quick log ${fav.label}`}>
                      <MaterialIcon name={fav.icon} className="text-sm" aria-hidden="true" style={{ color: fav.accent }} />
                      {fav.label}
                      <span className="text-[10px] opacity-60">{fav.defaultQty}{fav.unit}</span>
                    </button>
                    <button onClick={() => removeFavorite(fav.id)}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[#3e4a3d] hover:bg-[#ffdad6] hover:text-[#ba1a1a] transition-colors"
                      aria-label={`Remove ${fav.label} from favorites`}>
                      <MaterialIcon name="close" className="text-xs" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#bdcaba]/30">
            <p className="text-[11px] font-bold text-[#3e4a3d] uppercase tracking-widest mb-4">1 · Choose a Category</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3" role="group" aria-label="Emission category">
              {CATEGORIES.map((cat) => {
                const active = selCategory === cat.id;
                return (
                  <button key={cat.id} onClick={() => { setSelCategory(cat.id); setSelSubtype(null); }} aria-pressed={active}
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

          {subtype && selCategory === 'transport' && subtype.unit === 'km' && (
            <RouteDistancePicker subtypeId={selSubtype} onDistanceFound={(km) => setQuantity(km)} />
          )}

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
                    aria-label={`Quantity in ${subtype.unit}`} aria-describedby="qty-unit-label" />
                  <p id="qty-unit-label" className="text-sm text-[#3e4a3d] mt-1 font-semibold">{subtype.unit}</p>
                </div>
                <button onClick={() => setQuantity((q) => parseFloat((q + 0.5).toFixed(1)))}
                  className="w-11 h-11 rounded-full bg-[#f1f3ff] text-[#141b2b] text-2xl font-bold flex items-center justify-center hover:bg-[#e1e8fd]"
                  aria-label="Increase quantity">+</button>
              </div>
              <input type="range" min="0" max={subtype.unit === 'km' ? 200 : subtype.unit === 'kWh' ? 100 : 20}
                step="0.5" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value))}
                className="w-full accent-[#006b2c]" aria-label="Quantity slider" />
            </div>
          )}

          {subtype && <LiveCarbonPreview kg={carbonKg} />}

          {subtype && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#bdcaba]/30">
              <p className="text-[11px] font-bold text-[#3e4a3d] uppercase tracking-widest mb-4">4 · Date & Notes</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="activity-date" className="block text-xs font-bold text-[#3e4a3d] uppercase mb-1">Date</label>
                  <input id="activity-date" type="date" value={date} max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f1f3ff] rounded-lg border-0 focus:ring-2 focus:ring-[#006b2c] text-[#141b2b]" />
                </div>
                <div>
                  <label htmlFor="activity-notes" className="block text-xs font-bold text-[#3e4a3d] uppercase mb-1">Notes (optional)</label>
                  <div className="relative">
                    <input id="activity-notes" type="text" placeholder="e.g. drove to client meeting"
                      value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={160}
                      className="w-full px-4 py-2.5 pr-10 bg-[#f1f3ff] rounded-lg border-0 focus:ring-2 focus:ring-[#006b2c] text-[#141b2b] placeholder:text-[#bdcaba]" />
                    {/* FR-014: Voice-to-text via Web Speech API (when supported) */}
                    {('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
                      <button type="button" aria-label="Dictate notes using voice"
                        onClick={() => {
                          const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                          const rec = new SR();
                          rec.lang = 'en-US';
                          rec.interimResults = false;
                          rec.onresult = (e) => setNotes((prev) => (prev ? prev + ' ' : '') + e.results[0][0].transcript);
                          rec.start();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#3e4a3d] hover:bg-[#e1e8fd] transition-colors">
                        <MaterialIcon name="mic" className="text-lg" aria-hidden="true" />
                      </button>
                    )}
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
              <button type="button" onClick={saveFavorite}
                className="w-full mt-2 text-[11px] font-bold text-[#006b2c] hover:underline flex items-center justify-center gap-1"
                aria-label="Save as Quick Log favorite">
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

        <div className="lg:col-span-5">
          <TodaysLog logged={logged} loadingLog={loadingLog} todayTotal={todayTotal} onDelete={handleDelete} />
        </div>
      </div>
    </DashboardShell>
  );
}
