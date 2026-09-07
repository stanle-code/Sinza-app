export interface ThemeConfig {
  name: string;
  label: string;
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  secondary: string;
  input: string;
  header: string;
}

export const THEMES: Record<string, ThemeConfig> = {
  light: {
    name: 'light',
    label: 'Mwanga (Klasiki)',
    background: 'bg-zinc-50 text-zinc-900',
    card: 'bg-white border border-zinc-100 shadow-sm',
    text: 'text-zinc-900',
    textMuted: 'text-zinc-500',
    border: 'border-zinc-200/80',
    primary: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
    secondary: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800',
    input: 'bg-white border-zinc-300 focus:border-amber-500 focus:ring-amber-500 text-zinc-900',
    header: 'bg-white/80 backdrop-blur-md border-b border-zinc-100'
  },
  dark: {
    name: 'dark',
    label: 'Giza (Nezige)',
    background: 'bg-zinc-950 text-zinc-50',
    card: 'bg-zinc-900 border border-zinc-800/80 shadow-md',
    text: 'text-zinc-100',
    textMuted: 'text-zinc-400',
    border: 'border-zinc-800',
    primary: 'bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold focus:ring-amber-400',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100',
    input: 'bg-zinc-850 border-zinc-700 focus:border-amber-500 focus:ring-amber-500 text-zinc-100',
    header: 'bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800'
  },
  midnight: {
    name: 'midnight',
    label: 'Usiku wa Manane',
    background: 'bg-slate-950 text-slate-100',
    card: 'bg-slate-900 border border-slate-800 shadow-md',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    border: 'border-slate-800',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100',
    input: 'bg-slate-850 border-slate-700 focus:border-blue-500 focus:ring-blue-500 text-slate-100',
    header: 'bg-slate-900/80 backdrop-blur-md border-b border-slate-800'
  },
  ocean: {
    name: 'ocean',
    label: 'Bahari',
    background: 'bg-cyan-950 text-cyan-50',
    card: 'bg-cyan-900/60 border border-cyan-800 shadow-md',
    text: 'text-cyan-50',
    textMuted: 'text-cyan-300',
    border: 'border-cyan-800/80',
    primary: 'bg-sky-500 hover:bg-sky-600 text-cyan-950 font-bold focus:ring-sky-400',
    secondary: 'bg-cyan-800/80 hover:bg-cyan-700 text-cyan-100',
    input: 'bg-cyan-900 border-cyan-700 focus:border-sky-400 focus:ring-sky-400 text-cyan-50',
    header: 'bg-cyan-950/80 backdrop-blur-md border-b border-cyan-800'
  },
  forest: {
    name: 'forest',
    label: 'Msitu Uhifadhi',
    background: 'bg-stone-950 text-stone-100',
    card: 'bg-emerald-950/30 border border-emerald-800/40 shadow-sm',
    text: 'text-stone-100',
    textMuted: 'text-emerald-300',
    border: 'border-emerald-900/50',
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-stone-50 focus:ring-emerald-500',
    secondary: 'bg-stone-900 hover:bg-stone-850 text-stone-300',
    input: 'bg-stone-900 border-stone-850 focus:border-emerald-500 focus:ring-emerald-500 text-stone-100',
    header: 'bg-stone-950/80 backdrop-blur-md border-b border-emerald-950/40'
  },
  emerald: {
    name: 'emerald',
    label: 'Zumaridi (Emerald)',
    background: 'bg-zinc-950 text-zinc-50',
    card: 'bg-zinc-900 border border-emerald-950 shadow-md',
    text: 'text-zinc-50',
    textMuted: 'text-emerald-400/80',
    border: 'border-emerald-900/30',
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold focus:ring-emerald-500',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200',
    input: 'bg-zinc-850 border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500 text-zinc-50',
    header: 'bg-zinc-900/80 backdrop-blur-md border-b border-emerald-900/30'
  },
  gold: {
    name: 'gold',
    label: 'Dhahabu Sinza',
    background: 'bg-stone-900 text-stone-50',
    card: 'bg-stone-850 border border-amber-900/40 shadow-md',
    text: 'text-stone-50',
    textMuted: 'text-amber-400/80',
    border: 'border-amber-900/30',
    primary: 'bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold focus:ring-amber-300',
    secondary: 'bg-stone-800 hover:bg-stone-750/80 text-stone-200',
    input: 'bg-stone-800/80 border-stone-700 focus:border-amber-400 focus:ring-amber-400 text-stone-50',
    header: 'bg-stone-900/85 backdrop-blur-md border-b border-amber-900/30'
  },
  royal: {
    name: 'royal',
    label: 'Kifalme (Royal Blue)',
    background: 'bg-indigo-950 text-indigo-50',
    card: 'bg-indigo-900/40 border border-indigo-800 shadow-md',
    text: 'text-indigo-50',
    textMuted: 'text-indigo-200',
    border: 'border-indigo-800',
    primary: 'bg-indigo-500 hover:bg-indigo-600 text-white focus:ring-indigo-400',
    secondary: 'bg-indigo-800 hover:bg-indigo-700 text-indigo-150',
    input: 'bg-indigo-900/80 border-indigo-700 focus:border-indigo-500 focus:ring-indigo-500 text-indigo-50',
    header: 'bg-indigo-950/80 backdrop-blur-md border-b border-indigo-800'
  }
};
