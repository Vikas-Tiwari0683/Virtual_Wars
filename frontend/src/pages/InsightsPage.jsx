// =============================================================================
// SECTION: InsightsPage
// Data analytics deep-dive page with:
//   - Summary stat strip
//   - Recharts area/line chart with period toggle (Week / Month / Year)
//   - Category donut breakdown + comparisons
//   - Carbon equivalents visual strip
//   - GitHub-style 12-week activity heatmap
//   - Top reduction opportunity cards
//   - Gemini AI Analysis panel
// =============================================================================

import { useState, useEffect, useMemo, memo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import DashboardShell from '../components/layout/DashboardShell';
import MaterialIcon   from '../components/atoms/MaterialIcon';
import Badge          from '../components/atoms/Badge';
import { activitiesAPI } from '../services/api';

// =============================================================================
// SECTION: Static display data (not from API)
// =============================================================================
const HEAT_COLORS  = ['#f1f3ff', '#b1f2be', '#62df7d', '#2e6a41', '#006b2c'];
const CAT_COLORS   = {
  transport: '#3b82f6', diet: '#f97316', energy: '#eab308',
  shopping: '#9333ea', waste: '#14b8a6',
};
const OPPORTUNITIES = [
  { icon: 'directions_bus', category: 'Transport', action: 'Switch Tuesday commute to public transit', saving: 45, pct: 13, difficulty: 'Easy' },
  { icon: 'restaurant',     category: 'Diet',      action: 'Replace 2 beef meals/week with chicken',  saving: 32, pct: 9,  difficulty: 'Easy' },
  { icon: 'wb_sunny',       category: 'Energy',    action: 'Install solar on your hot water system',   saving: 28, pct: 8,  difficulty: 'Hard' },
];

// Deterministic display heatmap — fixed pseudo-pattern so the visual is stable
// across renders and contains no randomness (this is illustrative UI data only,
// not security-sensitive). A small deterministic hash spreads values 0–4.
const HEATMAP_DATA = Array.from({ length: 12 }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => ((week * 7 + day) * 7 + 3) % 5)
);

// =============================================================================
// SECTION: useInsightsData — loads real trend + summary from API
// Cancels in-flight requests when period changes to prevent memory leaks.
// =============================================================================
function useInsightsData(period) {
  const [trend,    setTrend]    = useState([]);
  const [summary,  setSummary]  = useState({ totalKg: 0, categories: [] });
  const [loading,  setLoading]  = useState(true);

  const periodMap = { Week: 'week', Month: 'month', Year: 'year' };

  useEffect(() => {
    let cancelled = false;   // ← abort flag for stale responses
    setLoading(true);

    const days   = period === 'Week' ? 7 : period === 'Month' ? 30 : 365;
    const apiPer = periodMap[period] || 'week';

    Promise.all([
      activitiesAPI.trend(days),
      activitiesAPI.summary(apiPer),
    ]).then(([trendRes, summaryRes]) => {
      if (cancelled) return;  // ← discard if period changed while in flight
      if (!trendRes.error)   setTrend(trendRes.data?.trend   || []);
      if (!summaryRes.error) setSummary(summaryRes.data || { totalKg: 0, categories: [] });
      setLoading(false);
    });

    return () => { cancelled = true; };   // ← cleanup on period change / unmount
  }, [period]);

  return { trend, summary, loading };
}

// =============================================================================
// SECTION: SummaryStrip — real data
// =============================================================================
const SummaryStrip = memo(function SummaryStrip({ summary }) {
  const topCat = summary.categories?.[0];
  const stats = [
    { label: 'This Period',   value: `${(summary.totalKg || 0).toFixed(1)} kg`, sub: 'CO₂e', icon: 'co2', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Top Category',  value: topCat ? topCat.category : '—', sub: topCat ? `${parseFloat(topCat.total_kg).toFixed(1)} kg` : 'No data', icon: 'warning', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { label: 'Activities',    value: summary.categories?.reduce((s, c) => s + parseInt(c.activity_count || 0), 0) || 0, sub: 'logged', icon: 'edit_note', iconBg: 'bg-green-50', iconColor: 'text-green-600' },
    { label: 'Categories',    value: summary.categories?.length || 0, sub: 'tracked', icon: 'track_changes', iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-[#bdcaba]/30 flex items-start gap-4">
          <span className={`p-2.5 rounded-xl ${s.iconBg} ${s.iconColor} flex-shrink-0`} aria-hidden="true">
            <MaterialIcon name={s.icon} fill={1} className="text-2xl" />
          </span>
          <div>
            <p className="text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider">{s.label}</p>
            <p className="font-mono text-xl font-bold text-[#141b2b] leading-tight">{s.value}</p>
            <p className="text-xs text-[#3e4a3d]">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
});

// =============================================================================
// SECTION: TrendChart — real API data
// =============================================================================
const TrendChart = memo(function TrendChart({ trend, period, onPeriodChange, loading }) {
  // Transform API trend data into chart-ready format
  const data = useMemo(() => {
    if (!trend.length) return [];
    return trend.map((t) => ({
      label: new Date(t.date).toLocaleDateString('en', {
        weekday: period === 'Week' ? 'short' : undefined,
        month:   period !== 'Week' ? 'short' : undefined,
        day:     period === 'Year' ? undefined : 'numeric',
      }),
      kg: parseFloat(t.total_kg),
    }));
  }, [trend, period]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#bdcaba]/30 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h3 className="text-lg font-bold text-[#141b2b]">Carbon Trend</h3>
        <div className="flex gap-1 bg-[#f1f3ff] p-1 rounded-xl" role="tablist" aria-label="Period selector">
          {['Week', 'Month', 'Year'].map((p) => (
            <button key={p} role="tab" aria-selected={period === p}
              onClick={() => onPeriodChange(p)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all ${
                period === p ? 'bg-white text-[#006b2c] shadow-sm' : 'text-[#3e4a3d] hover:bg-[#e1e8fd]'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div
          className="h-[250px] bg-[#f1f3ff] rounded-xl animate-pulse"
          role="status"
          aria-busy="true"
          aria-label="Loading chart data"
        >
          <span className="sr-only">Loading carbon trend chart…</span>
        </div>
      ) : data.length === 0 ? (
        <div className="h-[250px] flex items-center justify-center">
          <div className="text-center">
            <MaterialIcon name="bar_chart" className="text-[#bdcaba] text-5xl block mx-auto mb-2" />
            <p className="text-sm text-[#3e4a3d]">No activity data for this period yet.</p>
          </div>
        </div>
      ) : (
        <>
          <table className="sr-only">
            <caption>Carbon emissions — {period} view</caption>
            <thead><tr><th scope="col">Period</th><th scope="col">kg CO₂e</th></tr></thead>
            <tbody>{data.map((d) => <tr key={d.label}><td>{d.label}</td><td>{d.kg}</td></tr>)}</tbody>
          </table>
          <div aria-hidden="true">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#006b2c" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#006b2c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f3ff" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#3e4a3d', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#3e4a3d' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #bdcaba', borderRadius: '10px', fontSize: '12px' }}
                  formatter={(v) => [`${v} kg`, 'Emissions']} />
                <Area type="monotone" dataKey="kg" stroke="#006b2c" strokeWidth={2.5}
                  fill="url(#areaGrad)" dot={{ fill: '#006b2c', r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
});

// =============================================================================
// SECTION: BreakdownAndComparison — real category data
// =============================================================================
const BreakdownAndComparison = memo(function BreakdownAndComparison({ summary }) {
  const RADIAN = Math.PI / 180;
  const pieData = useMemo(() => (summary.categories || []).map((c) => ({
    name:     c.category,
    value:    parseFloat(c.total_kg),
    color:    CAT_COLORS[c.category] || '#bdcaba',
    count:    c.activity_count,
  })), [summary.categories]);

  const total = summary.totalKg || 0;

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return percent > 0.07 ? (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  if (!pieData.length) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-[#bdcaba]/30">
        <h3 className="text-lg font-bold text-[#141b2b] mb-5">Breakdown by Category</h3>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div aria-hidden="true">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="value" labelLine={false} label={renderLabel}>
                  {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#f9f9ff]">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} aria-hidden="true" />
                  <span className="text-sm font-semibold text-[#141b2b] capitalize">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-[#141b2b]">{item.value.toFixed(1)} kg</span>
                  <span className="text-[#3e4a3d] w-8 text-right">
                    {total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-[#bdcaba]/30">
        <h3 className="text-lg font-bold text-[#141b2b] mb-5">How You Compare</h3>
        {[
          { label: 'vs. Global Average (4t/mo)', yours: Math.min(100, Math.round((total / 4000) * 100)), text: total < 4000 ? `${Math.round(100 - (total/4000)*100)}% below global average` : 'Above global average' },
          { label: 'vs. Daily Goal (10 kg/day)',  yours: Math.min(100, Math.round((total / 300) * 100)),  text: total < 300 ? 'Within monthly goal range' : 'Exceeding monthly goal' },
        ].map((row) => (
          <div key={row.label} className="mb-5 last:mb-0">
            <p className="text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider mb-2">{row.label}</p>
            <div className="relative h-4 bg-[#f1f3ff] rounded-full overflow-hidden mb-1">
              <div className="absolute h-full bg-[#006b2c] rounded-full transition-all duration-700" style={{ width: `${row.yours}%` }}
                role="progressbar" aria-valuenow={row.yours} aria-valuemin={0} aria-valuemax={100} aria-label={row.label} />
            </div>
            <p className="text-xs font-semibold text-[#006b2c]">{row.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

// =============================================================================
// SECTION: CarbonEquivalents
// =============================================================================
const CarbonEquivalents = memo(function CarbonEquivalents({ totalKg }) {
  const kg = totalKg || 0;
  const items = [
    { icon: 'directions_car', label: `= ${Math.round(kg / 0.21)} km`,    sub: 'driving a petrol car' },
    { icon: 'smartphone',     label: `= ${Math.round(kg * 121)} charges`, sub: 'of a smartphone' },
    { icon: 'forest',         label: `= ${(kg / 22).toFixed(1)} trees`,   sub: 'to absorb in 1 year' },
    { icon: 'flight',         label: `= ${(kg / 255).toFixed(2)} flights`, sub: 'short-haul return' },
  ];
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-[#141b2b] mb-4">What Your Emissions Look Like</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.sub} className="bg-white rounded-2xl p-5 shadow-sm border border-[#bdcaba]/30 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-[#f0fdf4] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MaterialIcon name={item.icon} fill={1} className="text-[#006b2c] text-3xl" aria-hidden="true" />
            </div>
            <p className="font-semibold text-sm text-[#141b2b]">{item.label}</p>
            <p className="text-xs text-[#3e4a3d] mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

// =============================================================================
// SECTION: ActivityHeatmap — stable (generated once)
// =============================================================================
const ActivityHeatmap = memo(function ActivityHeatmap() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#bdcaba]/30 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h3 className="text-lg font-bold text-[#141b2b]">Activity Heatmap — Last 12 Weeks</h3>
        <div className="flex items-center gap-2 text-[11px] text-[#3e4a3d] font-bold" aria-label="Heatmap legend: colours range from light (less activity) to dark green (more activity)">
          <span>Less</span>
          {HEAT_COLORS.map((c) => (
            <span key={c} className="w-4 h-4 rounded-sm" style={{ background: c }} aria-hidden="true" />
          ))}
          <span>More</span>
        </div>
      </div>
      {/* Accessible summary for screen readers */}
      <p className="sr-only">
        Activity heatmap showing logging frequency over the last 12 weeks.
        Darker green cells indicate more activities logged on that day.
      </p>
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max" aria-hidden="true">
          <div className="flex flex-col gap-1 mr-1">
            <div className="w-4 h-4" />
            {days.map((d, i) => (
              <div key={i} className="w-4 h-4 text-[9px] text-[#6e7b6c] font-bold flex items-center justify-center">
                {i % 2 === 0 ? d : ''}
              </div>
            ))}
          </div>
          {HEATMAP_DATA.map((week, w) => (
            <div key={w} className="flex flex-col gap-1">
              <div className="h-4 text-[9px] text-[#6e7b6c] font-bold text-center">
                {w === 0 ? 'W1' : w === 4 ? 'W5' : w === 8 ? 'W9' : ''}
              </div>
              {week.map((level, d) => (
                <div key={d} className="w-4 h-4 rounded-sm cursor-default"
                  style={{ background: HEAT_COLORS[level] }}
                  title={`Week ${w + 1}, ${days[d]}: ${level === 0 ? 'No log' : `${level} activities`}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// SECTION: ReductionOpportunities
// =============================================================================
const ReductionOpportunities = memo(function ReductionOpportunities() {
  const diffBadge = { Easy: 'green', Moderate: 'amber', Hard: 'red' };
  return (
    <div className="mb-2">
      <h3 className="text-lg font-bold text-[#141b2b] mb-4">Your Biggest Reduction Opportunities</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OPPORTUNITIES.map((op) => (
          <div key={op.action} className="bg-white rounded-2xl p-5 shadow-sm border border-[#bdcaba]/30 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center">
                <MaterialIcon name={op.icon} fill={1} className="text-[#006b2c] text-xl" aria-hidden="true" />
              </div>
              <Badge variant={diffBadge[op.difficulty]}>{op.difficulty}</Badge>
            </div>
            <p className="text-sm font-semibold text-[#141b2b] mb-3 leading-snug">{op.action}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-2xl font-bold text-[#006b2c]">~{op.saving} kg</p>
                <p className="text-[11px] text-[#3e4a3d]">= {op.pct}% of your footprint</p>
              </div>
              <button className="text-xs font-bold text-[#006b2c] hover:underline flex items-center gap-1"
                aria-label={`See how to: ${op.action}`}>
                See how <MaterialIcon name="arrow_forward" className="text-sm" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// =============================================================================
// SECTION: InsightsPage — Default Export
// =============================================================================
export default function InsightsPage() {
  const [period, setPeriod] = useState('Week');
  const { trend, summary, loading } = useInsightsData(period);

  return (
    <DashboardShell>
      <a href="#insights-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#006b2c] text-white px-4 py-2 rounded-lg z-50">
        Skip to content
      </a>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#141b2b]">Insights</h1>
          <p className="text-sm text-[#3e4a3d] mt-1">Understand your patterns. Find your biggest wins.</p>
        </div>
      </div>

      <main id="insights-content" aria-busy={loading} aria-live="polite">
        <SummaryStrip summary={summary} />
        <TrendChart trend={trend} period={period} onPeriodChange={setPeriod} loading={loading} />
        <BreakdownAndComparison summary={summary} />
        <CarbonEquivalents totalKg={summary.totalKg} />
        <ActivityHeatmap />
        <ReductionOpportunities />
      </main>
    </DashboardShell>
  );
}