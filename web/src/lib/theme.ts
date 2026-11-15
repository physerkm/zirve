import { useSyncExternalStore } from 'react';
import { writeStorage } from './storage';

export type Theme = 'light' | 'dark';

// Temanın tek doğruluk kaynağı <html> üzerindeki .dark sınıfıdır (ilk değeri public/theme-init.js atar).
// Bileşenler bu sınıfı bir dış depo gibi izler; böylece Monaco ve Mermaid de aynı kaynağı okur.
const listeners = new Set<() => void>();

function getTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  writeStorage('theme', theme);
  listeners.forEach((listener) => listener());
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'dark' as Theme);
  return { theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}
