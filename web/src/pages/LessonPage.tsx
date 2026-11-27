import { ArrowLeft, ArrowRight, ChevronRight, CircleCheck, Clock } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { Markdown } from '@/components/Markdown';
import { Button, ButtonLink, ErrorNotice, LevelBadge, PageError, PageLoading, ProgressBar } from '@/components/ui';
import { defineMessages, useMessages } from '@/i18n/messages';
import { cn, percent } from '@/lib/format';
import { useLesson, useSetLessonProgress, useUser } from '@/lib/queries';
import { buildToc } from '@/lib/toc';

const messages = defineMessages({
  tr: {
    breadcrumb: 'Konum',
    tracks: 'Öğrenme Yolları',
    readingTime: (minutes: number) => `${minutes} dk okuma`,
    lessonPosition: (position: number, total: number) => `Ders ${position} / ${total}`,
    completed: 'Tamamlandı',
    youCompleted: 'Bu dersi tamamladınız.',
    didYouFinish: 'Bu dersi bitirdiniz mi?',
    progressNote: 'İlerlemeniz panelinize ve yol sayfasına yansır.',
    markIncomplete: 'Tamamlanmadı olarak işaretle',
    markComplete: 'Tamamlandı olarak işaretle',
    signInToSave: 'İlerlemenizi kaydetmek için giriş yapın.',
    signIn: 'Giriş yap',
    lessonNav: 'Dersler arası gezinme',
    previousLesson: 'Önceki ders',
    nextLesson: 'Sonraki ders',
    endOfTrack: 'Yolun sonu',
    backToTrack: (track: string) => `${track} yoluna dön`,
    percent: (value: number) => `%${value}`,
    trackPosition: 'Yol içindeki konum',
    inThisLesson: 'Bu derste',
  },
  en: {
    breadcrumb: 'Breadcrumb',
    tracks: 'Learning Tracks',
    readingTime: (minutes: number) => `${minutes} min read`,
    lessonPosition: (position: number, total: number) => `Lesson ${position} of ${total}`,
    completed: 'Completed',
    youCompleted: 'You have completed this lesson.',
    didYouFinish: 'Have you finished this lesson?',
    progressNote: 'Your progress shows up on your dashboard and the track page.',
    markIncomplete: 'Mark as not completed',
    markComplete: 'Mark as completed',
    signInToSave: 'Sign in to save your progress.',
    signIn: 'Sign in',
    lessonNav: 'Lesson navigation',
    previousLesson: 'Previous lesson',
    nextLesson: 'Next lesson',
    endOfTrack: 'End of track',
    backToTrack: (track: string) => `Back to ${track}`,
    percent: (value: number) => `${value}%`,
    trackPosition: 'Position in track',
    inThisLesson: 'In this lesson',
  },
});

export default function LessonPage() {
  const t = useMessages(messages);
  const { trackSlug = '', lessonSlug = '' } = useParams();
  const location = useLocation();
  const lesson = useLesson(trackSlug, lessonSlug);
  const progress = useSetLessonProgress(trackSlug, lessonSlug);
  const { user } = useUser();
  const toc = useMemo(() => buildToc(lesson.data?.content ?? ''), [lesson.data?.content]);

  if (lesson.isPending) return <PageLoading />;
  if (lesson.isError) return <PageError error={lesson.error} onRetry={() => lesson.refetch()} />;

  const { data } = lesson;
  const trackPath = `/tracks/${data.track.slug}`;

  return (
    <div className="container-page py-8">
      <title>{`${data.title} — ${data.track.title} — Zirve`}</title>

      <nav aria-label={t.breadcrumb} className="flex flex-wrap items-center gap-1 text-sm text-muted">
        <Link to="/tracks" className="hover:text-fg">
          {t.tracks}
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link to={trackPath} className="hover:text-fg">
          {data.track.title}
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span>{data.module.title}</span>
      </nav>

      <div className="mt-6 grid gap-12 xl:grid-cols-[minmax(0,1fr)_16rem]">
        <article className="mx-auto w-full max-w-3xl min-w-0 xl:mx-0">
          <header className="border-b border-border pb-6">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <LevelBadge level={data.level} />
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden />
                {t.readingTime(data.minutes)}
              </span>
              <span>{t.lessonPosition(data.position, data.total)}</span>
              {data.completed && (
                <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                  <CircleCheck className="size-4" aria-hidden />
                  {t.completed}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{data.title}</h1>
            <p className="mt-3 text-lg text-muted text-pretty">{data.summary}</p>
          </header>

          <Markdown playground className="mt-8">
            {data.content}
          </Markdown>

          <footer className="mt-12 border-t border-border pt-8">
            <div className="rounded-xl border border-border bg-surface p-5">
              {user ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{data.completed ? t.youCompleted : t.didYouFinish}</p>
                    <p className="text-sm text-muted">{t.progressNote}</p>
                  </div>
                  <Button
                    variant={data.completed ? 'secondary' : 'success'}
                    loading={progress.isPending}
                    onClick={() => progress.mutate(!data.completed)}
                    className="shrink-0"
                  >
                    {!progress.isPending && <CircleCheck className="size-4" aria-hidden />}
                    {data.completed ? t.markIncomplete : t.markComplete}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted">{t.signInToSave}</p>
                  <ButtonLink to="/login" state={{ from: location.pathname }} variant="secondary" className="shrink-0">
                    {t.signIn}
                  </ButtonLink>
                </div>
              )}
              {progress.isError && <ErrorNotice error={progress.error} className="mt-4" />}
            </div>

            <nav aria-label={t.lessonNav} className="mt-6 grid gap-3 sm:grid-cols-2">
              {data.previous ? (
                <Link
                  to={`${trackPath}/${data.previous.slug}`}
                  className="group rounded-xl border border-border p-4 transition-colors hover:border-border-strong hover:bg-surface"
                >
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <ArrowLeft className="size-3.5" aria-hidden />
                    {t.previousLesson}
                  </span>
                  <span className="mt-1 block font-medium">{data.previous.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {data.next ? (
                <Link
                  to={`${trackPath}/${data.next.slug}`}
                  className="group rounded-xl border border-border p-4 text-right transition-colors hover:border-border-strong hover:bg-surface"
                >
                  <span className="flex items-center justify-end gap-1 text-xs text-muted">
                    {t.nextLesson}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                  <span className="mt-1 block font-medium">{data.next.title}</span>
                </Link>
              ) : (
                <Link
                  to={trackPath}
                  className="rounded-xl border border-border p-4 text-right transition-colors hover:border-border-strong hover:bg-surface"
                >
                  <span className="text-xs text-muted">{t.endOfTrack}</span>
                  <span className="mt-1 block font-medium">{t.backToTrack(data.track.title)}</span>
                </Link>
              )}
            </nav>
          </footer>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-6">
            <div>
              <div className="mb-2 flex justify-between text-xs text-muted">
                <span>{data.track.title}</span>
                <span className="tabular-nums">{t.percent(percent(data.position, data.total))}</span>
              </div>
              <ProgressBar value={percent(data.position, data.total)} label={t.trackPosition} />
            </div>

            {toc.length > 1 && (
              <nav aria-label={t.inThisLesson}>
                <h2 className="text-xs font-semibold tracking-wide text-subtle uppercase">{t.inThisLesson}</h2>
                <ul className="mt-3 space-y-2 border-l border-border text-sm">
                  {toc.map((entry) => (
                    <li key={entry.id}>
                      <a
                        href={`#${entry.id}`}
                        className={cn(
                          '-ml-px block border-l border-transparent text-muted transition-colors hover:border-primary hover:text-fg',
                          entry.depth === 2 ? 'pl-4' : 'pl-7 text-[13px]',
                        )}
                      >
                        {entry.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
