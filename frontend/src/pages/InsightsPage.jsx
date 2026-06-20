// =============================================================================
// SECTION: InsightsPage
// Data analytics page. Loads real trend + summary from the API and composes
// the section components defined in components/insights/.
// =============================================================================

import { useState, useEffect } from 'react';
import DashboardShell from '../components/layout/DashboardShell';
import { activitiesAPI } from '../services/api';
import {
  SummaryStrip,
  TrendChart,
  BreakdownAndComparison,
  CarbonEquivalents,
  ActivityHeatmap,
  ReductionOpportunities,
} from '../components/insights/InsightsSections';

// =============================================================================
// useInsightsData — loads real trend + summary; aborts stale requests.
// =============================================================================
function useInsightsData(period) {
  const [trend,   setTrend]   = useState([]);
  const [summary, setSummary] = useState({ totalKg: 0, categories: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const periodMap = { Week: 'week', Month: 'month', Year: 'year' };
    let cancelled = false;
    setLoading(true);

    const days   = period === 'Week' ? 7 : period === 'Month' ? 30 : 365;
    const apiPer = periodMap[period] || 'week';

    Promise.all([
      activitiesAPI.trend(days),
      activitiesAPI.summary(apiPer),
    ]).then(([trendRes, summaryRes]) => {
      if (cancelled) return;
      if (!trendRes.error)   setTrend(trendRes.data?.trend   || []);
      if (!summaryRes.error) setSummary(summaryRes.data || { totalKg: 0, categories: [] });
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [period]);

  return { trend, summary, loading };
}

// =============================================================================
// InsightsPage — Default Export
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
