// =============================================================================
// SECTION: LearnPage
// Education hub with 4 tabs (Articles, Videos, Glossary, Myth vs Fact).
// Tab panels live in components/learn/LearnTabs.jsx; data in learnData.js.
// =============================================================================

import { useState } from 'react';
import DashboardShell from '../components/layout/DashboardShell';
import MaterialIcon from '../components/atoms/MaterialIcon';
import { LEARN_TABS } from '../components/learn/learnData';
import { ArticlesTab, VideosTab, GlossaryTab, MythVsFactTab } from '../components/learn/LearnTabs';

export default function LearnPage() {
  const [tab, setTab] = useState('articles');

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#141b2b]">Learn</h1>
        <p className="text-sm text-[#3e4a3d] mt-1">
          Understand the science behind your score. Knowledge drives better choices.
        </p>
      </div>

      <div
        className="flex flex-wrap gap-1 bg-[#f1f3ff] p-1 rounded-2xl mb-6 w-full sm:w-fit"
        role="tablist"
        aria-label="Learn sections"
      >
        {LEARN_TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls="learn-tabpanel"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all ${
              tab === t.id ? 'bg-white text-[#006b2c] shadow-sm' : 'text-[#3e4a3d] hover:bg-[#e1e8fd]'
            }`}
          >
            <MaterialIcon name={t.icon} fill={tab === t.id ? 1 : 0} className="text-lg" aria-hidden="true" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div id="learn-tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'articles' && <ArticlesTab />}
        {tab === 'videos'   && <VideosTab />}
        {tab === 'glossary' && <GlossaryTab />}
        {tab === 'myths'    && <MythVsFactTab />}
      </div>
    </DashboardShell>
  );
}
