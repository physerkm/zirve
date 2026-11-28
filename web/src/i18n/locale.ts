import { useSyncExternalStore } from 'react';
import { writeStorage } from '@/lib/storage';

/** Sitenin dilleri. Türkçe varsayılandır. */
export type Locale = 'tr' | 'en';

export const locales: readonly Locale[] = ['tr', 'en'];

// Dilin tek doğruluk kaynağı <html lang> özniteliğidir (ilk değeri public/theme-init.js atar: kayıtlı tercih,
// yoksa tarayıcının dili). Tema gibi bir dış depo olarak izlenir; React dışındaki kod (API istemcisi,
// sorgu önbelleği) da aynı kaynağı okur.
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  return document.documentElement.lang === 'en' ? 'en' : 'tr';
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setLocale(locale: Locale): void {
  if (locale === getLocale()) return;
  document.documentElement.lang = locale;
  // "language" anahtarı problem sayfasındaki programlama dili tercihine aittir; arayüz dili ayrı tutulur.
  writeStorage('locale', locale);
  listeners.forEach((listener) => listener());
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, () => 'tr' as Locale);
}

/** Intl API'leri için tam dil etiketi. */
export const intlLocale = (locale: Locale = getLocale()): string => (locale === 'en' ? 'en-US' : 'tr-TR');
