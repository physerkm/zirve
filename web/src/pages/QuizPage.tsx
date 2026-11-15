import { ChevronRight, CircleCheck, CircleX, ListChecks, RotateCcw, Timer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { InlineMarkdown, Markdown } from '@/components/Markdown';
import { Button, ButtonLink, Card, DifficultyBadge, ErrorNotice, LevelBadge, PageError, PageLoading, ProgressBar } from '@/components/ui';
import { cn, formatDuration, percent } from '@/lib/format';
import { useQuiz, useSubmitQuiz, useUser } from '@/lib/queries';
import type { QuestionResult, QuizDetail, QuizQuestion } from '@/lib/types';

type Answers = Record<number, number[]>;

export default function QuizPage() {
  const { quizSlug = '' } = useParams();
  const quiz = useQuiz(quizSlug);

  if (quiz.isPending) return <PageLoading />;
  if (quiz.isError) return <PageError error={quiz.error} onRetry={() => quiz.refetch()} />;

  // key: başka bir teste geçildiğinde bütün yerel durum sıfırlanır.
  return <QuizRunner key={quiz.data.slug} quiz={quiz.data} />;
}

function QuizRunner({ quiz }: { quiz: QuizDetail }) {
  const location = useLocation();
  const { user } = useUser();
  const submit = useSubmitQuiz(quiz.slug);

  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const submitted = useRef(false);

  const isActive = startedAt !== null && !submit.data;
  const elapsedSeconds = startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
  const limitSeconds = quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null;
  const remainingSeconds = limitSeconds === null ? null : Math.max(0, limitSeconds - elapsedSeconds);
  const answeredCount = quiz.questions.filter((question) => (answers[question.id]?.length ?? 0) > 0).length;

  const finish = () => {
    if (submitted.current || startedAt === null) return;
    submitted.current = true;
    submit.mutate(
      { answers, durationSeconds: Math.floor((Date.now() - startedAt) / 1000) },
      {
        onError: () => {
          submitted.current = false;
        },
        onSuccess: () => window.scrollTo({ top: 0 }),
      },
    );
  };

  // Saat yalnızca test sürerken işler.
  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [isActive]);

  // Süre dolduğunda test kendiliğinden gönderilir.
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  useEffect(() => {
    if (isActive && remainingSeconds === 0) finishRef.current();
  }, [isActive, remainingSeconds]);

  const start = () => {
    const time = Date.now();
    submitted.current = false;
    submit.reset();
    setAnswers({});
    setNow(time);
    setStartedAt(time);
    window.scrollTo({ top: 0 });
  };

  const toggle = (question: QuizQuestion, optionId: number) => {
    setAnswers((current) => {
      const selected = current[question.id] ?? [];
      const next = question.isMultiple
        ? selected.includes(optionId)
          ? selected.filter((id) => id !== optionId)
          : [...selected, optionId]
        : [optionId];

      return { ...current, [question.id]: next };
    });
  };

  const breadcrumb = (
    <nav aria-label="Konum" className="flex flex-wrap items-center gap-1 text-sm text-muted">
      <Link to="/quizzes" className="hover:text-fg">
        Testler
      </Link>
      <ChevronRight className="size-3.5" aria-hidden />
      <Link to={`/tracks/${quiz.track.slug}`} className="hover:text-fg">
        {quiz.track.title}
      </Link>
    </nav>
  );

  // ---------------------------------------------------------------- giriş ekranı
  if (startedAt === null) {
    return (
      <div className="container-page max-w-3xl py-10">
        <title>{`${quiz.title} — Zirve`}</title>
        {breadcrumb}
        <Card className="mt-6 p-6 sm:p-8">
          <LevelBadge level={quiz.level} />
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{quiz.title}</h1>
          {quiz.description && <p className="mt-3 text-muted">{quiz.description}</p>}

          <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-border py-5 text-sm">
            <div className="flex items-center gap-2">
              <ListChecks className="size-4 text-muted" aria-hidden />
              <dt className="sr-only">Soru sayısı</dt>
              <dd>{quiz.questions.length} soru</dd>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="size-4 text-muted" aria-hidden />
              <dt className="sr-only">Süre</dt>
              <dd>{quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} dakika` : 'Süre sınırı yok'}</dd>
            </div>
          </dl>

          <ul className="mt-5 list-disc space-y-1.5 pl-5 text-sm text-muted">
            <li>Bazı soruların birden fazla doğru yanıtı vardır; bunlar soruda belirtilir.</li>
            <li>Testi bitirdiğinizde her sorunun doğru yanıtı ve açıklaması gösterilir.</li>
            {quiz.timeLimitMinutes && <li>Süre dolduğunda test kendiliğinden gönderilir.</li>}
            {!user && <li>Sonucunuzun kaydedilmesi için giriş yapmalısınız; giriş yapmadan da çözebilirsiniz.</li>}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={start}>
              Teste başla
            </Button>
            {!user && (
              <ButtonLink to="/login" state={{ from: location.pathname }} variant="secondary" size="lg">
                Giriş yap
              </ButtonLink>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------- sonuç ekranı
  if (submit.data) {
    const result = submit.data;
    const byId = new Map(result.questions.map((question) => [question.id, question]));
    const passed = result.scorePercent >= 70;

    return (
      <div className="container-page max-w-3xl py-10">
        <title>{`Sonuç: ${quiz.title} — Zirve`}</title>
        {breadcrumb}

        <Card className="mt-6 p-6 sm:p-8">
          <p className="text-sm text-muted">{quiz.title}</p>
          <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
            <p className={cn('text-6xl font-bold tracking-tight tabular-nums', passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
              %{result.scorePercent}
            </p>
            <p className="pb-2 text-muted">
              {result.totalCount} sorudan <strong className="text-fg">{result.correctCount}</strong> doğru · {formatDuration(elapsedSeconds)}
            </p>
          </div>
          <ProgressBar
            value={result.scorePercent}
            className="mt-4 h-2"
            barClassName={passed ? 'bg-emerald-500' : 'bg-amber-500'}
            label="Test puanı"
          />
          <p className="mt-4 text-sm text-muted">
            {passed
              ? 'Güzel iş. Yanlış yaptığınız soruların açıklamalarını yine de okuyun.'
              : 'Aşağıdaki açıklamaları okuyun, ilgili dersleri gözden geçirin ve yeniden deneyin.'}
            {!result.saved && ' Giriş yapmadığınız için bu sonuç kaydedilmedi.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={start}>
              <RotateCcw className="size-4" aria-hidden />
              Tekrar çöz
            </Button>
            <ButtonLink to={`/tracks/${quiz.track.slug}`} variant="secondary">
              {quiz.track.title} yoluna dön
            </ButtonLink>
          </div>
        </Card>

        <h2 className="mt-10 text-lg font-semibold">Yanıtlar ve açıklamalar</h2>
        <ol className="mt-4 space-y-5">
          {quiz.questions.map((question, index) => (
            <li key={question.id}>
              <QuestionCard question={question} index={index} selected={byId.get(question.id)?.selectedOptionIds ?? []} result={byId.get(question.id)} />
            </li>
          ))}
        </ol>
      </div>
    );
  }

  // ---------------------------------------------------------------- test ekranı
  const lowOnTime = remainingSeconds !== null && remainingSeconds <= 60;

  return (
    <div className="container-page max-w-3xl pt-6 pb-28">
      <title>{`${quiz.title} — Zirve`}</title>
      {breadcrumb}
      <h1 className="mt-4 text-2xl font-bold tracking-tight">{quiz.title}</h1>

      <ol className="mt-6 space-y-5">
        {quiz.questions.map((question, index) => (
          <li key={question.id}>
            <QuestionCard question={question} index={index} selected={answers[question.id] ?? []} onToggle={(optionId) => toggle(question, optionId)} />
          </li>
        ))}
      </ol>

      {submit.isError && <ErrorNotice error={submit.error} className="mt-6" />}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 backdrop-blur-md">
        <div className="container-page flex max-w-3xl items-center gap-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                <span className="font-medium text-fg tabular-nums">{answeredCount}</span> / {quiz.questions.length} yanıtlandı
              </span>
              {remainingSeconds !== null && (
                <span
                  role="timer"
                  aria-label="Kalan süre"
                  className={cn('inline-flex items-center gap-1.5 font-mono tabular-nums', lowOnTime ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-muted')}
                >
                  <Timer className="size-4" aria-hidden />
                  {formatDuration(remainingSeconds)}
                </span>
              )}
            </div>
            <ProgressBar value={percent(answeredCount, quiz.questions.length)} className="mt-2" label="Yanıtlanan soru oranı" />
          </div>
          <Button onClick={finish} loading={submit.isPending} className="shrink-0">
            Testi bitir
          </Button>
        </div>
      </div>
    </div>
  );
}

interface QuestionCardProps {
  question: QuizQuestion;
  index: number;
  selected: number[];
  onToggle?: (optionId: number) => void;
  result?: QuestionResult;
}

function QuestionCard({ question, index, selected, onToggle, result }: QuestionCardProps) {
  const reviewing = result !== undefined;

  return (
    <Card className="p-5 sm:p-6">
      <fieldset disabled={reviewing}>
        <legend className="float-left mb-4 w-full">
          <span className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono font-semibold text-primary-text">Soru {index + 1}</span>
            <DifficultyBadge difficulty={question.difficulty} />
            {question.isMultiple && <span className="text-xs text-muted">Birden fazla doğru yanıt</span>}
            {reviewing && (
              <span className={cn('ml-auto inline-flex items-center gap-1 text-sm font-medium', result.correct ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400')}>
                {result.correct ? <CircleCheck className="size-4" aria-hidden /> : <CircleX className="size-4" aria-hidden />}
                {result.correct ? 'Doğru' : selected.length === 0 ? 'Boş' : 'Yanlış'}
              </span>
            )}
          </span>
          <Markdown size="sm" className="mt-3 text-base">
            {question.text}
          </Markdown>
        </legend>

        <div className="clear-both space-y-2">
          {question.options.map((option) => {
            const isSelected = selected.includes(option.id);
            const isCorrect = result?.correctOptionIds.includes(option.id) ?? false;

            return (
              <label
                key={option.id}
                className={cn(
                  'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors',
                  !reviewing && 'cursor-pointer hover:border-border-strong hover:bg-surface-2',
                  !reviewing && isSelected && 'border-primary bg-primary-soft',
                  !reviewing && !isSelected && 'border-border',
                  reviewing && isCorrect && 'border-emerald-500/60 bg-emerald-500/10',
                  reviewing && !isCorrect && isSelected && 'border-rose-500/60 bg-rose-500/10',
                  reviewing && !isCorrect && !isSelected && 'border-border opacity-70',
                )}
              >
                <input
                  type={question.isMultiple ? 'checkbox' : 'radio'}
                  name={`question-${question.id}`}
                  checked={isSelected}
                  onChange={() => onToggle?.(option.id)}
                  className="mt-0.5 size-4 shrink-0 accent-(--primary)"
                />
                <span className="min-w-0 flex-1">
                  <InlineMarkdown>{option.text}</InlineMarkdown>
                </span>
                {reviewing && isCorrect && <CircleCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Doğru yanıt" />}
                {reviewing && !isCorrect && isSelected && <CircleX className="size-4 shrink-0 text-rose-600 dark:text-rose-400" aria-label="Sizin yanıtınız, yanlış" />}
              </label>
            );
          })}
        </div>
      </fieldset>

      {reviewing && result.explanation && (
        <div className="mt-4 rounded-lg bg-surface-2 px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-subtle uppercase">Açıklama</p>
          <Markdown size="sm" className="mt-1">
            {result.explanation}
          </Markdown>
        </div>
      )}
    </Card>
  );
}
