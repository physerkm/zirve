import clsx, { type ClassValue } from 'clsx';
import { getLocale, intlLocale } from '@/i18n/locale';
import { currentMessages, defineMessages } from '@/i18n/messages';
import type { Difficulty, Json, Language, Level, ParamSpec, TestStatus, Verdict } from './types';

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

// Etiketler ve biçimlendirme geçerli dile göre yapılır (bkz. i18n/locale.ts). Bu fonksiyonları çağıran
// bileşenler dil değişince yeniden çizilmek için useLocale ya da useMessages kullanır.

const labels = defineMessages({
  tr: {
    level: { beginner: 'Başlangıç', intermediate: 'Orta', advanced: 'İleri' } as Record<Level, string>,
    difficulty: { easy: 'Kolay', medium: 'Orta', hard: 'Zor' } as Record<Difficulty, string>,
    verdict: {
      accepted: 'Kabul edildi',
      wrongAnswer: 'Yanlış yanıt',
      runtimeError: 'Çalışma zamanı hatası',
      timeLimitExceeded: 'Süre sınırı aşıldı',
      outputLimitExceeded: 'Çıktı sınırı aşıldı',
      compileError: 'Derleme hatası',
      internalError: 'Sistem hatası',
    } as Record<Verdict, string>,
    testStatus: {
      passed: 'Geçti',
      failed: 'Yanlış',
      error: 'Hata',
      timeout: 'Zaman aşımı',
      skipped: 'Çalışmadı',
    } as Record<TestStatus, string>,
    minutes: (m: number) => `${m} dk`,
    hours: (h: number) => `${h} sa`,
    justNow: 'az önce',
  },
  en: {
    level: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
    difficulty: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
    verdict: {
      accepted: 'Accepted',
      wrongAnswer: 'Wrong answer',
      runtimeError: 'Runtime error',
      timeLimitExceeded: 'Time limit exceeded',
      outputLimitExceeded: 'Output limit exceeded',
      compileError: 'Compile error',
      internalError: 'System error',
    },
    testStatus: {
      passed: 'Passed',
      failed: 'Wrong',
      error: 'Error',
      timeout: 'Timed out',
      skipped: 'Not run',
    },
    minutes: (m: number) => `${m} min`,
    hours: (h: number) => `${h} h`,
    justNow: 'just now',
  },
});

export const levelLabel = (level: Level): string => currentMessages(labels).level[level];

export const difficultyLabel = (difficulty: Difficulty): string => currentMessages(labels).difficulty[difficulty];

export const verdictLabel = (verdict: Verdict): string => currentMessages(labels).verdict[verdict];

export const testStatusLabel = (status: TestStatus): string => currentMessages(labels).testStatus[status];

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

/** Etiket slug'larının (Türkçe) okunur karşılıkları; listede olmayanlar slug'dan türetilir. */
const tagLabels = defineMessages<Record<string, string>>({
  tr: {
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
    'bit-islemleri': 'Bit İşlemleri',
    'birlik-bul': 'Birlik-Bul',
  },
  en: {
    dizi: 'Array',
    'hash-tablosu': 'Hash Table',
    'iki-isaretci': 'Two Pointers',
    'kayan-pencere': 'Sliding Window',
    yigin: 'Stack',
    kuyruk: 'Queue',
    'ikili-arama': 'Binary Search',
    'bagli-liste': 'Linked List',
    agac: 'Tree',
    'ikili-arama-agaci': 'Binary Search Tree',
    heap: 'Heap',
    graf: 'Graph',
    bfs: 'BFS',
    dfs: 'DFS',
    'dinamik-programlama': 'Dynamic Programming',
    'geri-izleme': 'Backtracking',
    acgozlu: 'Greedy',
    aralik: 'Intervals',
    siralama: 'Sorting',
    dizgi: 'String',
    matematik: 'Math',
    tasarim: 'Design',
    trie: 'Trie',
    ozyineleme: 'Recursion',
    matris: 'Matrix',
    'on-ek-toplami': 'Prefix Sum',
    javascript: 'JavaScript',
    'topolojik-siralama': 'Topological Sort',
    'bit-islemleri': 'Bit Manipulation',
    'birlik-bul': 'Union-Find',
  },
});

export function tagLabel(tag: string): string {
  const locale = getLocale();
  return (
    tagLabels[locale][tag] ??
    tag
      .split('-')
      .map((word) => word.charAt(0).toLocaleUpperCase(locale) + word.slice(1))
      .join(' ')
  );
}

export function formatMinutes(minutes: number): string {
  const t = currentMessages(labels);
  if (minutes < 60) return t.minutes(minutes);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? t.hours(hours) : `${t.hours(hours)} ${t.minutes(rest)}`;
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(intlLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const relativeFormat = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });
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

  return currentMessages(labels).justNow;
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
