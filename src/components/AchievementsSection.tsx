import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Award, ShieldAlert, Trophy, Star, BookOpen, Heart, Flame, Calendar, Sparkles } from 'lucide-react';

interface AchievementsSectionProps {
  member: UserProfile;
}

interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  xpRequired: number;
}

export function AchievementsSection({ member }: AchievementsSectionProps) {
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Define Gamified Badges
  const BADGES: BadgeItem[] = [
    {
      id: 'faithful_reporter',
      title: 'Faithful Reporter (Mtoa Taarifa Mwaminifu)',
      description: 'Mwanachama anayeripoti kila juma bila kukosa.',
      icon: <Award className="w-6 h-6" />,
      color: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      xpRequired: 50
    },
    {
      id: 'bible_reader',
      title: 'Bible Reader (Msomaji wa Biblia)',
      description: 'Umesoma Biblia kwa mpango thabiti kila juma.',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
      xpRequired: 100
    },
    {
      id: 'community_servant',
      title: 'Community Servant (Mtumishi wa Jamii)',
      description: 'Umeonesha upendo kwa kusaidia watu na kugawa nguo mtaani.',
      icon: <Heart className="w-6 h-6" />,
      color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      xpRequired: 150
    },
    {
      id: 'prayer_warrior',
      title: 'Prayer Warrior (Shujaa wa Maombi)',
      description: 'Kushiriki kikamilifu katika idara za maombi na kesha la asubuhi.',
      icon: <Flame className="w-6 h-6" />,
      color: 'bg-red-500/15 text-red-500 border-red-500/30',
      xpRequired: 200
    },
    {
      id: 'attendance_champion',
      title: 'Attendance Champion (Bingwa wa Mahudhurio)',
      description: 'Umehudhuria Shule ya Sabato sabato zote za mwezi.',
      icon: <Trophy className="w-6 h-6" />,
      color: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30',
      xpRequired: 250
    },
    {
      id: 'evangelism_champion',
      title: 'Evangelism Champion (Bingwa wa Injili)',
      description: 'Umeshiriki mahubiri na kuongoa roho moja au zaidi kwa Yesu.',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
      xpRequired: 300
    },
    {
      id: 'birthday_star',
      title: 'Birthday Star (Nyota wa Siku ya Kuzaliwa)',
      description: 'Mshiriki wa Shule ya Sabato anayesherehekea siku yake ya kuzaliwa mwezi huu.',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-pink-500/15 text-pink-500 border-pink-500/30',
      xpRequired: 10
    }
  ];

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('xp', 'desc'),
          limit(10)
        );
        const snap = await getDocs(q);
        const list: UserProfile[] = [];
        snap.forEach((doc) => {
          list.push(doc.data() as UserProfile);
        });
        setLeaderboard(list);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [member.xp]);

  // Level progression
  const currentLevelXp = member.xp || 0;
  const levelNum = member.level || 1;
  const xpBaseForCurrentLevel = (levelNum - 1) * 100;
  const xpTargetForNextLevel = levelNum * 100;
  const progressInLevel = currentLevelXp - xpBaseForCurrentLevel;
  const progressPercent = Math.min(100, Math.max(0, (progressInLevel / 100) * 100));

  return (
    <div id="achievements-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-left">
      
      {/* Level and XP progress card */}
      <div className="lg:col-span-2 space-y-6">
        <div id="xp-progress-card" className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest">Kiwango Chako (Level)</span>
              <h2 className="text-3xl font-black text-white flex items-center gap-2">
                Ngazi ya {levelNum}
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-zinc-400">Jumla ya Alama (XP)</span>
              <h3 className="text-xl font-black text-zinc-100">{currentLevelXp} <span className="text-xs text-zinc-500">XP</span></h3>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>{xpBaseForCurrentLevel} XP</span>
              <span className="text-zinc-200">{progressInLevel} / 100 XP kuelekea Ngazi {levelNum + 1}</span>
              <span>{xpTargetForNextLevel} XP</span>
            </div>
            
            <div className="w-full bg-zinc-850 h-3 rounded-full overflow-hidden p-0.5 border border-zinc-805">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Badges system */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Nishani za Ushindi na Utambuzi (Recognition Badges)
          </h3>
          <p className="text-xs text-zinc-400">Shule ya Sabato inasherehekea juhudi zako. Nishani hufunguka kiotomatiki kulingana na alama (XP) zako za utendaji.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BADGES.map((badge) => {
              const isUnlocked = currentLevelXp >= badge.xpRequired;
              return (
                <div
                  id={`badge-card-${badge.id}`}
                  key={badge.id}
                  className={`p-4 rounded-xl border flex gap-3.5 items-start transition ${
                    isUnlocked
                      ? `${badge.color} scale-[1.01] shadow`
                      : 'bg-zinc-900/40 border-zinc-900 text-zinc-500 opacity-60'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border ${isUnlocked ? 'bg-zinc-900' : 'bg-transparent border-zinc-800'}`}>
                    {badge.icon}
                  </div>
                  <div className="text-left space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-100">{badge.title}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                        isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {isUnlocked ? 'Wazi' : `${badge.xpRequired} XP`}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leaderboard panel */}
      <div id="leaderboard-card" className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
          <Trophy className="w-5 h-5 text-amber-500" />
          <div className="text-left">
            <h3 className="text-sm font-bold text-white">Ubao wa Ushindi (Leaderboard)</h3>
            <p className="text-[10px] text-zinc-400">Wana-darasa wenye bidii ya kazi na kujifunza</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-550 text-xs">Inapakia washindi...</div>
        ) : leaderboard.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">Hakuna washiriki wengi kwa sasa bado.</div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((user, idx) => {
              const isCurrentUser = user.uid === member.uid;
              return (
                <div
                  id={`leaderboard-item-${idx}`}
                  key={user.uid}
                  className={`p-3 rounded-xl flex items-center justify-between border transition ${
                    isCurrentUser 
                      ? 'bg-amber-500/10 border-amber-550' 
                      : 'bg-zinc-900/60 border-zinc-950 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center ${
                      idx === 0 
                        ? 'bg-amber-500 text-zinc-950' 
                        : idx === 1 
                        ? 'bg-zinc-300 text-zinc-900' 
                        : idx === 2 
                        ? 'bg-amber-700 text-white' 
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className="text-left flex flex-col">
                      <span className="text-xs font-bold text-zinc-100 flex items-center gap-1">
                        {user.fullName}
                        {isCurrentUser && <span className="text-[9px] bg-amber-500/20 text-amber-550 px-1 py-0.2 rounded font-medium">Wewe</span>}
                      </span>
                      <span className="text-[9px] text-zinc-400">{user.className || 'Darasa la Sabato'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-zinc-200">{user.xp || 0} <span className="text-[9px] text-zinc-500">XP</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
