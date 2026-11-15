import { ArrowRight, BookOpen, Code2, Flame, ListChecks } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { TrackIcon } from '@/components/TrackIcon';
import { ButtonLink, Card, PageError, PageLoading, ProgressBar } from '@/components/ui';
import { accentBarClass } from '@/lib/accents';
import { cn, formatRelative, languageLabels, percent, verdictLabels } from '@/lib/format';
import { useDashboard, useUser } from '@/lib/queries';
import type { Dashboard, ProgressCount } from '@/lib/types';

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
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted tabular-nums">
          {count.completed} / {count.total}
        </span>
      </div>
      <ProgressBar value={percent(count.completed, count.total)} barClassName={barClassName} label={`${label} problemler`} />
    </div>
  );
}

const heatLevels = ['bg-surface-2', 'bg-emerald-500/30', 'bg-emerald-500/55', 'bg-emerald-500/80', 'bg-emerald-500'];
const dayFormat = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

/** Son 16 haftanın etkinlik ısı haritası: her sütun bir hafta, her hücre bir gün. */
function ActivityHeatmap({ activity }: { activity: Dashboard['activity'] }) {
  if (activity.length === 0) return null;

  // Sütunlar pazartesiyle başlasın diye ilk haftanın başına boş hücre eklenir.
  const firstWeekday = (new Date(`${activity[0].date}T00:00:00Z`).getUTCDay() + 6) % 7;
  const cells: (Dashboard['activity'][number] | null)[] = [...Array.from({ length: firstWeekday }, () => null), ...activity];
  const total = activity.reduce((sum, day) => sum + day.count, 0);
  const activeDays = activity.filter((day) => day.count > 0).length;

  return (
    <div>
      <div className="scrollbar-thin overflow-x-auto pb-1">
        <ul className="grid w-max grid-flow-col grid-rows-7 gap-1" aria-label="Son 16 haftanın günlük etkinliği">
          {cells.map((day, index) =>
            day === null ? (
              <li key={`empty-${index}`} aria-hidden className="size-3.5" />
            ) : (
              <li
                key={day.date}
                title={`${dayFormat.format(new Date(`${day.date}T00:00:00Z`))}: ${day.count} etkinlik`}
                className={cn('size-3.5 rounded-[3px]', heatLevels[Math.min(4, day.count === 0 ? 0 : Math.ceil(day.count / 2))])}
              >
                <span className="sr-only">
                  {dayFormat.format(new Date(`${day.date}T00:00:00Z`))}: {day.count} etkinlik
                </span>
              </li>
            ),
          )}
        </ul>
      </div>
      <p className="mt-3 text-sm text-muted">
        Son 16 haftada <strong className="text-fg">{activeDays}</strong> gün çalıştınız, toplam{' '}
        <strong className="text-fg">{total}</strong> etkinlik (ders, test, gönderim).
      </p>
    </div>
  );
}

export default function DashboardPage() {
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
      <title>Panelim — Zirve</title>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">Panelim</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Merhaba, {user.displayName.split(' ')[0]}</h1>
        </div>
        {data.continue ? (
          <ButtonLink to={`/tracks/${data.continue.trackSlug}/${data.continue.lessonSlug}`}>
            Devam et: {data.continue.lessonTitle}
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        ) : (
          <ButtonLink to="/tracks">
            {isNew ? 'İlk dersinize başlayın' : 'Yeni bir yol seçin'}
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        )}
      </header>

      {isNew && (
        <Card className="mt-6 border-primary/40 bg-primary-soft p-5">
          <p className="font-medium">Hoş geldiniz!</p>
          <p className="mt-1 text-sm text-muted">
            Nereden başlayacağınızı bilmiyorsanız{' '}
            <Link to="/tracks/mulakat" className="font-medium text-primary-text underline underline-offset-2">
              Mülakat Hazırlığı
            </Link>{' '}
            yolundaki çalışma planı iyi bir ilk adımdır.
          </p>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Flame className={cn('size-4', data.streakDays > 0 && 'text-amber-500')} aria-hidden />}
          label="Çalışma serisi"
          value={
            <>
              {data.streakDays} <span className="text-base font-medium text-muted">gün</span>
            </>
          }
          detail={data.streakDays > 0 ? 'Seriyi sürdürmek için bugün de çalışın.' : 'Bugün bir ders ya da problemle başlayın.'}
        />
        <StatCard
          icon={<BookOpen className="size-4" aria-hidden />}
          label="Tamamlanan ders"
          value={
            <>
              {data.lessons.completed} <span className="text-base font-medium text-muted">/ {data.lessons.total}</span>
            </>
          }
          detail={<ProgressBar value={percent(data.lessons.completed, data.lessons.total)} label="Tamamlanan ders oranı" />}
        />
        <StatCard
          icon={<Code2 className="size-4" aria-hidden />}
          label="Çözülen problem"
          value={
            <>
              {data.problems.solved} <span className="text-base font-medium text-muted">/ {data.problems.total}</span>
            </>
          }
          detail={<ProgressBar value={percent(data.problems.solved, data.problems.total)} barClassName="bg-emerald-500" label="Çözülen problem oranı" />}
        />
        <StatCard
          icon={<ListChecks className="size-4" aria-hidden />}
          label="Test ortalaması"
          value={data.quizzes.averageScore === undefined ? '—' : `%${data.quizzes.averageScore}`}
          detail={`${data.quizzes.distinctQuizzes} / ${data.quizzes.totalQuizzes} test çözüldü`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold">Etkinlik</h2>
          <div className="mt-4">
            <ActivityHeatmap activity={data.activity} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Zorluğa göre problemler</h2>
          <div className="mt-4 space-y-4">
            <DifficultyRow label="Kolay" count={data.problems.easy} barClassName="bg-emerald-500" />
            <DifficultyRow label="Orta" count={data.problems.medium} barClassName="bg-amber-500" />
            <DifficultyRow label="Zor" count={data.problems.hard} barClassName="bg-rose-500" />
          </div>
          <ButtonLink to="/problems?status=todo" variant="secondary" size="sm" className="mt-5 w-full">
            Çözülmemiş problemler
          </ButtonLink>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">Yollardaki ilerleme</h2>
          {startedTracks.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Henüz bir derse başlamadınız.{' '}
              <Link to="/tracks" className="font-medium text-primary-text hover:underline">
                Öğrenme yollarına göz atın.
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
                      <ProgressBar value={percent(track.completed, track.total)} barClassName={accentBarClass(track.accent)} label={`${track.title} ilerlemesi`} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Son gönderimler</h2>
          {data.recentSubmissions.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Henüz gönderim yok.{' '}
              <Link to="/problems" className="font-medium text-primary-text hover:underline">
                İlk probleminizi çözün.
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
                    {verdictLabels[submission.verdict]}
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
