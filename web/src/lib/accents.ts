// Yol (track) vurgu renkleri. Tailwind sınıfları derleme anında tarandığı için tam sınıf adları
// burada sabit olarak durmalıdır; dinamik olarak birleştirilemez.
const accents: Record<string, { icon: string; bar: string }> = {
  amber: { icon: 'bg-amber-500/12 text-amber-700 dark:text-amber-400', bar: 'bg-amber-500' },
  emerald: { icon: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-500' },
  sky: { icon: 'bg-sky-500/12 text-sky-700 dark:text-sky-400', bar: 'bg-sky-500' },
  violet: { icon: 'bg-violet-500/12 text-violet-700 dark:text-violet-400', bar: 'bg-violet-500' },
  indigo: { icon: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-400', bar: 'bg-indigo-500' },
  yellow: { icon: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400', bar: 'bg-yellow-500' },
  blue: { icon: 'bg-blue-500/12 text-blue-700 dark:text-blue-400', bar: 'bg-blue-500' },
  cyan: { icon: 'bg-cyan-500/12 text-cyan-700 dark:text-cyan-400', bar: 'bg-cyan-500' },
  teal: { icon: 'bg-teal-500/12 text-teal-700 dark:text-teal-400', bar: 'bg-teal-500' },
  rose: { icon: 'bg-rose-500/12 text-rose-700 dark:text-rose-400', bar: 'bg-rose-500' },
  orange: { icon: 'bg-orange-500/12 text-orange-700 dark:text-orange-400', bar: 'bg-orange-500' },
  slate: { icon: 'bg-slate-500/12 text-slate-700 dark:text-slate-300', bar: 'bg-slate-500' },
  lime: { icon: 'bg-lime-500/15 text-lime-700 dark:text-lime-400', bar: 'bg-lime-500' },
  fuchsia: { icon: 'bg-fuchsia-500/12 text-fuchsia-700 dark:text-fuchsia-400', bar: 'bg-fuchsia-500' },
};

const fallback = { icon: 'bg-primary-soft text-primary-text', bar: 'bg-primary' };

export const accentIconClass = (accent: string): string => (accents[accent] ?? fallback).icon;

export const accentBarClass = (accent: string): string => (accents[accent] ?? fallback).bar;
