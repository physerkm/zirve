import { Clock, Play, RotateCcw } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button, ErrorNotice, Spinner } from '@/components/ui';
import { defineMessages, useMessages } from '@/i18n/messages';
import { cn, languageLabels } from '@/lib/format';
import { useMediaQuery } from '@/lib/hooks';
import { useRunPlayground, useUser } from '@/lib/queries';
import { readStorage, writeStorage } from '@/lib/storage';
import type { ExecutionStatus, Language } from '@/lib/types';

const messages = defineMessages({
  tr: {
    pageTitle: 'Deneme Alanı — Zirve',
    heading: 'Deneme Alanı',
    languageTabs: 'Programlama dili',
    resetTitle: 'Örnek koda dön',
    reset: 'Örnek kod',
    run: 'Çalıştır',
    signInBefore: 'Kod çalıştırmak için ',
    signInLink: 'giriş yapın',
    signInAfter: '.',
    editorLoading: 'Editör yükleniyor',
    editorLabel: (language: string) => `${language} deneme alanı editörü`,
    output: 'Çıktı',
    running: 'Çalıştırılıyor…',
    hintBefore: 'Kodu çalıştırmak için ',
    hintAfter:
      ' tuşlarına basın. Kod, sunucuda yalıtılmış bir ortamda süre ve bellek sınırıyla çalışır; dosya ve ağ erişimi yoktur.',
    line: (line: number) => `Satır ${line}: `,
    noOutput: 'Program çıktı üretmedi.',
    status: {
      completed: 'Tamamlandı',
      compileError: 'Derleme hatası',
      runtimeError: 'Çalışma zamanı hatası',
      timeout: 'Süre sınırı aşıldı',
      outputLimit: 'Çıktı sınırı aşıldı',
      internalError: 'Sistem hatası',
    } satisfies Record<ExecutionStatus, string>,
    samples: {
      csharp: `// C# deneme alanı: üst düzey ifadeler (top-level statements) kullanabilirsiniz.
// System, System.Linq, System.Collections.Generic, System.Text ve System.Threading.Tasks hazır gelir.

var numbers = new List<int> { 5, 3, 8, 1, 9, 2 };

var evenSquares = numbers
    .Where(n => n % 2 == 0)
    .Select(n => n * n)
    .OrderBy(n => n);

Console.WriteLine($"Çift sayıların kareleri: {string.Join(", ", evenSquares)}");

// async/await de çalışır:
await Task.Delay(100);
Console.WriteLine("Bitti.");
`,
      typescript: `// TypeScript deneme alanı. Tipler çalıştırmadan önce silinir; tip hataları editörde gösterilir.

interface User {
  name: string;
  age: number;
}

const users: User[] = [
  { name: 'Ada', age: 36 },
  { name: 'Alan', age: 41 },
  { name: 'Grace', age: 85 },
];

const byAge = [...users].sort((a, b) => b.age - a.age);
console.log('En yaşlı:', byAge[0]);

// Olay döngüsünü gözlemleyin: hangi satır önce yazılır?
setTimeout(() => console.log('3. zamanlayıcı (makro görev)'), 0);
Promise.resolve().then(() => console.log('2. promise (mikro görev)'));
console.log('1. eşzamanlı kod');
`,
      javascript: `// JavaScript deneme alanı.

function createCounter() {
  let count = 0; // closure: bu değişken dışarıdan erişilemez
  return {
    increment: () => ++count,
    get value() {
      return count;
    },
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
console.log('Sayaç:', counter.value);

console.log([1, 2, 3].map((n) => n * 2));
console.log(typeof null, 0.1 + 0.2 === 0.3, [] + {});
`,
    } satisfies Record<Language, string>,
  },
  en: {
    pageTitle: 'Playground — Zirve',
    heading: 'Playground',
    languageTabs: 'Programming language',
    resetTitle: 'Restore the sample code',
    reset: 'Sample code',
    run: 'Run',
    signInBefore: '',
    signInLink: 'Sign in',
    signInAfter: ' to run code.',
    editorLoading: 'Loading editor',
    editorLabel: (language: string) => `${language} playground editor`,
    output: 'Output',
    running: 'Running…',
    hintBefore: 'Press ',
    hintAfter:
      ' to run your code. It runs on the server in an isolated environment with time and memory limits, and has no file or network access.',
    line: (line: number) => `Line ${line}: `,
    noOutput: 'The program produced no output.',
    status: {
      completed: 'Completed',
      compileError: 'Compilation error',
      runtimeError: 'Runtime error',
      timeout: 'Time limit exceeded',
      outputLimit: 'Output limit exceeded',
      internalError: 'System error',
    },
    samples: {
      csharp: `// C# playground: you can use top-level statements.
// System, System.Linq, System.Collections.Generic, System.Text and System.Threading.Tasks are imported for you.

var numbers = new List<int> { 5, 3, 8, 1, 9, 2 };

var evenSquares = numbers
    .Where(n => n % 2 == 0)
    .Select(n => n * n)
    .OrderBy(n => n);

Console.WriteLine($"Squares of the even numbers: {string.Join(", ", evenSquares)}");

// async/await works too:
await Task.Delay(100);
Console.WriteLine("Done.");
`,
      typescript: `// TypeScript playground. Types are erased before the code runs; type errors are shown in the editor.

interface User {
  name: string;
  age: number;
}

const users: User[] = [
  { name: 'Ada', age: 36 },
  { name: 'Alan', age: 41 },
  { name: 'Grace', age: 85 },
];

const byAge = [...users].sort((a, b) => b.age - a.age);
console.log('Oldest:', byAge[0]);

// Watch the event loop: which line is printed first?
setTimeout(() => console.log('3. timer (macrotask)'), 0);
Promise.resolve().then(() => console.log('2. promise (microtask)'));
console.log('1. synchronous code');
`,
      javascript: `// JavaScript playground.

function createCounter() {
  let count = 0; // closure: this variable can't be accessed from outside
  return {
    increment: () => ++count,
    get value() {
      return count;
    },
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
console.log('Counter:', counter.value);

console.log([1, 2, 3].map((n) => n * 2));
console.log(typeof null, 0.1 + 0.2 === 0.3, [] + {});
`,
    },
  },
});

const CodeEditor = lazy(() => import('@/components/CodeEditor'));

const languages: Language[] = ['csharp', 'typescript', 'javascript'];
const fileExtensions: Record<Language, string> = { csharp: 'cs', javascript: 'js', typescript: 'ts' };

interface IncomingState {
  language?: Language;
  code?: string;
}

export default function PlaygroundPage() {
  const t = useMessages(messages);
  const location = useLocation();
  // Derslerdeki "Dene" bağlantısı kodu yönlendirme durumuyla (state) gönderir.
  const incoming = (location.state ?? {}) as IncomingState;
  const isWide = useMediaQuery('(min-width: 1024px)');
  const { user } = useUser();
  const run = useRunPlayground();

  const [language, setLanguage] = useState<Language>(() => {
    const stored = readStorage('playground:language') as Language | null;
    return incoming.language ?? (stored && languages.includes(stored) ? stored : 'csharp');
  });

  const [codeByLanguage, setCodeByLanguage] = useState<Partial<Record<Language, string>>>(() =>
    incoming.language && incoming.code !== undefined ? { [incoming.language]: incoming.code } : {},
  );

  // "Dene" ile gelen kod bir kez uygulanır: kaydedilir ve yönlendirme durumu temizlenir. Durum geçmişte
  // kalırsa sayfa yenilendiğinde ders kodu, kullanıcının sonradan yaptığı düzenlemelerin yerine yeniden yüklenirdi.
  const navigate = useNavigate();
  useEffect(() => {
    if (incoming.language && incoming.code !== undefined) {
      writeStorage(`playground:code:${incoming.language}`, incoming.code);
      writeStorage('playground:language', incoming.language);
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [incoming.language, incoming.code, location.pathname, location.search, navigate]);

  const storageKey = `playground:code:${language}`;
  // Kullanıcının yazdığı ya da kaydettiği kod her zaman önceliklidir; örnek kod yalnızca ikisi de yoksa, geçerli dilde gösterilir.
  const code = codeByLanguage[language] ?? readStorage(storageKey) ?? t.samples[language];

  const changeCode = (value: string) => {
    setCodeByLanguage((current) => ({ ...current, [language]: value }));
    writeStorage(storageKey, value);
  };

  const changeLanguage = (next: Language) => {
    setLanguage(next);
    writeStorage('playground:language', next);
    run.reset();
  };

  const execute = () => {
    if (user && !run.isPending) run.mutate({ language, code });
  };

  const result = run.data;
  const failed = result && result.status !== 'completed';

  const editor = (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <div role="tablist" aria-label={t.languageTabs} className="flex rounded-lg border border-border p-0.5">
          {languages.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={language === item}
              onClick={() => changeLanguage(item)}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                language === item ? 'bg-primary text-primary-fg' : 'text-muted hover:text-fg',
              )}
            >
              {languageLabels[item]}
            </button>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={() => changeCode(t.samples[language])} title={t.resetTitle}>
          <RotateCcw className="size-3.5" aria-hidden />
          {t.reset}
        </Button>

        <Button size="sm" className="ml-auto" onClick={execute} disabled={!user} loading={run.isPending}>
          {!run.isPending && <Play className="size-3.5" aria-hidden />}
          {t.run}
        </Button>
      </div>

      {!user && (
        <p className="border-b border-border bg-primary-soft px-4 py-2 text-sm">
          {t.signInBefore}
          <Link to="/login" state={{ from: '/playground' }} className="font-medium text-primary-text underline underline-offset-2">
            {t.signInLink}
          </Link>
          {t.signInAfter}
        </p>
      )}

      <div className="min-h-72 flex-1">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <Spinner label={t.editorLoading} />
            </div>
          }
        >
          <CodeEditor
            path={`file:///playground/main.${fileExtensions[language]}`}
            language={language}
            value={code}
            onChange={changeCode}
            diagnostics={result?.diagnostics}
            onRun={execute}
            ariaLabel={t.editorLabel(languageLabels[language])}
          />
        </Suspense>
      </div>
    </div>
  );

  const output = (
    <section aria-label={t.output} className="flex h-full min-h-56 flex-col bg-code-bg">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
        <h2 className="text-sm font-semibold">{t.output}</h2>
        {result && (
          <span className="flex items-center gap-3 text-xs">
            <span className={cn('font-medium', failed ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400')}>
              {t.status[result.status]}
            </span>
            <span className="inline-flex items-center gap-1 text-muted tabular-nums">
              <Clock className="size-3.5" aria-hidden />
              {Math.round(result.durationMs)} ms
            </span>
          </span>
        )}
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-auto p-4 font-mono text-[13px] leading-relaxed" aria-live="polite">
        {run.isPending && (
          <p className="flex items-center gap-2 font-sans text-sm text-muted" role="status">
            <Spinner label="" className="size-4" />
            {t.running}
          </p>
        )}

        {run.isError && <ErrorNotice error={run.error} className="font-sans" />}

        {!run.isPending && !run.isError && !result && (
          <p className="font-sans text-sm text-muted">
            {t.hintBefore}
            <kbd className="rounded border border-border px-1.5 font-mono text-xs">Ctrl</kbd> +{' '}
            <kbd className="rounded border border-border px-1.5 font-mono text-xs">Enter</kbd>
            {t.hintAfter}
          </p>
        )}

        {result && !run.isPending && (
          <>
            {result.diagnostics.map((diagnostic, index) => (
              <p key={index} className="text-rose-700 dark:text-rose-400">
                {diagnostic.line > 0 && t.line(diagnostic.line)}
                {diagnostic.message}
              </p>
            ))}
            {result.stdout && <pre className="whitespace-pre-wrap text-code-fg">{result.stdout}</pre>}
            {result.stderr && <pre className="mt-2 whitespace-pre-wrap text-rose-700 dark:text-rose-400">{result.stderr}</pre>}
            {!result.stderr && failed && result.message && <p className="text-rose-700 dark:text-rose-400">{result.message}</p>}
            {!result.stdout && !result.stderr && result.diagnostics.length === 0 && !failed && (
              <p className="font-sans text-sm text-muted">{t.noOutput}</p>
            )}
          </>
        )}
      </div>
    </section>
  );

  return (
    <>
      <title>{t.pageTitle}</title>
      <h1 className="sr-only">{t.heading}</h1>
      <div className={cn('h-[calc(100dvh-4rem-1px)]', isWide ? 'grid grid-cols-[3fr_2fr] divide-x divide-border' : 'flex flex-col divide-y divide-border')}>
        <div className="min-h-0 min-w-0 flex-[3]">{editor}</div>
        <div className="min-h-0 min-w-0 flex-[2]">{output}</div>
      </div>
    </>
  );
}
