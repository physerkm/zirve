import { ArrowRight, BookOpen, Code2, Flame, ListChecks } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { TrackIcon } from '@/components/TrackIcon';
import { ButtonLink, Card, PageError, PageLoading, ProgressBar } from '@/components/ui';
import { intlLocale, useLocale } from '@/i18n/locale';
import { defineMessages, useMessages } from '@/i18n/messages';
import { accentBarClass } from '@/lib/accents';
import { cn, difficultyLabel, formatRelative, languageLabels, percent, verdictLabel } from '@/lib/format';
import { useDashboard, useUser } from '@/lib/queries';
import type { Dashboard, ProgressCount } from '@/lib/types';

const messages = defineMessages({
  tr: {
    pageTitle: 'Panelim — Zirve',
    eyebrow: 'Panelim',
    greeting: (name: string) => `Merhaba, ${name}`,
    continueLesson: (lesson: string) => `Devam et: ${lesson}`,
    startFirstLesson: 'İlk dersinize başlayın',
    pickTrack: 'Yeni bir yol seçin',
    welcome: 'Hoş geldiniz!',
    welcomeText: (link: (text: string) => ReactNode) => (
      <>
        Nereden başlayacağınızı bilmiyorsanız {link('Mülakat Hazırlığı')} yolundaki çalışma planı iyi bir ilk adımdır.
      </>
    ),
    stats: {
      streak: 'Çalışma serisi',
      days: (_n: number) => 'gün',
      streakActive: 'Seriyi sürdürmek için bugün de çalışın.',
      streakNone: 'Bugün bir ders ya da problemle başlayın.',
      lessons: 'Tamamlanan ders',
      lessonsLabel: 'Tamamlanan ders oranı',
      problems: 'Çözülen problem',
      problemsLabel: 'Çözülen problem oranı',
      quizAverage: 'Test ortalaması',
      score: (n: number) => `%${n}`,
      quizzesTaken: (done: number, total: number) => `${done} / ${total} test çözüldü`,
    },
    activity: {
      title: 'Etkinlik',
      gridLabel: 'Son 16 haftanın günlük etkinliği',
      day: (date: string, count: number) => `${date}: ${count} etkinlik`,
      summary: (days: number, total: number, strong: (n: number) => ReactNode) => (
        <>
          Son 16 haftada {strong(days)} gün çalıştınız, toplam {strong(total)} etkinlik (ders, test, gönderim).
        </>
      ),
    },
    difficulty: {
      title: 'Zorluğa göre problemler',
      rowLabel: (difficulty: string) => `${difficulty} problemler`,
      unsolved: 'Çözülmemiş problemler',
    },
    tracks: {
      title: 'Yollardaki ilerleme',
      empty: 'Henüz bir derse başlamadınız.',
      browse: 'Öğrenme yollarına göz atın.',
      progressLabel: (track: string) => `${track} ilerlemesi`,
    },
    submissions: {
      title: 'Son gönderimler',
      empty: 'Henüz gönderim yok.',
      solveFirst: 'İlk probleminizi çözün.',
    },
  },
  en: {
    pageTitle: 'My dashboard — Zirve',
    eyebrow: 'My dashboard',
    greeting: (name: string) => `Hi, ${name}`,
    continueLesson: (lesson: string) => `Continue: ${lesson}`,
    startFirstLesson: 'Start your first lesson',
    pickTrack: 'Pick a new track',
    welcome: 'Welcome!',
    welcomeText: (link: (text: string) => ReactNode) => (
      <>Not sure where to start? The study plan in the {link('Interview Preparation')} track is a good first step.</>
    ),
    stats: {
      streak: 'Study streak',
      days: (n: number) => (n === 1 ? 'day' : 'days'),
      streakActive: 'Study today to keep your streak going.',
      streakNone: 'Start today with a lesson or a problem.',
      lessons: 'Lessons completed',
      lessonsLabel: 'Share of lessons completed',
      problems: 'Problems solved',
      problemsLabel: 'Share of problems solved',
      quizAverage: 'Quiz average',
      score: (n: number) => `${n}%`,
      quizzesTaken: (done: number, total: number) => `${done} / ${total} quizzes taken`,
    },
    activity: {
      title: 'Activity',
      gridLabel: 'Daily activity over the last 16 weeks',
      day: (date: string, count: number) => `${date}: ${count} ${count === 1 ? 'activity' : 'activities'}`,
      summary: (days: number, total: number, strong: (n: number) => ReactNode) => (
        <>
          In the last 16 weeks you studied on {strong(days)} {days === 1 ? 'day' : 'days'}, with {strong(total)}{' '}
          {total === 1 ? 'activity' : 'activities'} in total (lessons, quizzes, submissions).
        </>
      ),
    },
    difficulty: {
      title: 'Problems by difficulty',
      rowLabel: (difficulty: string) => `${difficulty} problems`,
      unsolved: 'Unsolved problems',
    },
    tracks: {
      title: 'Track progress',
      empty: "You haven't started a lesson yet.",
      browse: 'Browse the learning tracks.',
      progressLabel: (track: string) => `${track} progress`,
    },
    submissions: {
      title: 'Recent submissions',
      empty: 'No submissions yet.',
      solveFirst: 'Solve your first problem.',
    },
  },
});

function StatCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm text-muted">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      {detail && <div className="mt-2 text-sm text-muted">{detail}</div>}
    </Card>
  );
}

function DifficultyRow({ label, count, barClassName }: { label: string; count: ProgressCount; barClassName: string }) {
  const t = useMessages(messages);

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted tabular-nums">
          {count.completed} / {count.total}
        </span>
      </div>
      <ProgressBar value={percent(count.completed, count.total)} barClassName={barClassName} label={t.difficulty.rowLabel(label)} />
    </div>
  );
}

const heatLevels = ['bg-surface-2', 'bg-emerald-500/30', 'bg-emerald-500/55', 'bg-emerald-500/80', 'bg-emerald-500'];

/** Son 16 haftanın etkinlik ısı haritası: her sütun bir hafta, her hücre bir gün. */
function ActivityHeatmap({ activity }: { activity: Dashboard['activity'] }) {
  const locale = useLocale();
  const t = useMessages(messages).activity;

  if (activity.length === 0) return null;

  const dayFormat = new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'long', year: 'numeric' });

  // Sütunlar pazartesiyle başlasın diye ilk haftanın başına boş hücre eklenir.
  const firstWeekday = (new Date(`${activity[0].date}T00:00:00Z`).getUTCDay() + 6) % 7;
  const cells: (Dashboard['activity'][number] | null)[] = [...Array.from({ length: firstWeekday }, () => null), ...activity];
  const total = activity.reduce((sum, day) => sum + day.count, 0);
  const activeDays = activity.filter((day) => day.count > 0).length;

  return (
    <div>
      <div className="scrollbar-thin overflow-x-auto pb-1">
        <ul className="grid w-max grid-flow-col grid-rows-7 gap-1" aria-label={t.gridLabel}>
          {cells.map((day, index) =>
            day === null ? (
              <li key={`empty-${index}`} aria-hidden className="size-3.5" />
            ) : (
              <li
                key={day.date}
                title={t.day(dayFormat.format(new Date(`${day.date}T00:00:00Z`)), day.count)}
                className={cn('size-3.5 rounded-[3px]', heatLevels[Math.min(4, day.count === 0 ? 0 : Math.ceil(day.count / 2))])}
              >
                <span className="sr-only">{t.day(dayFormat.format(new Date(`${day.date}T00:00:00Z`)), day.count)}</span>
              </li>
            ),
          )}
        </ul>
      </div>
      <p className="mt-3 text-sm text-muted">{t.summary(activeDays, total, (n) => <strong className="text-fg">{n}</strong>)}</p>
    </div>
  );
}

export default function DashboardPage() {
  const t = useMessages(messages);
  const { user, isLoading } = useUser();
  const location = useLocation();
  const dashboard = useDashboard(Boolean(user));

  if (isLoading) return <PageLoading />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (dashboard.isPending) return <PageLoading />;
  if (dashboard.isError) return <PageError error={dashboard.error} onRetry={() => dashboard.refetch()} />;

  const { data } = dashboard;
  const startedTracks = data.tracks.filter((track) => track.completed > 0);
  const isNew = data.lessons.completed === 0 && data.problems.solved === 0 && data.quizzes.attempts === 0;

  return (
    <div className="container-page py-10">
      <title>{t.pageTitle}</title>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">{t.eyebrow}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{t.greeting(user.displayName.split(' ')[0])}</h1>
        </div>
        {data.continue ? (
          <ButtonLink to={`/tracks/${data.continue.trackSlug}/${data.continue.lessonSlug}`}>
            {t.continueLesson(data.continue.lessonTitle)}
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        ) : (
          <ButtonLink to="/tracks">
            {isNew ? t.startFirstLesson : t.pickTrack}
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        )}
      </header>

      {isNew && (
        <Card className="mt-6 border-primary/40 bg-primary-soft p-5">
          <p className="font-medium">{t.welcome}</p>
          <p className="mt-1 text-sm text-muted">
            {t.welcomeText((text) => (
              <Link to="/tracks/mulakat" className="font-medium text-primary-text underline underline-offset-2">
                {text}
              </Link>
            ))}
          </p>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Flame className={cn('size-4', data.streakDays > 0 && 'text-amber-500')} aria-hidden />}
          label={t.stats.streak}
          value={
            <>
              {data.streakDays} <span className="text-base font-medium text-muted">{t.stats.days(data.streakDays)}</span>
            </>
          }
          detail={data.streakDays > 0 ? t.stats.streakActive : t.stats.streakNone}
        />
        <StatCard
          icon={<BookOpen className="size-4" aria-hidden />}
          label={t.stats.lessons}
          value={
            <>
              {data.lessons.completed} <span className="text-base font-medium text-muted">/ {data.lessons.total}</span>
            </>
          }
          detail={<ProgressBar value={percent(data.lessons.completed, data.lessons.total)} label={t.stats.lessonsLabel} />}
        />
        <StatCard
          icon={<Code2 className="size-4" aria-hidden />}
          label={t.stats.problems}
          value={
            <>
              {data.problems.solved} <span className="text-base font-medium text-muted">/ {data.problems.total}</span>
            </>
          }
          detail={<ProgressBar value={percent(data.problems.solved, data.problems.total)} barClassName="bg-emerald-500" label={t.stats.problemsLabel} />}
        />
        <StatCard
          icon={<ListChecks className="size-4" aria-hidden />}
          label={t.stats.quizAverage}
          value={data.quizzes.averageScore === undefined ? '—' : t.stats.score(data.quizzes.averageScore)}
          detail={t.stats.quizzesTaken(data.quizzes.distinctQuizzes, data.quizzes.totalQuizzes)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold">{t.activity.title}</h2>
          <div className="mt-4">
            <ActivityHeatmap activity={data.activity} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">{t.difficulty.title}</h2>
          <div className="mt-4 space-y-4">
            <DifficultyRow label={difficultyLabel('easy')} count={data.problems.easy} barClassName="bg-emerald-500" />
            <DifficultyRow label={difficultyLabel('medium')} count={data.problems.medium} barClassName="bg-amber-500" />
            <DifficultyRow label={difficultyLabel('hard')} count={data.problems.hard} barClassName="bg-rose-500" />
          </div>
          <ButtonLink to="/problems?status=todo" variant="secondary" size="sm" className="mt-5 w-full">
            {t.difficulty.unsolved}
          </ButtonLink>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">{t.tracks.title}</h2>
          {startedTracks.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              {t.tracks.empty}{' '}
              <Link to="/tracks" className="font-medium text-primary-text hover:underline">
                {t.tracks.browse}
              </Link>
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {startedTracks.map((track) => (
                <li key={track.slug}>
                  <Link to={`/tracks/${track.slug}`} className="group flex items-center gap-3">
                    <TrackIcon icon={track.icon} accent={track.accent} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="truncate font-medium group-hover:text-primary-text">{track.title}</span>
                        <span className="text-muted tabular-nums">
                          {track.completed} / {track.total}
                        </span>
                      </div>
                      <ProgressBar value={percent(track.completed, track.total)} barClassName={accentBarClass(track.accent)} label={t.tracks.progressLabel(track.title)} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">{t.submissions.title}</h2>
          {data.recentSubmissions.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              {t.submissions.empty}{' '}
              <Link to="/problems" className="font-medium text-primary-text hover:underline">
                {t.submissions.solveFirst}
              </Link>
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {data.recentSubmissions.map((submission) => (
                <li key={submission.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span
                    className={cn('size-2 shrink-0 rounded-full', submission.verdict === 'accepted' ? 'bg-emerald-500' : 'bg-rose-500')}
                    aria-hidden
                  />
                  <Link to={`/problems/${submission.problemSlug}`} className="min-w-0 flex-1 truncate font-medium hover:text-primary-text">
                    {submission.problemTitle}
                  </Link>
                  <span className="hidden text-xs text-muted sm:inline">{languageLabels[submission.language]}</span>
                  <span
                    className={cn(
                      'shrink-0 text-xs',
                      submission.verdict === 'accepted' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400',
                    )}
                  >
                    {verdictLabel(submission.verdict)}
                  </span>
                  <span className="w-20 shrink-0 text-right text-xs text-muted">{formatRelative(submission.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
