import { CircleAlert, CircleCheck, CircleX, Clock } from 'lucide-react';
import type { ReactNode } from 'react';
import { defineMessages, useMessages } from '@/i18n/messages';
import { cn, formatArguments, formatOperations, formatValue, testStatusLabel, verdictLabel } from '@/lib/format';
import type { JudgedTest, JudgeResponse, ProblemSpec } from '@/lib/types';
import { ErrorNotice, Spinner } from './ui';

const messages = defineMessages({
  tr: {
    input: 'Girdi',
    skipped: 'Önceki bir test programı durdurduğu için bu test çalıştırılmadı.',
    errorAtLine: (line: number) => `Hata (satır ${line})`,
    error: 'Hata',
    yourOutput: 'Çıktınız',
    expected: 'Beklenen',
    consoleOutput: 'Konsol çıktısı',
    judgingAll: 'Bütün testlerle değerlendiriliyor…',
    runningSamples: 'Örnek testlerle çalıştırılıyor…',
    emptyTitle: 'Sonuçlar burada görünecek.',
    shortcutBefore: '',
    shortcutAfter: ' ile örnek testleri çalıştırın.',
    samplesPassed: 'Örnek testler geçti',
    passedCount: (passed: number, total: number) => `${passed} / ${total} test geçti`,
    samplesPassedNote: 'Örnek testler geçti. Çözümünüzü gizli testlerle de değerlendirmek için gönderin.',
    line: 'Satır',
    tests: 'Testler',
    testTab: (sample: boolean, n: number) => `${sample ? 'Örnek' : 'Test'} ${n}`,
  },
  en: {
    input: 'Input',
    skipped: 'This test was not run because an earlier test stopped the program.',
    errorAtLine: (line: number) => `Error (line ${line})`,
    error: 'Error',
    yourOutput: 'Your output',
    expected: 'Expected',
    consoleOutput: 'Console output',
    judgingAll: 'Judging against all tests…',
    runningSamples: 'Running the sample tests…',
    emptyTitle: 'Results will appear here.',
    shortcutBefore: 'Press ',
    shortcutAfter: ' to run the sample tests.',
    samplesPassed: 'Sample tests passed',
    passedCount: (passed: number, total: number) => `${passed} / ${total} ${total === 1 ? 'test' : 'tests'} passed`,
    samplesPassedNote: 'The sample tests passed. Submit your solution to also judge it against the hidden tests.',
    line: 'Line',
    tests: 'Tests',
    testTab: (sample: boolean, n: number) => `${sample ? 'Sample' : 'Test'} ${n}`,
  },
});

interface JudgeResultPanelProps {
  spec: ProblemSpec;
  mode: 'run' | 'submit' | null;
  result?: JudgeResponse;
  error: unknown;
  pending: boolean;
  selectedTestId: number | null;
  onSelectTest: (id: number) => void;
}

function Block({ label, children, tone }: { label: string; children: ReactNode; tone?: 'error' }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted">{label}</p>
      <pre
        className={cn(
          'scrollbar-thin max-h-48 overflow-auto rounded-lg border px-3 py-2 font-mono text-[13px] leading-relaxed whitespace-pre-wrap',
          tone === 'error' ? 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300' : 'border-border bg-code-bg text-code-fg',
        )}
      >
        {children}
      </pre>
    </div>
  );
}

function TestDetail({ test, spec }: { test: JudgedTest; spec: ProblemSpec }) {
  const t = useMessages(messages);
  const input = spec.kind === 'class' && test.ops ? formatOperations(test.ops, test.args) : formatArguments(test.args, spec.params);

  return (
    <div className="space-y-3">
      <Block label={t.input}>{input}</Block>
      {test.status === 'skipped' ? (
        <p className="text-sm text-muted">{t.skipped}</p>
      ) : (
        <>
          {test.error ? (
            <Block label={test.errorLine ? t.errorAtLine(test.errorLine) : t.error} tone="error">
              {test.error}
            </Block>
          ) : (
            <Block label={t.yourOutput}>{formatValue(test.actual)}</Block>
          )}
          <Block label={t.expected}>{formatValue(test.expected)}</Block>
        </>
      )}
      {test.stdout && <Block label={t.consoleOutput}>{test.stdout}</Block>}
    </div>
  );
}

/** "Çalıştır" ve "Gönder" sonuçlarını gösterir: hüküm, test listesi ve seçili testin ayrıntıları. */
export function JudgeResultPanel({ spec, mode, result, error, pending, selectedTestId, onSelectTest }: JudgeResultPanelProps) {
  const t = useMessages(messages);

  if (pending) {
    return (
      <div className="flex h-full items-center justify-center gap-3 text-sm text-muted" role="status">
        <Spinner label="" />
        {mode === 'submit' ? t.judgingAll : t.runningSamples}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorNotice error={error} />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center text-sm text-muted">
        <p>{t.emptyTitle}</p>
        <p>
          {t.shortcutBefore}
          <kbd className="rounded border border-border px-1.5 font-mono text-xs">Ctrl</kbd> +{' '}
          <kbd className="rounded border border-border px-1.5 font-mono text-xs">Enter</kbd>
          {t.shortcutAfter}
        </p>
      </div>
    );
  }

  const accepted = result.verdict === 'accepted';
  const selected = result.tests.find((test) => test.id === selectedTestId) ?? result.tests[0];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        aria-live="polite"
        className={cn(
          'flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border px-4 py-2.5',
          accepted ? 'bg-emerald-500/10' : 'bg-rose-500/10',
        )}
      >
        <span className={cn('inline-flex items-center gap-2 font-semibold', accepted ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400')}>
          {accepted ? <CircleCheck className="size-5" aria-hidden /> : <CircleX className="size-5" aria-hidden />}
          {accepted && mode === 'run' ? t.samplesPassed : verdictLabel(result.verdict)}
        </span>
        {result.totalCount > 0 && result.verdict !== 'compileError' && (
          <span className="text-sm text-muted tabular-nums">{t.passedCount(result.passedCount, result.totalCount)}</span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted tabular-nums">
          <Clock className="size-3.5" aria-hidden />
          {Math.round(result.durationMs)} ms
        </span>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4">
        {accepted && mode === 'run' && (
          <p className="mb-4 text-sm text-muted">{t.samplesPassedNote}</p>
        )}

        {result.message && !accepted && result.verdict !== 'compileError' && (
          <p className="mb-4 flex items-start gap-2 text-sm text-rose-800 dark:text-rose-300">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {result.message}
          </p>
        )}

        {result.diagnostics.length > 0 && (
          <ul className="space-y-2">
            {result.diagnostics.map((diagnostic, index) => (
              <li key={index} className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 font-mono text-[13px] text-rose-800 dark:text-rose-300">
                {diagnostic.line > 0 && (
                  <span className="mr-2 font-semibold">
                    {t.line} {diagnostic.line}
                    {diagnostic.column > 0 && `:${diagnostic.column}`}
                  </span>
                )}
                {diagnostic.message}
              </li>
            ))}
          </ul>
        )}

        {result.tests.length > 0 && selected && (
          <>
            <div role="tablist" aria-label={t.tests} className="scrollbar-thin mb-4 flex gap-1.5 overflow-x-auto pb-1">
              {result.tests.map((test, index) => (
                <button
                  key={test.id}
                  type="button"
                  role="tab"
                  aria-selected={test.id === selected.id}
                  onClick={() => onSelectTest(test.id)}
                  title={testStatusLabel(test.status)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                    test.id === selected.id ? 'border-border-strong bg-surface-2 text-fg' : 'border-transparent text-muted hover:bg-surface-2',
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      test.status === 'passed' ? 'bg-emerald-500' : test.status === 'skipped' ? 'bg-border-strong' : 'bg-rose-500',
                    )}
                    aria-hidden
                  />
                  {t.testTab(test.sample, index + 1)}
                  <span className="sr-only">: {testStatusLabel(test.status)}</span>
                </button>
              ))}
            </div>
            <TestDetail test={selected} spec={spec} />
          </>
        )}
      </div>
    </div>
  );
}
