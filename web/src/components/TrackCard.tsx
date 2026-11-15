import { ArrowRight, BookOpen, Clock, ListChecks } from 'lucide-react';
import { Link } from 'react-router';
import { accentBarClass } from '@/lib/accents';
import { formatMinutes, percent } from '@/lib/format';
import type { TrackSummary } from '@/lib/types';
import { TrackIcon } from './TrackIcon';
import { ProgressBar } from './ui';

export function TrackCard({ track }: { track: TrackSummary }) {
  const progress = percent(track.completedLessons, track.lessonCount);

  return (
    <Link
      to={`/tracks/${track.slug}`}
      className="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <TrackIcon icon={track.icon} accent={track.accent} />
        <ArrowRight className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" aria-hidden />
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-tight">{track.title}</h3>
      <p className="mt-1.5 line-clamp-3 flex-1 text-sm text-muted">{track.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <BookOpen className="size-3.5" aria-hidden />
          {track.lessonCount} ders
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden />
          {formatMinutes(track.totalMinutes)}
        </span>
        {track.quizCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <ListChecks className="size-3.5" aria-hidden />
            {track.quizCount} test
          </span>
        )}
      </div>

      {track.completedLessons > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted">İlerleme</span>
            <span className="font-medium">%{progress}</span>
          </div>
          <ProgressBar value={progress} barClassName={accentBarClass(track.accent)} label={`${track.title} ilerlemesi`} />
        </div>
      )}
    </Link>
  );
}
