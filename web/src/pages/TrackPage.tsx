import { ChevronRight, Circle, CircleCheck, Clock, ListChecks, Timer } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { TrackIcon } from '@/components/TrackIcon';
import { ButtonLink, Card, LevelBadge, PageError, PageLoading, ProgressBar } from '@/components/ui';
import { defineMessages, useMessages } from '@/i18n/messages';
import { accentBarClass } from '@/lib/accents';
import { formatMinutes, percent } from '@/lib/format';
import { useTrack } from '@/lib/queries';

const messages = defineMessages({
  tr: {
    breadcrumb: 'Konum',
    tracks: 'Öğrenme Yolları',
    lessons: (count: number) => `${count} ders`,
    quizzes: (count: number) => `${count} test`,
    progress: 'İlerleme',
    progressLabel: (track: string) => `${track} ilerlemesi`,
    start: 'Başla',
    review: 'Baştan gözden geçir',
    resume: 'Devam et',
    completed: 'Tamamlandı',
    notCompleted: 'Tamamlanmadı',
    minutes: (minutes: number) => `${minutes} dk`,
    quizzesTitle: 'Testler',
    quizzesIntro: 'Öğrendiklerinizi sınayın.',
    noQuizzes: 'Bu yol için henüz test yok.',
    questions: (count: number) => `${count} soru`,
    bestScore: (score: number) => `En iyi: %${score}`,
  },
  en: {
    breadcrumb: 'Breadcrumb',
    tracks: 'Learning Tracks',
    lessons: (count: number) => (count === 1 ? '1 lesson' : `${count} lessons`),
    quizzes: (count: number) => (count === 1 ? '1 quiz' : `${count} quizzes`),
    progress: 'Progress',
    progressLabel: (track: string) => `${track} progress`,
    start: 'Start',
    review: 'Review from the start',
    resume: 'Continue',
    completed: 'Completed',
    notCompleted: 'Not completed',
    minutes: (minutes: number) => `${minutes} min`,
    quizzesTitle: 'Quizzes',
    quizzesIntro: 'Test what you have learned.',
    noQuizzes: 'No quizzes for this track yet.',
    questions: (count: number) => (count === 1 ? '1 question' : `${count} questions`),
    bestScore: (score: number) => `Best: ${score}%`,
  },
});

export default function TrackPage() {
  const t = useMessages(messages);
  const { trackSlug = '' } = useParams();
  const track = useTrack(trackSlug);

  if (track.isPending) return <PageLoading />;
  if (track.isError) return <PageError error={track.error} onRetry={() => track.refetch()} />;

  const { data } = track;
  const lessons = data.modules.flatMap((module) => module.lessons);
  const completed = lessons.filter((lesson) => lesson.completed).length;
  const totalMinutes = lessons.reduce((total, lesson) => total + lesson.minutes, 0);
  const nextLesson = lessons.find((lesson) => !lesson.completed) ?? lessons[0];
  const lessonNumbers = new Map(lessons.map((lesson, index) => [lesson.slug, index + 1]));

  return (
    <div className="container-page py-10">
      <title>{`${data.title} — Zirve`}</title>

      <nav aria-label={t.breadcrumb} className="flex items-center gap-1 text-sm text-muted">
        <Link to="/tracks" className="hover:text-fg">
          {t.tracks}
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-fg">{data.title}</span>
      </nav>

      <header className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-5">
          <TrackIcon icon={data.icon} accent={data.accent} size="lg" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
            <p className="mt-2 max-w-2xl text-muted text-pretty">{data.description}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span>{t.lessons(lessons.length)}</span>
              <span>{formatMinutes(totalMinutes)}</span>
              {data.quizzes.length > 0 && <span>{t.quizzes(data.quizzes.length)}</span>}
            </div>
          </div>
        </div>

        <Card className="w-full shrink-0 p-5 lg:w-72">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted">{t.progress}</span>
            <span className="text-sm font-medium tabular-nums">
              {completed} / {lessons.length}
            </span>
          </div>
          <ProgressBar
            value={percent(completed, lessons.length)}
            className="mt-2"
            barClassName={accentBarClass(data.accent)}
            label={t.progressLabel(data.title)}
          />
          {nextLesson && (
            <ButtonLink to={`/tracks/${data.slug}/${nextLesson.slug}`} className="mt-4 w-full">
              {completed === 0 ? t.start : completed === lessons.length ? t.review : t.resume}
            </ButtonLink>
          )}
        </Card>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          {data.modules.map((module) => (
            <section key={module.slug} aria-labelledby={`module-${module.slug}`}>
              <h2 id={`module-${module.slug}`} className="text-lg font-semibold">
                {module.title}
              </h2>
              {module.description && <p className="mt-1 text-sm text-muted">{module.description}</p>}

              <ol className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                {module.lessons.map((lesson) => {
                  const lessonNumber = lessonNumbers.get(lesson.slug) ?? 0;

                  return (
                    <li key={lesson.slug}>
                      <Link
                        to={`/tracks/${data.slug}/${lesson.slug}`}
                        className="group flex items-start gap-4 px-4 py-4 transition-colors hover:bg-surface-2 sm:px-5"
                      >
                        {lesson.completed ? (
                          <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label={t.completed} />
                        ) : (
                          <Circle className="mt-0.5 size-5 shrink-0 text-border-strong" aria-label={t.notCompleted} />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">
                            <span className="mr-2 font-mono text-xs text-subtle tabular-nums">{String(lessonNumber).padStart(2, '0')}</span>
                            {lesson.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted">{lesson.summary}</p>
                        </div>
                        <div className="hidden shrink-0 items-center gap-3 sm:flex">
                          <LevelBadge level={lesson.level} />
                          <span className="inline-flex w-14 items-center justify-end gap-1 text-xs text-muted tabular-nums">
                            <Clock className="size-3.5" aria-hidden />
                            {t.minutes(lesson.minutes)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>

        <aside aria-labelledby="track-quizzes">
          <h2 id="track-quizzes" className="text-lg font-semibold">
            {t.quizzesTitle}
          </h2>
          <p className="mt-1 text-sm text-muted">{t.quizzesIntro}</p>

          {data.quizzes.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted">{t.noQuizzes}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.quizzes.map((quiz) => (
                <li key={quiz.slug}>
                  <Link
                    to={`/quizzes/${quiz.slug}`}
                    className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong"
                  >
                    <p className="font-medium">{quiz.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <ListChecks className="size-3.5" aria-hidden />
                        {t.questions(quiz.questionCount)}
                      </span>
                      {quiz.timeLimitMinutes && (
                        <span className="inline-flex items-center gap-1">
                          <Timer className="size-3.5" aria-hidden />
                          {t.minutes(quiz.timeLimitMinutes)}
                        </span>
                      )}
                      {quiz.bestScore !== undefined && (
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">{t.bestScore(quiz.bestScore)}</span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
