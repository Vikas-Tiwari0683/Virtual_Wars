// =============================================================================
// SECTION: Learn page tab panels
// ArticlesTab, VideosTab, GlossaryTab, MythVsFactTab.
// Extracted from LearnPage.jsx.
// =============================================================================

import { useState } from 'react';
import MaterialIcon from '../atoms/MaterialIcon';
import Badge from '../atoms/Badge';
import { ARTICLES, VIDEOS, GLOSSARY_TERMS, MYTHS, CAT_COLORS } from './learnData';

// =============================================================================
// ArticlesTab — searchable, filterable card grid with a featured hero.
// =============================================================================
export function ArticlesTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const categories = ['All', 'Energy', 'Diet', 'Transport', 'Shopping', 'Science', 'Policy'];
  const [featured, ...rest] = ARTICLES;

  const filtered = (filter === 'All' ? rest : rest.filter((a) => a.cat === filter))
    .filter((a) => !search || a.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="relative mb-5">
        <MaterialIcon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bdcaba] text-xl" aria-hidden="true" />
        <input
          id="articles-search" type="search" placeholder="Search articles..."
          aria-label="Search articles" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-[#bdcaba] focus:ring-2 focus:ring-[#006b2c] outline-none text-[#141b2b] placeholder:text-[#bdcaba]"
        />
      </div>

      {!search && filter === 'All' && (
        <div className="bg-gradient-to-r from-[#006b2c] to-[#2e6a41] text-white rounded-2xl p-8 mb-6 flex flex-col md:flex-row items-center gap-6 cursor-pointer hover:opacity-95 transition-opacity">
          <div className="text-8xl flex-shrink-0" aria-hidden="true">{featured.emoji}</div>
          <div>
            <Badge variant="green" className="!bg-white/20 !text-white mb-2">{featured.cat}</Badge>
            <h3 className="text-2xl font-bold mb-2 leading-snug">{featured.title}</h3>
            <p className="text-white/70 text-sm">CarbonTrace Science Team · {featured.date} · {featured.read} read</p>
            <button className="mt-4 flex items-center gap-1 text-sm font-bold hover:gap-2 transition-all">
              Read Article <MaterialIcon name="arrow_forward" className="text-sm" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-5">
        {categories.map((c) => (
          <button
            key={c} onClick={() => setFilter(c)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all ${
              filter === c ? 'bg-[#006b2c] text-white' : 'bg-white border border-[#bdcaba] text-[#3e4a3d] hover:border-[#006b2c]'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <MaterialIcon name="search_off" className="text-[#bdcaba] text-5xl block mx-auto mb-2" />
          <p className="text-[#3e4a3d] font-semibold">No results for &ldquo;{search}&rdquo;</p>
          <button onClick={() => setSearch('')} className="text-[#006b2c] text-sm font-bold mt-2 hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <article key={a.id}
              className="bg-white rounded-2xl p-5 border border-[#bdcaba]/30 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
              <div className="w-12 h-12 bg-[#f1f3ff] rounded-xl flex items-center justify-center text-2xl mb-4" aria-hidden="true">
                {a.emoji}
              </div>
              <Badge variant={CAT_COLORS[a.cat] || 'default'} className="mb-3">{a.cat}</Badge>
              <h3 className="text-sm font-bold text-[#141b2b] mb-3 leading-snug line-clamp-2">{a.title}</h3>
              <p className="text-[11px] text-[#6e7b6c]">{a.date} · {a.read} read</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// VideosTab — thumbnail cards.
// =============================================================================
export function VideosTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {VIDEOS.map((v) => (
        <div key={v.id}
          className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#bdcaba]/30 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="bg-gradient-to-br from-[#f1f3ff] to-[#dce2f7] h-40 flex items-center justify-center relative">
            <span className="text-6xl" aria-hidden="true">{v.emoji}</span>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                <MaterialIcon name="play_arrow" fill={1} className="text-[#006b2c] text-3xl" />
              </div>
            </div>
            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] font-bold px-2 py-0.5 rounded">
              {v.duration}
            </span>
          </div>
          <div className="p-4">
            <p className="text-sm font-bold text-[#141b2b] line-clamp-2 mb-1">{v.title}</p>
            <p className="text-[11px] text-[#6e7b6c] font-semibold">{v.channel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// GlossaryTab — alphabetical, searchable terms.
// =============================================================================
export function GlossaryTab() {
  const [search, setSearch] = useState('');
  const filtered = GLOSSARY_TERMS.filter(
    (t) => !search || t.term.toLowerCase().includes(search.toLowerCase()) || t.def.toLowerCase().includes(search.toLowerCase())
  );
  const letters = [...new Set(filtered.map((t) => t.term[0]))].sort();

  return (
    <div>
      <div className="relative mb-5">
        <MaterialIcon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bdcaba] text-xl" aria-hidden="true" />
        <input
          id="glossary-search" type="search" placeholder="Search glossary..."
          aria-label="Search glossary terms" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-[#bdcaba] focus:ring-2 focus:ring-[#006b2c] outline-none text-[#141b2b] placeholder:text-[#bdcaba]"
        />
      </div>

      {!search && (
        <div className="flex flex-wrap gap-1 mb-6">
          {letters.map((l) => (
            <a key={l} href={`#gls-${l}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#f1f3ff] text-[#006b2c] font-bold text-sm hover:bg-[#b1f2be] transition-colors">
              {l}
            </a>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {letters.map((l) => (
          <div key={l} id={`gls-${l}`}>
            {!search && (
              <p className="text-[11px] font-bold text-[#006b2c] uppercase tracking-widest mb-2 sticky top-0 bg-[#f9f9ff] py-1">
                {l}
              </p>
            )}
            {filtered.filter((t) => t.term[0] === l).map((t) => (
              <div key={t.term} className="bg-white rounded-xl p-5 border-l-4 border-[#006b2c] shadow-sm mb-3">
                <p className="font-bold text-[#141b2b] mb-1">{t.term}</p>
                <p className="text-sm text-[#3e4a3d] leading-relaxed mb-2">{t.def}</p>
                <div className="flex flex-wrap gap-2">
                  {t.related.map((r) => (
                    <span key={r}
                      className="text-[10px] font-bold bg-[#f1f3ff] text-[#006b2c] px-2 py-0.5 rounded-full cursor-pointer hover:bg-[#b1f2be] transition-colors">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MythVsFactTab — click-to-flip cards.
// =============================================================================
export function MythVsFactTab() {
  const [flipped, setFlipped] = useState([]);
  const toggle = (i) => setFlipped((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  return (
    <div>
      <p className="text-sm text-[#3e4a3d] mb-6">
        Click any card to reveal the fact. These cover the most common climate misconceptions.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {MYTHS.map((m, i) => {
          const isFlipped = flipped.includes(i);
          return (
            <button key={i} onClick={() => toggle(i)} aria-expanded={isFlipped}
              aria-label={isFlipped ? 'Show myth' : 'Reveal fact'}
              className={`text-left rounded-2xl p-6 shadow-sm border transition-all duration-300 min-h-[180px] flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md ${
                isFlipped ? 'bg-[#f0fdf4] border-[#b1f2be]' : 'bg-white border-[#ffdad6]'
              }`}>
              {!isFlipped ? (
                <>
                  <div>
                    <Badge variant="red" className="mb-3">MYTH</Badge>
                    <p className="text-sm font-semibold text-[#141b2b] italic leading-snug">
                      &ldquo;{m.myth}&rdquo;
                    </p>
                  </div>
                  <p className="text-[11px] text-[#bdcaba] mt-3 font-bold">Click to reveal the fact &rarr;</p>
                </>
              ) : (
                <>
                  <div>
                    <Badge variant="green" className="mb-3">FACT</Badge>
                    <p className="text-sm text-[#141b2b] leading-relaxed">{m.fact}</p>
                  </div>
                  <p className="text-[10px] text-[#6e7b6c] mt-3 font-semibold">Source: {m.source}</p>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
