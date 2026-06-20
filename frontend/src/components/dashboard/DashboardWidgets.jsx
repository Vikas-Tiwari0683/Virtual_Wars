// =============================================================================
// SECTION: Dashboard widgets
// All presentational/interactive widgets used by DashboardPage, extracted to
// keep the page focused on data loading + composition.
// =============================================================================

import { useState, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import MaterialIcon from '../atoms/MaterialIcon';
import Badge from '../atoms/Badge';
import { recommendationsAPI, challengesAPI } from '../../services/api';
import { ROUTES } from '../../utils/constants';

// =============================================================================
// DashboardHeader
// =============================================================================
export const DashboardHeader = memo(function DashboardHeader({ name }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <header className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-2xl font-bold text-[#141b2b]">{greeting}, {name} 👋</h2>
        <p className="text-sm text-[#3e4a3d]">Here is your carbon footprint overview for today.</p>
      </div>
      <div className="hidden md:flex items-center gap-3">
        <button className="relative p-2 rounded-full hover:bg-[#e9edff] transition-colors" aria-label="Notifications">
          <MaterialIcon name="notifications" className="text-[#3e4a3d] text-2xl" />
        </button>
        <div className="w-10 h-10 rounded-full bg-[#006b2c] text-white flex items-center justify-center font-bold"
          aria-label={`Avatar for ${name}`}>
          {name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
});
DashboardHeader.propTypes = { name: PropTypes.string };

// =============================================================================
// HeroScoreWidget
// =============================================================================
export const HeroScoreWidget = memo(function HeroScoreWidget({ todayKg = 0, streak = 0 }) {
  const goal = 10;
  const pctAbove = todayKg > goal ? Math.round(((todayKg - goal) / goal) * 100) : 0;
  const status   = todayKg === 0 ? null : todayKg <= 5 ? 'green' : todayKg <= 10 ? 'amber' : 'red';
  const label    = todayKg === 0 ? 'No logs yet' : todayKg <= 5 ? 'Great' : todayKg <= 10 ? 'Moderate' : 'High';

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm border border-[#bdcaba]/30 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden"
      aria-label="Today's carbon footprint score">
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#006b2c]/5 rounded-full -translate-y-20 translate-x-20 blur-3xl pointer-events-none" />
      <div className="flex-grow z-10">
        <p className="text-[11px] font-bold text-[#3e4a3d] uppercase tracking-widest mb-2">Today's Footprint</p>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="font-mono text-6xl font-bold text-[#141b2b]">{todayKg.toFixed(1)}</span>
          <span className="text-xl text-[#3e4a3d] font-medium">kg CO₂e</span>
        </div>
        {status && (
          <Badge variant={status} className="mb-3">
            <MaterialIcon name={status === 'green' ? 'check_circle' : 'warning'} fill={1} className="text-xs" />
            {label}
          </Badge>
        )}
        {pctAbove > 0 ? (
          <p className="text-sm text-[#3e4a3d] max-w-sm leading-relaxed">
            You are {pctAbove}% above your daily goal. Try taking the bus or a meatless meal today.
          </p>
        ) : (
          <p className="text-sm text-[#3e4a3d] max-w-sm leading-relaxed">
            {todayKg === 0 ? 'Log your first activity today to start tracking.' : "You're within your daily goal — keep it up!"}
          </p>
        )}
      </div>
      <div className="flex md:flex-col gap-6 md:gap-4 z-10 text-center md:text-right flex-shrink-0">
        <div>
          <p className="text-[10px] text-[#3e4a3d] uppercase font-bold mb-0.5">Daily Goal</p>
          <p className="font-mono font-bold text-lg text-[#141b2b]">{goal} kg</p>
        </div>
        <div>
          <p className="text-[10px] text-[#3e4a3d] uppercase font-bold mb-1">Streak</p>
          {streak > 0 ? (
            <Badge variant="green" className="justify-center">
              <MaterialIcon name="local_fire_department" fill={1} className="text-xs" aria-hidden="true" />
              {streak} day{streak !== 1 ? 's' : ''}
            </Badge>
          ) : (
            <p className="font-mono font-bold text-lg text-[#141b2b]">0 days</p>
          )}
        </div>
      </div>
    </section>
  );
});
HeroScoreWidget.propTypes = { todayKg: PropTypes.number, streak: PropTypes.number };

// =============================================================================
// StatCards
// =============================================================================
export const StatCards = memo(function StatCards({ weekCategories = [], streak = 0 }) {
  const catMap = useMemo(
    () => Object.fromEntries(weekCategories.map((c) => [c.category, parseFloat(c.total_kg)])),
    [weekCategories]
  );

  const stats = [
    { label: 'Transport', icon: 'commute',              value: catMap.transport ?? null, bg: 'bg-blue-50',   color: 'text-blue-600' },
    { label: 'Diet',      icon: 'restaurant',            value: catMap.diet      ?? null, bg: 'bg-orange-50', color: 'text-orange-600' },
    { label: 'Energy',    icon: 'bolt',                  value: catMap.energy    ?? null, bg: 'bg-yellow-50', color: 'text-yellow-600' },
    { label: 'Streak',    icon: 'local_fire_department', value: streak,                   bg: 'bg-green-50',  color: 'text-green-600', isStreak: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="list" aria-label="Category stats">
      {stats.map((s) => (
        <article key={s.label}
          className="bg-white p-5 rounded-xl shadow-sm border border-[#bdcaba]/20 hover:scale-[1.02] transition-transform"
          role="listitem">
          <div className="flex justify-between items-start mb-3">
            <span className={`p-2 ${s.bg} ${s.color} rounded-lg`}>
              <MaterialIcon name={s.icon} className="text-xl" />
            </span>
          </div>
          <p className="text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider mb-1">{s.label}</p>
          <p className="font-mono font-bold text-lg text-[#141b2b]">
            {s.isStreak ? (
              s.value > 0 ? (
                <Badge variant="green" className="mt-1">
                  <MaterialIcon name="local_fire_department" fill={1} className="text-xs" aria-hidden="true" />
                  Day {s.value}
                </Badge>
              ) : (
                <span className="text-[#bdcaba] text-sm font-normal">No streak yet</span>
              )
            ) : s.value !== null ? (
              `${s.value.toFixed(1)} kg`
            ) : (
              <span className="text-[#bdcaba] text-sm font-normal">No data</span>
            )}
          </p>
        </article>
      ))}
    </div>
  );
});
StatCards.propTypes = { weekCategories: PropTypes.array, streak: PropTypes.number };

// =============================================================================
// WeeklyChart
// =============================================================================
export const WeeklyChart = memo(function WeeklyChart({ trend = [] }) {
  const GOAL = 10;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const trendMap = Object.fromEntries(
    trend.map((t) => {
      const d = new Date(t.date);
      const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      return [days[idx], parseFloat(t.total_kg)];
    })
  );
  const chartData = days.map((day) => ({ day, value: trendMap[day] ?? 0 }));
  const hasData = chartData.some((d) => d.value > 0);

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-[#bdcaba]/30" aria-labelledby="chart-heading">
      <div className="flex justify-between items-center mb-6">
        <h3 id="chart-heading" className="text-lg font-semibold text-[#141b2b]">Weekly Emissions vs Goal</h3>
        <div className="flex gap-4 text-[10px] font-bold uppercase">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#006b2c] inline-block" aria-hidden="true" /> Actual
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#bdcaba] inline-block" aria-hidden="true" /> Goal
          </span>
        </div>
      </div>

      <table className="sr-only">
        <caption>Weekly carbon emissions by day</caption>
        <thead><tr><th scope="col">Day</th><th scope="col">kg CO₂e</th></tr></thead>
        <tbody>
          {chartData.map((d) => <tr key={d.day}><td>{d.day}</td><td>{d.value} kg</td></tr>)}
        </tbody>
      </table>

      {!hasData ? (
        <div className="h-[220px] flex items-center justify-center">
          <div className="text-center">
            <MaterialIcon name="bar_chart" className="text-[#bdcaba] text-5xl block mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-[#3e4a3d]">No activity logged this week yet.</p>
          </div>
        </div>
      ) : (
        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={32} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#3e4a3d', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip cursor={{ fill: '#f1f3ff' }}
                contentStyle={{ background: '#fff', border: '1px solid #bdcaba', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v) => [`${v.toFixed(2)} kg`, 'Emissions']} />
              <ReferenceLine y={GOAL} stroke="#bdcaba" strokeDasharray="4 4"
                label={{ value: 'Goal', fill: '#bdcaba', fontSize: 10, position: 'right' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.value > GOAL ? '#ba1a1a' : entry.day === 'Sat' ? '#8d4b00' : '#006b2c'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
});
WeeklyChart.propTypes = { trend: PropTypes.array };

// =============================================================================
// RecommendationCards — live Done/Skip.
// =============================================================================
export function RecommendationCards({ tips, setTips }) {
  const handleAction = async (id, action) => {
    setTips((prev) => prev.filter((t) => t.id !== id)); // optimistic
    await recommendationsAPI.action(id, action);
  };

  if (tips.length === 0) {
    return (
      <section aria-labelledby="tips-heading">
        <h3 id="tips-heading" className="text-lg font-semibold text-[#141b2b] mb-4">Smart Tips</h3>
        <div className="bg-[#f1f3ff] rounded-xl p-6 text-center">
          <MaterialIcon name="lightbulb" fill={1} className="text-[#006b2c] text-4xl mb-2" />
          <p className="text-sm text-[#3e4a3d]">All tips actioned! Check back tomorrow.</p>
        </div>
      </section>
    );
  }

  const ICONS = { transport: 'directions_bus', diet: 'restaurant', energy: 'bolt', shopping: 'shopping_bag', waste: 'recycling' };

  return (
    <section aria-labelledby="tips-heading">
      <h3 id="tips-heading" className="text-lg font-semibold text-[#141b2b] mb-4">Smart Tips</h3>
      <div className="flex flex-col gap-3">
        {tips.slice(0, 3).map((tip) => (
          <article key={tip.id} className="bg-[#f1f3ff] p-4 rounded-xl border border-[#bdcaba]/30 hover:shadow-lg transition-all">
            <div className="flex justify-between items-start mb-2">
              <MaterialIcon name={ICONS[tip.category] || 'eco'} fill={1} className="text-[#006b2c] text-2xl" />
              <Badge variant="green">Saves ~{tip.saving_kg}kg</Badge>
            </div>
            <p className="font-semibold text-sm text-[#141b2b] mb-1">{tip.title}</p>
            <p className="text-xs text-[#3e4a3d] mb-3 line-clamp-2">{tip.description}</p>
            <div className="flex gap-2">
              <button onClick={() => handleAction(tip.id, 'done')}
                className="text-[11px] font-bold text-[#006b2c] border border-[#006b2c] px-3 py-1 rounded-lg hover:bg-[#f0fdf4] transition-colors"
                aria-label={`Mark "${tip.title}" as done`}>
                ✓ Done
              </button>
              <button onClick={() => handleAction(tip.id, 'skip')}
                className="text-[11px] font-bold text-[#3e4a3d] border border-[#bdcaba] px-3 py-1 rounded-lg hover:bg-[#e9edff] transition-colors"
                aria-label={`Skip "${tip.title}"`}>
                ✕ Skip
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
RecommendationCards.propTypes = { tips: PropTypes.array.isRequired, setTips: PropTypes.func.isRequired };

// =============================================================================
// GoalsProgress
// =============================================================================
export const GoalsProgress = memo(function GoalsProgress({ activeGoals = 0 }) {
  const navigate = useNavigate();
  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-[#bdcaba]/30 flex flex-col gap-5"
      aria-labelledby="goals-heading">
      <h3 id="goals-heading" className="text-lg font-semibold text-[#141b2b]">Active Goals</h3>
      <div className="text-center py-4">
        <p className="font-mono text-5xl font-bold text-[#006b2c]">{activeGoals}</p>
        <p className="text-sm text-[#3e4a3d] mt-1">goals in progress</p>
      </div>
      <button
        onClick={() => navigate(ROUTES.GOALS)}
        className="w-full flex items-center justify-center gap-2 border-2 border-[#bdcaba] py-2 rounded-lg text-[12px] font-bold text-[#3e4a3d] uppercase tracking-wider hover:bg-[#f1f3ff] transition-colors mt-auto">
        <MaterialIcon name="add" className="text-lg" />
        Set New Goal
      </button>
    </section>
  );
});
GoalsProgress.propTypes = { activeGoals: PropTypes.number };

// =============================================================================
// CommunityChallengeBanner
// =============================================================================
export function CommunityChallengeBanner() {
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);
  const [joined,  setJoined]  = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    const { error } = await challengesAPI.join(1);
    setJoining(false);
    if (!error) setJoined(true);
  };

  return (
    <section className="bg-[#006b2c] text-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden"
      aria-labelledby="challenge-heading">
      <div className="z-10">
        <Badge variant="default" className="!bg-white/20 !text-white mb-3">Community Challenge</Badge>
        <h4 id="challenge-heading" className="text-xl font-bold mb-1">Plastic-Free Week</h4>
        <p className="text-sm text-white/90 max-w-xs">Join others in reducing single-use plastics. Challenge ends soon!</p>
      </div>
      <div className="z-10 flex flex-col items-start md:items-end gap-3 flex-shrink-0">
        <button
          onClick={joined ? () => navigate(ROUTES.COMMUNITY) : handleJoin}
          disabled={joining}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] font-semibold text-sm !bg-white !text-[#006b2c] font-bold hover:!bg-[#f0fdf4] disabled:opacity-50 transition-colors">
          {joining ? 'Joining…' : joined ? 'View Challenge →' : 'Participate Now'}
        </button>
      </div>
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#f7fff2]/20 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}

// =============================================================================
// RecentActivity
// =============================================================================
export const RecentActivity = memo(function RecentActivity({ activities = [] }) {
  const navigate = useNavigate();
  const ICONS = { transport: 'commute', diet: 'restaurant', energy: 'bolt', shopping: 'shopping_bag', waste: 'delete' };

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-[#bdcaba]/30" aria-labelledby="activity-heading">
      <div className="flex justify-between items-center mb-4">
        <h3 id="activity-heading" className="text-lg font-semibold text-[#141b2b]">Recent Activity</h3>
        <button onClick={() => navigate(ROUTES.LOG)} className="text-sm text-[#006b2c] font-semibold hover:underline">
          View All
        </button>
      </div>
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <MaterialIcon name="eco" fill={1} className="text-[#bdcaba] text-4xl block mx-auto mb-2" />
          <p className="text-sm text-[#3e4a3d]">No activities yet.</p>
          <button onClick={() => navigate(ROUTES.LOG)} className="text-sm text-[#006b2c] font-bold mt-2 hover:underline">
            Log your first activity →
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" role="list">
          {activities.map((a) => (
            <li key={a.id} className="flex items-center justify-between p-2 hover:bg-[#f9f9ff] rounded-lg transition-colors" role="listitem">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-[#e9edff] text-[#3e4a3d] rounded-lg">
                  <MaterialIcon name={ICONS[a.category] || 'eco'} className="text-xl" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#141b2b] capitalize">{a.subtype?.replace(/_/g, ' ')}</p>
                  <p className="text-[11px] text-[#3e4a3d] capitalize">{a.category} · {a.quantity} {a.unit}</p>
                </div>
              </div>
              <span className={`font-mono font-bold text-sm ${
                a.carbon_kg === 0 ? 'text-[#006b2c]' : parseFloat(a.carbon_kg) > 5 ? 'text-[#ba1a1a]' : 'text-[#3e4a3d]'
              }`}>
                {parseFloat(a.carbon_kg).toFixed(2)} kg
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});
RecentActivity.propTypes = { activities: PropTypes.array };

// =============================================================================
// LoadingSkeleton
// =============================================================================
export function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse" aria-busy="true" aria-label="Loading dashboard data" role="status">
      <div className="bg-white rounded-xl h-40 w-full" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => <div key={i} className="bg-white rounded-xl h-24" />)}
      </div>
      <div className="bg-white rounded-xl h-64 w-full" />
      <span className="sr-only">Loading your dashboard, please wait…</span>
    </div>
  );
}
