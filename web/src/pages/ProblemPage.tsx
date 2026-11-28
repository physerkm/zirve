import { ArrowLeft, ArrowRight, CircleCheck, Eye, Lightbulb, List, ListOrdered, Play, RotateCcw, Send } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { JudgeResultPanel } from '@/components/JudgeResultPanel';
import { Markdown } from '@/components/Markdown';
import { SplitPane } from '@/components/SplitPane';
import { Badge, Button, ButtonLink, DifficultyBadge, ErrorNotice, PageError, PageLoading, Spinner } from '@/components/ui';
import { defineMessages, useMessages } from '@/i18n/messages';
import { cn, formatRelative, languageLabels, tagLabel, verdictLabel } from '@/lib/format';
import { useMediaQuery } from '@/lib/hooks';
import { useEditorial, useJudge, useProblem, useSubmission, useSubmissions, useUser } from '@/lib/queries';
import { readStorage, removeStorage, writeStorage } from '@/lib/storage';
import type { Language, ProblemDetail } from '@/lib/types';
import { hasWalkthrough, walkthroughPath } from '@/lib/walkthroughs';

const messages = defineMessages({
  tr: {
    tabs: {
      description: 'Açıklama',
      hints: 'İpuçları',
      editorial: 'Çözüm',
      submissions: 'Gönderimler',
    },
    workspace: {
      languageSelect: 'Programlama dili',
      resetTitle: 'Başlangıç koduna dön',
      confirmReset: 'Emin misiniz?',
      reset: 'Sıfırla',
      run: 'Çalıştır',
      submit: 'Gönder',
      signInBefore: 'Kodunuzu çalıştırmak ve göndermek için ',
      signInLink: 'giriş yapın',
      signInAfter: '. Yazdığınız kod bu tarayıcıda saklanır.',
      editorLoading: 'Editör yükleniyor',
      editorLabel: (title: string, language: string) => `${title} için ${language} kod editörü`,
      results: 'Sonuçlar',
      view: 'Görünüm',
      viewInfo: 'Problem',
      viewCode: 'Kod',
    },
    info: {
      tabList: 'Problem bilgileri',
    },
    description: {
      allProblems: 'Bütün problemler',
      solved: 'Çözüldü',
      problemNav: 'Problemler arası gezinme',
    },
    hints: {
      none: 'Bu problem için ipucu yok.',
      intro: 'İpuçlarını sırayla açın. Her biri sizi çözüme biraz daha yaklaştırır; çözümün kendisini vermez.',
      hint: (n: number) => `İpucu ${n}`,
      showFirst: 'İlk ipucunu göster',
      showNext: (next: number, total: number) => `Sonraki ipucunu göster (${next}/${total})`,
      allSeen: 'Bütün ipuçlarını gördünüz. Hâlâ takılıyorsanız Çözüm sekmesinden cevabı açabilirsiniz.',
    },
    editorial: {
      none: 'Bu problem için henüz çözüm anlatımı yok.',
      tryFirst: 'Cevaba bakmadan önce kendiniz deneyin',
      tryFirstBody:
        'En çok, takılıp uğraştığınız problemlerden öğrenirsiniz. Önce ipuçlarını deneyin; en az 20–30 dakika uğraştıysanız cevabı açın.',
      showAnswer: 'Cevabı göster',
      walkthroughTitle: 'Çözümü adım adım izleyin',
      walkthroughBody: 'Kodun her satırının ne yaptığını kendi örneklerinizle, etkileşimli olarak görün.',
      walkthroughButton: 'Adım adım göster',
    },
    submissions: {
      signInPrompt: 'Gönderim geçmişinizi görmek için giriş yapın.',
      signIn: 'Giriş yap',
      empty: 'Henüz gönderim yapmadınız.',
      submissionOf: (language: string) => `${language} gönderimi`,
      loadIntoEditor: 'Editöre yükle',
    },
  },
  en: {
    tabs: {
      description: 'Description',
      hints: 'Hints',
      editorial: 'Solution',
      submissions: 'Submissions',
    },
    workspace: {
      languageSelect: 'Programming language',
      resetTitle: 'Restore the starter code',
      confirmReset: 'Are you sure?',
      reset: 'Reset',
      run: 'Run',
      submit: 'Submit',
      signInBefore: '',
      signInLink: 'Sign in',
      signInAfter: ' to run and submit your code. The code you write is saved in this browser.',
      editorLoading: 'Loading editor',
      editorLabel: (title: string, language: string) => `${language} code editor for ${title}`,
      results: 'Results',
      view: 'View',
      viewInfo: 'Problem',
      viewCode: 'Code',
    },
    info: {
      tabList: 'Problem details',
    },
    description: {
      allProblems: 'All problems',
      solved: 'Solved',
      problemNav: 'Problem navigation',
    },
    hints: {
      none: 'This problem has no hints.',
      intro: 'Reveal the hints one at a time. Each one brings you a little closer to the solution without giving it away.',
      hint: (n: number) => `Hint ${n}`,
      showFirst: 'Show the first hint',
      showNext: (next: number, total: number) => `Show the next hint (${next}/${total})`,
      allSeen: "You've seen all the hints. If you're still stuck, you can reveal the answer in the Solution tab.",
    },
    editorial: {
      none: "This problem doesn't have a solution write-up yet.",
      tryFirst: 'Try it yourself before you look at the answer',
      tryFirstBody:
        "You learn the most from the problems you struggle with. Try the hints first, and reveal the answer only after you've worked on it for at least 20–30 minutes.",
      showAnswer: 'Show answer',
      walkthroughTitle: 'Step through the solution',
      walkthroughBody: 'See what each line of the code does, interactively, with your own examples.',
      walkthroughButton: 'Show step by step',
    },
    submissions: {
      signInPrompt: 'Sign in to see your submission history.',
      signIn: 'Sign in',
      empty: "You haven't submitted anything yet.",
      submissionOf: (language: string) => `${language} submission`,
      loadIntoEditor: 'Load into editor',
    },
  },
});

const CodeEditor = lazy(() => import('@/components/CodeEditor'));

type InfoTab = 'description' | 'hints' | 'editorial' | 'submissions';

const infoTabs: readonly InfoTab[] = ['description', 'hints', 'editorial', 'submissions'];

const fileExtensions: Record<Language, string> = { csharp: 'cs', javascript: 'js', typescript: 'ts' };

export default function ProblemPage() {
  const { problemSlug = '' } = useParams();
  const problem = useProblem(problemSlug);

  if (problem.isPending) return <PageLoading />;
  if (problem.isError) return <PageError error={problem.error} onRetry={() => problem.refetch()} />;

  // key: başka bir probleme geçildiğinde editör ve sonuç durumu sıfırlanır.
  return <Workspace key={problem.data.slug} problem={problem.data} />;
}

function initialLanguage(problem: ProblemDetail): Language {
  const preferred = readStorage('language') as Language | null;
  return preferred && problem.languages.includes(preferred) ? preferred : problem.languages[0];
}

function Workspace({ problem }: { problem: ProblemDetail }) {
  const t = useMessages(messages).workspace;
  const isWide = useMediaQuery('(min-width: 1024px)');
  const { user } = useUser();
  const location = useLocation();
  const judge = useJudge(problem.slug);

  const [language, setLanguage] = useState<Language>(() => initialLanguage(problem));
  const [codeByLanguage, setCodeByLanguage] = useState<Partial<Record<Language, string>>>({});
  const [mode, setMode] = useState<'run' | 'submit' | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [mobileView, setMobileView] = useState<'info' | 'code'>('info');

  const storageKey = `code:${problem.slug}:${language}`;
  const starter = problem.starterCode[language] ?? '';
  const code = codeByLanguage[language] ?? readStorage(storageKey) ?? starter;

  const changeCode = (value: string) => {
    setCodeByLanguage((current) => ({ ...current, [language]: value }));
    writeStorage(storageKey, value);
  };

  const changeLanguage = (next: Language) => {
    setLanguage(next);
    writeStorage('language', next);
    judge.reset();
    setMode(null);
  };

  const resetCode = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      setTimeout(() => setConfirmingReset(false), 3000);
      return;
    }

    removeStorage(storageKey);
    setCodeByLanguage((current) => ({ ...current, [language]: starter }));
    setConfirmingReset(false);
  };

  const execute = (nextMode: 'run' | 'submit') => {
    if (!user || judge.isPending) return;

    setMode(nextMode);
    setSelectedTestId(null);
    judge.mutate(
      { mode: nextMode, language, code },
      {
        onSuccess: (result) => {
          // İlk başarısız testi öne çıkar.
          const firstFailure = result.tests.find((test) => test.status !== 'passed');
          setSelectedTestId((firstFailure ?? result.tests[0])?.id ?? null);
        },
      },
    );
  };

  const result = judge.data;
  const selectedTest = result?.tests.find((test) => test.id === selectedTestId);
  const solved = problem.status === 'solved' || (mode === 'submit' && result?.verdict === 'accepted');

  // Eski bir gönderimi editöre yükler; gönderim başka dildeyse o dile geçilir.
  const loadSubmission = (submissionLanguage: Language, value: string) => {
    // Sonuç paneli önceki çalıştırmayı göstermesin: yüklenen kod henüz çalıştırılmadı.
    judge.reset();
    setMode(null);
    setSelectedTestId(null);
    setLanguage(submissionLanguage);
    writeStorage('language', submissionLanguage);
    setCodeByLanguage((current) => ({ ...current, [submissionLanguage]: value }));
    writeStorage(`code:${problem.slug}:${submissionLanguage}`, value);
    setMobileView('code');
  };

  const infoPanel = <InfoPanel problem={problem} solved={solved} onLoadCode={loadSubmission} />;

  const codePanel = (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <label>
          <span className="sr-only">{t.languageSelect}</span>
          <select
            value={language}
            onChange={(event) => changeLanguage(event.target.value as Language)}
            className="h-8 rounded-lg border border-border bg-surface px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
          >
            {problem.languages.map((item) => (
              <option key={item} value={item}>
                {languageLabels[item]}
              </option>
            ))}
          </select>
        </label>

        <Button variant="ghost" size="sm" onClick={resetCode} title={t.resetTitle}>
          <RotateCcw className="size-3.5" aria-hidden />
          {confirmingReset ? t.confirmReset : t.reset}
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => execute('run')} disabled={!user} loading={judge.isPending && mode === 'run'}>
            {!(judge.isPending && mode === 'run') && <Play className="size-3.5" aria-hidden />}
            {t.run}
          </Button>
          <Button variant="success" size="sm" onClick={() => execute('submit')} disabled={!user} loading={judge.isPending && mode === 'submit'}>
            {!(judge.isPending && mode === 'submit') && <Send className="size-3.5" aria-hidden />}
            {t.submit}
          </Button>
        </div>
      </div>

      {!user && (
        <p className="border-b border-border bg-primary-soft px-4 py-2 text-sm">
          {t.signInBefore}
          <Link to="/login" state={{ from: location.pathname }} className="font-medium text-primary-text underline underline-offset-2">
            {t.signInLink}
          </Link>
          {t.signInAfter}
        </p>
      )}

      <div className="min-h-64 flex-[3] basis-0">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <Spinner label={t.editorLoading} />
            </div>
          }
        >
          <CodeEditor
            path={`file:///problems/${problem.slug}/solution.${fileExtensions[language]}`}
            language={language}
            value={code}
            onChange={changeCode}
            diagnostics={result?.diagnostics}
            errorLine={selectedTest?.errorLine}
            onRun={() => execute('run')}
            onSubmit={() => execute('submit')}
            ariaLabel={t.editorLabel(problem.title, languageLabels[language])}
          />
        </Suspense>
      </div>

      <section aria-label={t.results} className="min-h-48 flex-[2] basis-0 border-t border-border">
        <JudgeResultPanel
          spec={problem.spec}
          mode={mode}
          result={result}
          error={judge.error}
          pending={judge.isPending}
          selectedTestId={selectedTestId}
          onSelectTest={setSelectedTestId}
        />
      </section>
    </div>
  );

  return (
    <>
      <title>{`${problem.number}. ${problem.title} — Zirve`}</title>

      {isWide ? (
        <div className="h-[calc(100dvh-4rem-1px)]">
          <SplitPane storageKey="problem-split" left={infoPanel} right={codePanel} />
        </div>
      ) : (
        <div className="flex h-[calc(100dvh-4rem-1px)] flex-col">
          <div role="tablist" aria-label={t.view} className="grid grid-cols-2 border-b border-border bg-surface text-sm font-medium">
            {(['info', 'code'] as const).map((view) => (
              <button
                key={view}
                type="button"
                role="tab"
                aria-selected={mobileView === view}
                onClick={() => setMobileView(view)}
                className={cn('border-b-2 py-2.5', mobileView === view ? 'border-primary text-fg' : 'border-transparent text-muted')}
              >
                {view === 'info' ? t.viewInfo : t.viewCode}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">{mobileView === 'info' ? infoPanel : codePanel}</div>
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------ sol panel

type LoadCode = (language: Language, code: string) => void;

function InfoPanel({ problem, solved, onLoadCode }: { problem: ProblemDetail; solved: boolean; onLoadCode: LoadCode }) {
  // Adım adım anlatımdan dönen kullanıcı cevabı zaten açmıştı: çözüm sekmesi açık gelir.
  const returningToAnswer = (useLocation().state as { showAnswer?: boolean } | null)?.showAnswer === true;
  const [tab, setTab] = useState<InfoTab>(returningToAnswer ? 'editorial' : 'description');
  const t = useMessages(messages);

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      <div role="tablist" aria-label={t.info.tabList} className="scrollbar-thin flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-surface px-2">
        {infoTabs.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={cn(
              'shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              tab === id ? 'border-primary text-fg' : 'border-transparent text-muted hover:text-fg',
            )}
          >
            {t.tabs[id]}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
        {tab === 'description' && <DescriptionTab problem={problem} solved={solved} />}
        {tab === 'hints' && <HintsTab hints={problem.hints} />}
        {tab === 'editorial' && <EditorialTab problem={problem} initiallyRevealed={returningToAnswer} />}
        {tab === 'submissions' && <SubmissionsTab slug={problem.slug} onLoadCode={onLoadCode} />}
      </div>
    </div>
  );
}

function DescriptionTab({ problem, solved }: { problem: ProblemDetail; solved: boolean }) {
  const t = useMessages(messages).description;

  return (
    <article>
      <Link to="/problems" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <List className="size-4" aria-hidden />
        {t.allProblems}
      </Link>

      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        {problem.number}. {problem.title}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={problem.difficulty} />
        {solved && (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <CircleCheck className="size-3.5" aria-hidden />
            {t.solved}
          </Badge>
        )}
        {problem.tags.map((tag) => (
          <Link key={tag} to={`/problems?tag=${tag}`} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted hover:text-fg">
            {tagLabel(tag)}
          </Link>
        ))}
      </div>

      <Markdown size="sm" className="mt-5">
        {problem.statement}
      </Markdown>

      <nav aria-label={t.problemNav} className="mt-8 flex justify-between gap-3 border-t border-border pt-5 text-sm">
        {problem.previous ? (
          <Link to={`/problems/${problem.previous.slug}`} className="inline-flex items-center gap-1 text-muted hover:text-fg">
            <ArrowLeft className="size-4" aria-hidden />
            {problem.previous.title}
          </Link>
        ) : (
          <span />
        )}
        {problem.next && (
          <Link to={`/problems/${problem.next.slug}`} className="inline-flex items-center gap-1 text-right text-muted hover:text-fg">
            {problem.next.title}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </nav>
    </article>
  );
}

function HintsTab({ hints }: { hints: string[] }) {
  const t = useMessages(messages).hints;
  const [revealed, setRevealed] = useState(0);

  if (hints.length === 0) {
    return <p className="text-sm text-muted">{t.none}</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t.intro}</p>
      {hints.slice(0, revealed).map((hint, index) => (
        <div key={index} className="animate-fade-in rounded-lg border border-border bg-surface p-4">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-400">
            <Lightbulb className="size-3.5" aria-hidden />
            {t.hint(index + 1)}
          </p>
          <Markdown size="sm" className="mt-1">
            {hint}
          </Markdown>
        </div>
      ))}
      {revealed < hints.length ? (
        <Button variant="secondary" onClick={() => setRevealed((value) => value + 1)}>
          <Lightbulb className="size-4" aria-hidden />
          {revealed === 0 ? t.showFirst : t.showNext(revealed + 1, hints.length)}
        </Button>
      ) : (
        <p className="text-sm text-muted">{t.allSeen}</p>
      )}
    </div>
  );
}

function EditorialTab({ problem, initiallyRevealed }: { problem: ProblemDetail; initiallyRevealed: boolean }) {
  // Cevap kendiliğinden görünmez; "Cevabı göster"e basılana kadar sunucudan da istenmez.
  const t = useMessages(messages).editorial;
  const [revealed, setRevealed] = useState(initiallyRevealed);
  const editorial = useEditorial(problem.slug, revealed && problem.hasEditorial);

  if (!problem.hasEditorial) {
    return <p className="text-sm text-muted">{t.none}</p>;
  }

  if (!revealed) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong p-6 text-center">
        <p className="font-medium">{t.tryFirst}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{t.tryFirstBody}</p>
        <Button variant="secondary" className="mt-4" onClick={() => setRevealed(true)}>
          <Eye className="size-4" aria-hidden />
          {t.showAnswer}
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      {hasWalkthrough(problem.slug) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="min-w-0 flex-1 basis-56">
            <p className="text-sm font-medium">{t.walkthroughTitle}</p>
            <p className="mt-0.5 text-sm text-muted">{t.walkthroughBody}</p>
          </div>
          <ButtonLink to={walkthroughPath(problem.slug)} size="sm">
            <ListOrdered className="size-4" aria-hidden />
            {t.walkthroughButton}
          </ButtonLink>
        </div>
      )}

      {editorial.isPending && <Spinner />}
      {editorial.isError && <ErrorNotice error={editorial.error} onRetry={() => editorial.refetch()} />}
      {editorial.data && <Markdown size="sm">{editorial.data.editorial}</Markdown>}
    </div>
  );
}

function SubmissionsTab({ slug, onLoadCode }: { slug: string; onLoadCode: LoadCode }) {
  const t = useMessages(messages).submissions;
  const { user } = useUser();
  const location = useLocation();
  const submissions = useSubmissions(slug, Boolean(user));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useSubmission(selectedId);

  if (!user) {
    return (
      <div className="text-sm text-muted">
        <p>{t.signInPrompt}</p>
        <ButtonLink to="/login" state={{ from: location.pathname }} variant="secondary" size="sm" className="mt-3">
          {t.signIn}
        </ButtonLink>
      </div>
    );
  }

  if (submissions.isPending) return <Spinner />;
  if (submissions.isError) return <ErrorNotice error={submissions.error} onRetry={() => submissions.refetch()} />;
  if (submissions.data.length === 0) return <p className="text-sm text-muted">{t.empty}</p>;

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {submissions.data.map((submission) => (
          <li key={submission.id}>
            <button
              type="button"
              onClick={() => setSelectedId(submission.id === selectedId ? null : submission.id)}
              aria-expanded={submission.id === selectedId}
              className={cn('flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-surface-2', submission.id === selectedId && 'bg-surface-2')}
            >
              <span className={cn('font-medium', submission.verdict === 'accepted' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400')}>
                {verdictLabel(submission.verdict)}
              </span>
              <span className="text-muted">{languageLabels[submission.language]}</span>
              <span className="text-muted tabular-nums">
                {submission.passedCount}/{submission.totalCount}
              </span>
              <span className="ml-auto text-xs text-muted">{formatRelative(submission.createdAt)}</span>
            </button>
          </li>
        ))}
      </ul>

      {selectedId && selected.isPending && <Spinner />}
      {selectedId && selected.isError && <ErrorNotice error={selected.error} />}
      {selectedId && selected.data && (
        <div className="animate-fade-in overflow-hidden rounded-xl border border-border bg-code-bg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-medium text-muted">{t.submissionOf(languageLabels[selected.data.language])}</span>
            <Button variant="ghost" size="sm" onClick={() => onLoadCode(selected.data.language, selected.data.code)}>
              {t.loadIntoEditor}
            </Button>
          </div>
          <pre className="scrollbar-thin max-h-96 overflow-auto p-4 font-mono text-[13px] leading-relaxed text-code-fg">{selected.data.code}</pre>
        </div>
      )}
    </div>
  );
}
