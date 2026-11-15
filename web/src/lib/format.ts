import clsx, { type ClassValue } from 'clsx';
import type { Difficulty, Json, Language, Level, ParamSpec, TestStatus, Verdict } from './types';

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const levelLabels: Record<Level, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

export const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
};

export const difficultyClasses: Record<Difficulty, string> = {
  easy: 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400',
  medium: 'text-amber-700 bg-amber-500/10 dark:text-amber-400',
  hard: 'text-rose-700 bg-rose-500/10 dark:text-rose-400',
};

export const languageLabels: Record<Language, string> = {
  csharp: 'C#',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
};

export const verdictLabels: Record<Verdict, string> = {
  accepted: 'Kabul edildi',
  wrongAnswer: 'Yanlış yanıt',
  runtimeError: 'Çalışma zamanı hatası',
  timeLimitExceeded: 'Süre sınırı aşıldı',
  outputLimitExceeded: 'Çıktı sınırı aşıldı',
  compileError: 'Derleme hatası',
  internalError: 'Sistem hatası',
};

export const testStatusLabels: Record<TestStatus, string> = {
  passed: 'Geçti',
  failed: 'Yanlış',
  error: 'Hata',
  timeout: 'Zaman aşımı',
  skipped: 'Çalışmadı',
};

/** Etiket slug'larının okunur karşılıkları; listede olmayanlar slug'dan türetilir. */
const tagLabels: Record<string, string> = {
  dizi: 'Dizi',
  'hash-tablosu': 'Hash Tablosu',
  'iki-isaretci': 'İki İşaretçi',
  'kayan-pencere': 'Kayan Pencere',
  yigin: 'Yığın',
  kuyruk: 'Kuyruk',
  'ikili-arama': 'İkili Arama',
  'bagli-liste': 'Bağlı Liste',
  agac: 'Ağaç',
  'ikili-arama-agaci': 'İkili Arama Ağacı',
  heap: 'Heap',
  graf: 'Graf',
  bfs: 'BFS',
  dfs: 'DFS',
  'dinamik-programlama': 'Dinamik Programlama',
  'geri-izleme': 'Geri İzleme',
  acgozlu: 'Açgözlü',
  aralik: 'Aralık',
  siralama: 'Sıralama',
  dizgi: 'Dizgi',
  matematik: 'Matematik',
  tasarim: 'Tasarım',
  trie: 'Trie',
  ozyineleme: 'Özyineleme',
  matris: 'Matris',
  'on-ek-toplami': 'Ön Ek Toplamı',
  javascript: 'JavaScript',
  'topolojik-siralama': 'Topolojik Sıralama',
};

export function tagLabel(tag: string): string {
  return tagLabels[tag] ?? tag.split('-').map((word) => word.charAt(0).toLocaleUpperCase('tr') + word.slice(1)).join(' ');
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} sa` : `${hours} sa ${rest} dk`;
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const dateTimeFormat = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
const relativeFormat = new Intl.RelativeTimeFormat('tr', { numeric: 'auto' });

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
  }

  return 'az önce';
}

export function percent(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

/** JSON değerini test çıktısında gösterilecek kısa, okunur biçime çevirir. */
export function formatValue(value: Json | undefined): string {
  if (value === undefined) return '—';
  return JSON.stringify(value)
    .replace(/,/g, ', ')
    .replace(/":/g, '": ');
}

/** Fonksiyon argümanlarını "nums = [2, 7], target = 9" biçiminde yazar. */
export function formatArguments(args: Json[], params: ParamSpec[]): string {
  return args.map((value, index) => `${params[index]?.name ?? `arg${index + 1}`} = ${formatValue(value)}`).join('\n');
}

/** Sınıf problemlerinde işlem dizisini okunur satırlara çevirir. */
export function formatOperations(ops: string[], args: Json[]): string {
  return ops
    .map((operation, index) => {
      const values = Array.isArray(args[index]) ? (args[index] as Json[]).map(formatValue).join(', ') : '';
      return index === 0 ? `new ${operation}(${values})` : `.${operation}(${values})`;
    })
    .join('\n');
}
