import React from 'react';
import { THEMES } from '../themes';
import { UserPreferences } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Palette, Type, Leaf, SunMoon, Eye } from 'lucide-react';

interface ThemeSelectorProps {
  preferences: UserPreferences;
  onChange: (prefs: Partial<UserPreferences>) => void;
  userId?: string;
}

export function ThemeSelector({ preferences, onChange, userId }: ThemeSelectorProps) {
  const handleThemeChange = async (themeName: UserPreferences['theme']) => {
    onChange({ theme: themeName });
    if (userId) {
      await setDoc(doc(db, 'user_preferences', userId), { theme: themeName }, { merge: true });
    }
  };

  const handleFontSizeChange = async (size: UserPreferences['fontSize']) => {
    onChange({ fontSize: size });
    if (userId) {
      await setDoc(doc(db, 'user_preferences', userId), { fontSize: size }, { merge: true });
    }
  };

  const handleMotionChange = async (reduce: boolean) => {
    onChange({ motionReduction: reduce });
    if (userId) {
      await setDoc(doc(db, 'user_preferences', userId), { motionReduction: reduce }, { merge: true });
    }
  };

  const handleBirthdayHideChange = async (hide: boolean) => {
    onChange({ hideBirthdayPublicly: hide });
    if (userId) {
      await setDoc(doc(db, 'user_preferences', userId), { hideBirthdayPublicly: hide }, { merge: true });
    }
  };

  return (
    <div id="theme-selector-card" className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl space-y-6">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Palette className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-white">Marekebisho ya Mwonekano (Maudhui)</h3>
      </div>

      {/* Grid of Themes */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <SunMoon className="w-4 h-4 text-zinc-400" />
          Chagua Mandhari (Theme):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Object.entries(THEMES).map(([key, theme]) => {
            const isSelected = preferences.theme === key;
            return (
              <button
                id={`theme-btn-${key}`}
                key={key}
                onClick={() => handleThemeChange(key as UserPreferences['theme'])}
                className={`py-3 px-4 rounded-xl text-xs font-medium transition-all flex flex-col items-center justify-center gap-1.5 border ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/15 text-amber-400 scale-[1.02] shadow'
                    : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${theme.primary.split(' ')[0]}`} />
                <span>{theme.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Size Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Type className="w-4 h-4 text-zinc-400" />
          Ukubwa wa Maandishi (Font Size):
        </label>
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 max-w-sm">
          {([
            { key: 'sm', label: 'Ndogo' },
            { key: 'base', label: 'Kawaida' },
            { key: 'lg', label: 'Kubwa' },
            { key: 'xl', label: 'Kubwa Sana' }
          ] as const).map(({ key, label }) => (
            <button
              id={`font-btn-${key}`}
              key={key}
              onClick={() => handleFontSizeChange(key)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                preferences.fontSize === key
                  ? 'bg-amber-550 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* More Preferences Switches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-white flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-zinc-400" /> Punguza Uhuishaji
            </span>
            <span className="text-[10px] text-zinc-400">Punguza madoido yanayosonga</span>
          </div>
          <input
            id="motion-reduction-checkbox"
            type="checkbox"
            checked={preferences.motionReduction}
            onChange={(e) => handleMotionChange(e.target.checked)}
            className="rounded text-amber-500 border-zinc-700 focus:ring-amber-500 bg-zinc-800 h-4 w-4"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-white flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-zinc-400" /> Ficha Siku ya Kuzaliwa
            </span>
            <span className="text-[10px] text-zinc-400">Usionyeshe kwa wengine hadharani</span>
          </div>
          <input
            id="hide-birthday-checkbox"
            type="checkbox"
            checked={preferences.hideBirthdayPublicly}
            onChange={(e) => handleBirthdayHideChange(e.target.checked)}
            className="rounded text-amber-500 border-zinc-700 focus:ring-amber-500 bg-zinc-800 h-4 w-4"
          />
        </label>
      </div>
    </div>
  );
}
