// =============================================================================
// SECTION: DashboardPage
// Loads all dashboard data on mount and composes the widgets defined in
// components/dashboard/DashboardWidgets.jsx.
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar          from '../components/layout/Sidebar';
import MobileBottomNav  from '../components/layout/MobileBottomNav';
import MaterialIcon     from '../components/atoms/MaterialIcon';
import { useAuth }      from '../context/AuthContext';
import { usersAPI, recommendationsAPI, activitiesAPI } from '../services/api';
import { ROUTES }       from '../utils/constants';
import {
  DashboardHeader,
  HeroScoreWidget,
  StatCards,
  WeeklyChart,
  RecommendationCards,
  GoalsProgress,
  CommunityChallengeBanner,
  RecentActivity,
  LoadingSkeleton,
} from '../components/dashboard/DashboardWidgets';

// =============================================================================
// useDashboard — loads dashboard, recommendations, and 7-day trend in one shot.
// =============================================================================
function useDashboard() {
  const [data,    setData]    = useState(null);
  const [trend,   setTrend]   = useState([]);
  const [tips,    setTips]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setLoading(true);
    setError(null);
    Promise.all([
      usersAPI.dashboard(),
      recommendationsAPI.list(),
      activitiesAPI.trend(7, signal),
    ]).then(([dashRes, tipsRes, trendRes]) => {
      if (signal.aborted) return;
      if (dashRes.error) setError(dashRes.error);
      else setData(dashRes.data);
      if (!tipsRes.error)  setTips(tipsRes.data || []);
      if (!trendRes.error) setTrend(trendRes.data?.trend || []);
      setLoading(false);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => load(), [load]);
  return { data, trend, tips, setTips, loading, error, reload: load };
}

// =============================================================================
// DashboardPage — Default Export
// =============================================================================
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, trend, tips, setTips, loading, error } = useDashboard();

  return (
    <div className="bg-[#f9f9ff] min-h-screen">
      <Sidebar />
      <MobileBottomNav />
      <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8 min-h-screen" id="main-content"
        tabIndex={-1} aria-label="Dashboard main content">
        <DashboardHeader name={user?.name || 'there'} />

        {error && (
          <div className="mb-5 p-4 bg-[#ffdad6] text-[#93000a] rounded-xl text-sm font-medium flex items-center gap-2" role="alert">
            <MaterialIcon name="error" fill={1} className="text-base flex-shrink-0" />
            {error} — make sure the backend is running.
          </div>
        )}

        {loading ? <LoadingSkeleton /> : (
          <div className="flex flex-col gap-5">
            <HeroScoreWidget todayKg={data?.todayKg ?? 0} streak={data?.streak ?? 0} />
            <StatCards weekCategories={data?.weekCategories ?? []} streak={data?.streak ?? 0} />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-8">
                <WeeklyChart trend={trend} />
              </div>
              <div className="md:col-span-4">
                <RecommendationCards tips={tips} setTips={setTips} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-8">
                <RecentActivity activities={data?.recentActivities ?? []} />
              </div>
              <div className="md:col-span-4">
                <GoalsProgress activeGoals={data?.activeGoals ?? 0} />
              </div>
            </div>

            <CommunityChallengeBanner />
          </div>
        )}
      </main>

      <button
        onClick={() => navigate(ROUTES.LOG)}
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 bg-[#006b2c] text-white rounded-full shadow-xl flex items-center justify-center z-50 hover:bg-[#00873a] transition-colors"
        aria-label="Log a new activity">
        <MaterialIcon name="add" className="text-3xl" />
      </button>
    </div>
  );
}
