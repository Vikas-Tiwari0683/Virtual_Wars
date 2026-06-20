// =============================================================================
// SECTION: CommunityPage — fully connected to backend
// Challenges load from challengesAPI.list(), Join calls challengesAPI.join(),
// Leaderboard loads from challengesAPI.leaderboard(id).
// =============================================================================

import { useState, useEffect } from 'react';
import DashboardShell    from '../components/layout/DashboardShell';
import MaterialIcon      from '../components/atoms/MaterialIcon';
import Badge             from '../components/atoms/Badge';
import { challengesAPI } from '../services/api';

// =============================================================================
// SECTION: Static display config (visual styling only — not data)
// =============================================================================
const CARD_GRADIENTS = [
  'from-[#006b2c] to-[#2e6a41]',
  'from-[#f97316] to-[#ea580c]',
  'from-[#0891b2] to-[#0e7490]',
  'from-[#9333ea] to-[#7e22ce]',
  'from-[#d97706] to-[#b45309]',
];

const CARD_EMOJIS = ['🌍', '🥗', '🚲', '⚡', '♻️'];

const AVATAR_COLORS = ['#006b2c','#2e6a41','#0891b2','#9333ea','#f97316','#dc2626','#d97706','#14b8a6'];
const avatarColor = (s) => AVATAR_COLORS[(s || '?').charCodeAt(0) % AVATAR_COLORS.length];

// =============================================================================
// SECTION: UserChallengeHero — shows first joined challenge
// =============================================================================
function UserChallengeHero({ challenges }) {
  const joined = challenges.find((c) => c.joined);
  if (!joined) return null;

  const daysLeft = Math.max(0, Math.ceil(
    (new Date(joined.end_date) - new Date()) / (1000 * 60 * 60 * 24)
  ));

  return (
    <div className="bg-gradient-to-r from-[#006b2c] to-[#00873a] rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl" aria-hidden="true">🏆</span>
            <p className="text-sm font-bold opacity-80 uppercase tracking-widest">{joined.title}</p>
          </div>
          <h2 className="text-3xl font-bold mb-1">You're participating!</h2>
          <p className="text-white/90 text-sm">{joined.participant_count || 0} participants · {daysLeft} days left</p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
          <p className="text-[11px] font-bold uppercase opacity-60">Your Score</p>
          <p className="font-mono text-4xl font-bold">
            {parseFloat(joined.my_score_kg || 0).toFixed(1)}{' '}
            <span className="text-lg font-normal opacity-70">kg saved</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SECTION: ChallengeCard — Join button wired to real API
// =============================================================================
function ChallengeCard({ challenge, idx, onJoined }) {
  const [joining, setJoining] = useState(false);
  const [error,   setError]   = useState('');

  const daysLeft = Math.max(0, Math.ceil(
    (new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24)
  ));

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    const { error: err } = await challengesAPI.join(challenge.id);
    setJoining(false);
    if (err) { setError(err); return; }
    onJoined(challenge.id);
  };

  return (
    <div className={`bg-gradient-to-br ${CARD_GRADIENTS[idx % CARD_GRADIENTS.length]} text-white rounded-2xl p-6 shadow-lg relative overflow-hidden`}>
      <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 select-none">{CARD_EMOJIS[idx % CARD_EMOJIS.length]}</div>
      {challenge.joined && (
        <Badge variant="green" className="!bg-white/20 !text-white mb-3 text-[10px]">
          <MaterialIcon name="check" className="text-xs" /> Joined ✓
        </Badge>
      )}
      <h3 className="text-lg font-bold mb-2">{challenge.title}</h3>
      <p className="text-sm text-white/90 mb-4 leading-snug">{challenge.description}</p>
      <div className="flex items-center gap-4 text-[11px] font-bold mb-4 opacity-90 flex-wrap">
        <span><span aria-hidden="true">👥</span> {(challenge.participant_count || 0).toLocaleString()}</span>
        <span><span aria-hidden="true">⏱</span> {daysLeft}d left</span>
        {challenge.avg_score_kg && <span><span aria-hidden="true">🌱</span> Avg {parseFloat(challenge.avg_score_kg).toFixed(1)} kg</span>}
      </div>
      {error && <p className="text-xs text-[#ffdad6] mb-2">{error}</p>}
      {!challenge.joined && (
        <button onClick={handleJoin} disabled={joining}
          className="w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
          {joining ? 'Joining…' : 'Join Challenge →'}
        </button>
      )}
    </div>
  );
}

// =============================================================================
// SECTION: Leaderboard — real data from challengesAPI.leaderboard()
// =============================================================================
function Leaderboard({ challenges }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank,      setMyRank]      = useState(null);
  const [loading,     setLoading]     = useState(false);

  // Pick first available challenge to show leaderboard for
  const targetId = challenges[0]?.id;

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    challengesAPI.leaderboard(targetId).then(({ data }) => {
      if (data) {
        setLeaderboard(data.leaderboard || []);
        setMyRank(data.myRank);
      }
      setLoading(false);
    });
  }, [targetId]);  // ← stable primitive ID, not object reference

  // Podium only renders with a full top-3; otherwise show everyone in the list
  const hasPodium = leaderboard.length >= 3;
  const podium    = hasPodium ? leaderboard.slice(0, 3) : [];
  const rest      = hasPodium ? leaderboard.slice(3) : leaderboard;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#bdcaba]/30 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-[#141b2b]">Leaderboard</h3>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-10 bg-[#f1f3ff] rounded-xl" />)}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-8">
          <MaterialIcon name="leaderboard" className="text-[#bdcaba] text-4xl block mx-auto mb-2" />
          <p className="text-sm text-[#3e4a3d]">No participants yet. Be the first to join!</p>
        </div>
      ) : (
        <>
          {/* Podium — top 3 */}
          {hasPodium && (
            <div className="flex items-end justify-center gap-4 mb-6">
              {[podium[1], podium[0], podium[2]].map((entry, i) => {
                const heights = ['h-16', 'h-24', 'h-12'];
                const medals  = ['🥈', '🥇', '🥉'];
                const bgCols  = ['bg-[#dce2f7]', 'bg-[#fef3c7]', 'bg-[#ffdcc3]'];
                const sizes   = ['w-12 h-12', 'w-14 h-14', 'w-12 h-12'];
                return (
                  <div key={entry.user_id} className="flex flex-col items-center">
                    <div className={`${sizes[i]} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md mb-2`}
                      style={{ background: avatarColor(entry.first_name) }}>
                      {entry.first_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className={`${bgCols[i]} rounded-t-xl w-16 ${heights[i]} flex flex-col items-center justify-center`}>
                      <span className="text-xl" aria-hidden="true">{medals[i]}</span>
                      <p className="text-[10px] font-bold text-[#141b2b]">{parseFloat(entry.score_kg).toFixed(0)}</p>
                    </div>
                    <p className="text-[11px] font-semibold text-[#3e4a3d] mt-1 max-w-[64px] text-center leading-tight">{entry.first_name}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest */}
          <div className="space-y-1">
            {rest.map((entry) => (
              <div key={entry.user_id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f9f9ff] transition-colors">
                <span className="w-6 text-center font-mono text-sm font-bold text-[#3e4a3d]">#{entry.rank}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: avatarColor(entry.first_name) }}>
                  {entry.first_name?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="flex-1 text-sm font-semibold text-[#141b2b]">{entry.first_name}</span>
                <span className="font-mono text-sm font-bold text-[#141b2b]">{parseFloat(entry.score_kg).toFixed(1)} kg</span>
              </div>
            ))}
          </div>

          {myRank && (
            <div className="mt-3 p-3 bg-[#f0fdf4] rounded-xl border border-[#b1f2be] text-center">
              <p className="text-sm font-bold text-[#006b2c]">Your rank: #{myRank}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// SECTION: CommunityPage — Default Export
// =============================================================================
export default function CommunityPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => {
    challengesAPI.list().then(({ data, error: err }) => {
      if (err) setError(err);
      else setChallenges(data || []);
      setLoading(false);
    });
  }, []);

  const handleJoined = (id) => {
    setChallenges((prev) => prev.map((c) => c.id === id ? { ...c, joined: true } : c));
  };

  return (
    <DashboardShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#141b2b]">Community</h1>
          <p className="text-sm text-[#3e4a3d] mt-1">Climate action is better together.</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-[#ffdad6] text-[#93000a] rounded-xl text-sm font-medium flex items-center gap-2" role="alert">
          <MaterialIcon name="error" fill={1} className="text-base" />{error} — check the backend is running.
        </div>
      )}

      {/* Hero */}
      <UserChallengeHero challenges={challenges} />

      {/* Challenges grid */}
      <h2 className="text-lg font-bold text-[#141b2b] mb-4">Active Challenges</h2>
      {loading ? (
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8"
          role="status"
          aria-busy="true"
          aria-label="Loading challenges"
        >
          {[1,2,3].map((i) => <div key={i} className="h-48 bg-[#f1f3ff] rounded-2xl animate-pulse" />)}
          <span className="sr-only">Loading community challenges, please wait…</span>
        </div>
      ) : challenges.length === 0 ? (
        <div className="bg-[#f1f3ff] rounded-2xl p-10 text-center border-2 border-dashed border-[#bdcaba] mb-8">
          <MaterialIcon name="group" className="text-[#bdcaba] text-5xl block mx-auto mb-2" />
          <p className="text-sm text-[#3e4a3d]">No active challenges right now. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {challenges.map((c, i) => (
            <ChallengeCard key={c.id} challenge={c} idx={i} onJoined={handleJoined} />
          ))}
        </div>
      )}

      {/* Leaderboard */}
      <Leaderboard challenges={challenges} />
    </DashboardShell>
  );
}
