// =============================================================================
// SECTION: GoalsPage — fully connected to backend
// Loads goals, creates/completes/deletes them. Card, panel, and config parts
// live in components/goals/GoalsParts.jsx.
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import DashboardShell from '../components/layout/DashboardShell';
import MaterialIcon   from '../components/atoms/MaterialIcon';
import Button         from '../components/atoms/Button';
import Badge          from '../components/atoms/Badge';
import { goalsAPI }   from '../services/api';
import { SUGGESTED_GOALS, ActiveGoalCard, NewGoalPanel } from '../components/goals/GoalsParts';

export default function GoalsPage() {
  const [activeGoals,    setActiveGoals]    = useState([]);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [showPanel,      setShowPanel]      = useState(false);
  const [prefill,        setPrefill]        = useState({});
  const [showCompleted,  setShowCompleted]  = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [toast,          setToast]          = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadGoals = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      goalsAPI.list('active'),
      goalsAPI.list('completed'),
    ]).then(([activeRes, completedRes]) => {
      if (cancelled) return;
      if (!activeRes.error)    setActiveGoals(activeRes.data || []);
      if (!completedRes.error) setCompletedGoals(completedRes.data || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => loadGoals(), [loadGoals]);

  const handleComplete = async (id) => {
    const { error } = await goalsAPI.update(id, { status: 'completed' });
    if (error) { showToast(`Error: ${error}`); return; }
    showToast('Goal completed! 🎉 Outstanding work!');
    loadGoals();
  };

  const handleDelete = async (id) => {
    setActiveGoals((prev) => prev.filter((g) => g.id !== id)); // optimistic
    const { error } = await goalsAPI.remove(id);
    if (error) { showToast(`Error: ${error}`); loadGoals(); }
  };

  const handleCreated = (goal) => {
    setActiveGoals((prev) => [goal, ...prev]);
    showToast('Goal created!');
  };

  const openPrefilled = (s) => {
    setPrefill({ title: s.title, category: s.category, target: s.target_kg });
    setShowPanel(true);
  };

  return (
    <DashboardShell>
      {toast && (
        <div role="status" aria-live="polite"
          className="fixed top-6 right-6 z-50 bg-[#006b2c] text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2">
          <MaterialIcon name="check_circle" fill={1} className="text-lg" />{toast}
        </div>
      )}

      {showPanel && (
        <NewGoalPanel
          prefill={prefill}
          onClose={() => { setShowPanel(false); setPrefill({}); }}
          onCreated={handleCreated} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#141b2b]">Goals</h1>
          <p className="text-sm text-[#3e4a3d] mt-1">Commit to reductions. Progress tracked automatically.</p>
        </div>
        <Button onClick={() => { setPrefill({}); setShowPanel(true); }}>
          <MaterialIcon name="add" className="text-lg" />New Goal
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: 'track_changes', label: 'Active',    value: activeGoals.length,    color: 'text-[#006b2c]', bg: 'bg-[#f0fdf4]' },
          { icon: 'check_circle',  label: 'Completed', value: completedGoals.length, color: 'text-[#006b2c]', bg: 'bg-[#b1f2be]' },
          { icon: 'emoji_events',  label: 'Total',     value: activeGoals.length + completedGoals.length, color: 'text-[#d97706]', bg: 'bg-[#fef3c7]' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-[#bdcaba]/30 text-center">
            <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <MaterialIcon name={s.icon} fill={1} className={`text-2xl ${s.color}`} />
            </div>
            <p className="font-mono text-3xl font-bold text-[#141b2b]">{s.value}</p>
            <p className="text-xs font-bold text-[#3e4a3d] uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-[#141b2b] mb-4">Active Goals ({activeGoals.length})</h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8"
          role="status" aria-busy="true" aria-label="Loading goals">
          {[1,2,3].map((i) => <div key={i} className="bg-white rounded-2xl h-56 animate-pulse" />)}
          <span className="sr-only">Loading your goals, please wait…</span>
        </div>
      ) : activeGoals.length === 0 ? (
        <div className="bg-[#f1f3ff] rounded-2xl p-12 text-center border-2 border-dashed border-[#bdcaba] mb-8">
          <MaterialIcon name="flag" fill={1} className="text-[#bdcaba] text-5xl block mx-auto mb-3" />
          <p className="text-base font-semibold text-[#3e4a3d]">No active goals</p>
          <p className="text-sm text-[#6e7b6c] mt-1 mb-4">Set your first goal to start tracking progress</p>
          <Button onClick={() => { setPrefill({}); setShowPanel(true); }}>
            <MaterialIcon name="add" className="text-lg" />Create First Goal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
          {activeGoals.map((g) => (
            <ActiveGoalCard key={g.id} goal={g} onComplete={handleComplete} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MaterialIcon name="auto_awesome" fill={1} className="text-[#006b2c] text-xl" />
          <h2 className="text-lg font-bold text-[#141b2b]">Suggested Goals</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SUGGESTED_GOALS.map((s) => (
            <div key={s.title} className="bg-[#f0fdf4] border border-[#b1f2be] rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#b1f2be] rounded-xl flex items-center justify-center">
                  <MaterialIcon name={s.icon} fill={1} className="text-[#006b2c] text-xl" />
                </div>
                <Badge variant="default">{s.category}</Badge>
              </div>
              <p className="text-sm font-semibold text-[#141b2b] leading-snug">{s.title}</p>
              <p className="text-xs text-[#3e4a3d]">
                Could save <strong className="text-[#006b2c]">~{s.saving} kg/month</strong>
              </p>
              <button onClick={() => openPrefilled(s)}
                className="text-[11px] font-bold text-[#006b2c] border border-[#006b2c] px-3 py-1.5 rounded-lg hover:bg-[#006b2c] hover:text-white transition-colors">
                Set This Goal
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <button onClick={() => setShowCompleted((v) => !v)}
          className="flex items-center gap-2 text-lg font-bold text-[#141b2b] mb-4 hover:text-[#006b2c] transition-colors"
          aria-expanded={showCompleted}
          aria-controls="completed-goals-list">
          <MaterialIcon name={showCompleted ? 'expand_less' : 'expand_more'} className="text-xl" />
          Completed Goals ({completedGoals.length})
        </button>
        {showCompleted && (
          <div id="completed-goals-list" className="bg-white rounded-2xl shadow-sm border border-[#bdcaba]/30 overflow-hidden">
            {completedGoals.length === 0 ? (
              <p className="text-sm text-[#3e4a3d] p-6 text-center">No completed goals yet.</p>
            ) : completedGoals.map((g, i) => (
              <div key={g.id}
                className={`flex items-center justify-between p-4 ${i < completedGoals.length - 1 ? 'border-b border-[#f1f3ff]' : ''} hover:bg-[#f9f9ff] transition-colors`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#b1f2be] rounded-full flex items-center justify-center flex-shrink-0">
                    <MaterialIcon name="check" fill={1} className="text-[#006b2c] text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#141b2b]">{g.title}</p>
                    <p className="text-xs text-[#3e4a3d] capitalize">{g.category}</p>
                  </div>
                </div>
                <Badge variant="green">
                  {parseFloat(g.progress_kg).toFixed(1)} kg saved
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
