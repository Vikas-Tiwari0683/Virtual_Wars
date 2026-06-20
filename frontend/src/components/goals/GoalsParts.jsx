// =============================================================================
// SECTION: Goals page parts
// Config constants + CircularProgress, ActiveGoalCard, NewGoalPanel.
// Extracted from GoalsPage.jsx.
// =============================================================================

import { useState } from 'react';
import PropTypes from 'prop-types';
import MaterialIcon from '../atoms/MaterialIcon';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import { goalsAPI } from '../../services/api';

export const CAT_CONFIG = {
  transport: { icon: 'commute',       color: 'text-blue-600',   bg: 'bg-blue-50' },
  diet:      { icon: 'restaurant',    color: 'text-orange-600', bg: 'bg-orange-50' },
  energy:    { icon: 'bolt',          color: 'text-yellow-600', bg: 'bg-yellow-50' },
  shopping:  { icon: 'shopping_bag',  color: 'text-purple-600', bg: 'bg-purple-50' },
  waste:     { icon: 'recycling',     color: 'text-teal-600',   bg: 'bg-teal-50' },
  general:   { icon: 'flag',          color: 'text-green-600',  bg: 'bg-green-50' },
};

export const getCat = (c) => CAT_CONFIG[c?.toLowerCase()] || CAT_CONFIG.general;

export const STATUS_CONFIG = {
  active:    { label: 'On Track', badge: 'green', icon: 'check_circle' },
  completed: { label: 'Completed', badge: 'green', icon: 'emoji_events' },
  failed:    { label: 'Behind',   badge: 'red',   icon: 'error' },
};

export const SUGGESTED_GOALS = [
  { icon: 'directions_bus', title: 'Replace 2 car trips/week with bus',  saving: 32, category: 'Transport', target_kg: 32, days: 30 },
  { icon: 'eco',            title: 'Compost kitchen waste for 30 days',   saving: 12, category: 'Waste',     target_kg: 12, days: 30 },
  { icon: 'wb_sunny',       title: 'Turn off standby devices overnight',  saving: 18, category: 'Energy',    target_kg: 18, days: 30 },
];

// =============================================================================
// CircularProgress
// =============================================================================
export function CircularProgress({ pct, size = 80 }) {
  const r      = (size - 12) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color  = pct >= 70 ? '#006b2c' : pct >= 40 ? '#d97706' : '#dc2626';

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${pct}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="transparent" stroke="#dce2f7" strokeWidth={10} />
        <circle cx={size/2} cy={size/2} r={r} fill="transparent" stroke={color}
          strokeWidth={10} strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono font-bold text-sm text-[#141b2b]">{pct}%</span>
      </div>
    </div>
  );
}
CircularProgress.propTypes = { pct: PropTypes.number.isRequired, size: PropTypes.number };

// =============================================================================
// ActiveGoalCard
// =============================================================================
export function ActiveGoalCard({ goal, onComplete, onDelete }) {
  const cat    = getCat(goal.category);
  const status = STATUS_CONFIG[goal.status] || STATUS_CONFIG.active;
  const pct    = parseFloat(goal.progress_pct) || 0;
  const saved  = parseFloat(goal.progress_kg)  || 0;
  const target = parseFloat(goal.target_kg)    || 0;

  const deadline = new Date(goal.deadline);
  const today    = new Date();
  const daysLeft = Math.max(0, Math.ceil((deadline - today) / (1000 * 60 * 60 * 24)));

  return (
    <article className="bg-white rounded-2xl p-6 shadow-sm border border-[#bdcaba]/30 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`p-2 ${cat.bg} ${cat.color} rounded-lg`}>
            <MaterialIcon name={cat.icon} className="text-lg" />
          </span>
          <span className="text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider">{goal.category}</span>
        </div>
        <Badge variant={status.badge}>
          <MaterialIcon name={status.icon} fill={1} className="text-xs" />
          {status.label}
        </Badge>
      </div>

      <h3 className="text-base font-bold text-[#141b2b] mb-5 leading-snug">{goal.title}</h3>

      <div className="flex items-center gap-5 mb-5">
        <CircularProgress pct={Math.round(pct)} />
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#3e4a3d]">Saved</span>
            <span className="font-mono font-bold text-[#006b2c]">{saved.toFixed(1)} kg CO₂e</span>
          </div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-[#3e4a3d]">Target</span>
            <span className="font-mono font-bold text-[#141b2b]">{target.toFixed(1)} kg CO₂e</span>
          </div>
          <div className="w-full h-2 bg-[#e1e8fd] rounded-full overflow-hidden">
            <div className="h-full bg-[#006b2c] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, pct)}%` }}
              role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#f1f3ff]">
        <span className={`flex items-center gap-1 text-xs font-bold ${daysLeft <= 7 ? 'text-[#d97706]' : 'text-[#3e4a3d]'}`}>
          <MaterialIcon name="schedule" className="text-sm" />
          {daysLeft} days left
        </span>
        <div className="flex gap-2">
          <button onClick={() => onDelete(goal.id)}
            className="text-[11px] font-bold text-[#ba1a1a] border border-[#ffdad6] px-3 py-1 rounded-lg hover:bg-[#ffdad6] transition-colors">
            Delete
          </button>
          <button onClick={() => onComplete(goal.id)}
            className="text-[11px] font-bold text-[#006b2c] border border-[#b1f2be] px-3 py-1 rounded-lg hover:bg-[#f0fdf4] transition-colors">
            ✓ Complete
          </button>
        </div>
      </div>
    </article>
  );
}
ActiveGoalCard.propTypes = {
  goal: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

// =============================================================================
// NewGoalPanel — modal form to create a goal.
// =============================================================================
export function NewGoalPanel({ onClose, onCreated, prefill = {} }) {
  const [form, setForm] = useState({
    title:    prefill.title    || '',
    category: prefill.category || 'Transport',
    target:   prefill.target   || 20,
    days:     30,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const up = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleAdd = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError('');
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + Number(form.days));

    const { data, error: err } = await goalsAPI.create({
      title:     form.title.trim(),
      category:  form.category.toLowerCase(),
      target_kg: Number(form.target),
      deadline:  deadline.toISOString().split('T')[0],
    });

    setSaving(false);
    if (err) { setError(err); return; }
    onCreated(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-label="Create new goal">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#141b2b]">Create a New Goal</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-[#f1f3ff] rounded-full">
            <MaterialIcon name="close" className="text-xl text-[#3e4a3d]" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#ffdad6] text-[#93000a] rounded-lg text-sm flex items-center gap-2" role="alert">
            <MaterialIcon name="error" fill={1} className="text-base" />{error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="goal-title" className="block text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider mb-1">
              Goal Title *
            </label>
            <input id="goal-title" type="text" value={form.title} onChange={up('title')}
              placeholder="e.g. Reduce transport by 20%"
              className="w-full px-4 py-3 bg-[#f1f3ff] rounded-xl border-0 focus:ring-2 focus:ring-[#006b2c] text-[#141b2b] placeholder:text-[#bdcaba]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="goal-cat" className="block text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider mb-1">Category</label>
              <select id="goal-cat" value={form.category} onChange={up('category')}
                className="w-full px-4 py-3 bg-[#f1f3ff] rounded-xl border-0 focus:ring-2 focus:ring-[#006b2c] text-[#141b2b]">
                {['Transport', 'Diet', 'Energy', 'Shopping', 'Waste', 'General'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="goal-target" className="block text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider mb-1">Target (kg CO₂e)</label>
              <input id="goal-target" type="number" min="1" value={form.target} onChange={up('target')}
                className="w-full px-4 py-3 bg-[#f1f3ff] rounded-xl border-0 focus:ring-2 focus:ring-[#006b2c] text-[#141b2b]" />
            </div>
          </div>

          <div>
            <label htmlFor="goal-days" className="block text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider mb-1">
              Deadline: <span className="font-mono text-[#006b2c]">{form.days} days from today</span>
            </label>
            <input id="goal-days" type="range" min="7" max="90" value={form.days} onChange={up('days')}
              className="w-full accent-[#006b2c]" />
            <div className="flex justify-between text-[10px] text-[#3e4a3d] font-bold mt-0.5">
              <span>7 days</span><span>90 days</span>
            </div>
          </div>

          <div className="bg-[#f0fdf4] rounded-xl p-4 text-sm text-[#3e4a3d]">
            Committing to reduce <strong>{form.category}</strong> by <strong>{form.target} kg CO₂e</strong> in <strong>{form.days} days</strong>.
          </div>

          <Button fullWidth onClick={handleAdd} disabled={saving}>
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
            ) : (
              <><MaterialIcon name="flag" fill={1} className="text-lg" />Set Goal</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
NewGoalPanel.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
  prefill: PropTypes.object,
};
