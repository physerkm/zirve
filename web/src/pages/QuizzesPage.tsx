import { ListChecks, Timer } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState, LevelBadge, PageError, PageHeader, PageLoading } from '@/components/ui';
import { useQuizzes } from '@/lib/queries';
import type { QuizSummary } from '@/lib/types';

export default function QuizzesPage() {
  const quizzes = useQuizzes();

  if (quizzes.isPending) return <PageLoading />;
  if (quizzes.isError) return <PageError error={quizzes.error} onRetry={() => quizzes.refetch()} />;

  // Sunucu testleri yol sırasına göre döndürür; aynı yolun testlerini bir araya topluyoruz.
  const groups = new Map<string, { title: string; quizzes: QuizSummary[] }>();
  for (const quiz of quizzes.data) {
    const group = groups.get(quiz.track.slug) ?? { title: quiz.track.title, quizzes: [] };
    group.quizzes.push(quiz);
    groups.set(quiz.track.slug, group);
  }

  return (
    <div className="container-page py-10">
      <title>Testler — Zirve</title>
      <PageHeader
        title="Testler"
        description="Çoktan seçmeli, açıklamalı testler. Yanıtlar sunucuda değerlendirilir; her sorunun neden doğru ya da yanlış olduğu anlatılır."
      />

      {groups.size === 0 && <EmptyState title="Henüz test yok" icon={<ListChecks className="size-8" />} />}

      <div className="mt-8 space-y-10">
        {[...groups.entries()].map(([slug, group]) => (
          <section key={slug} aria-labelledby={`quiz-group-${slug}`}>
            <h2 id={`quiz-group-${slug}`} className="text-lg font-semibold">
              <Link to={`/tracks/${slug}`} className="hover:text-primary-text">
                {group.title}
              </Link>
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.quizzes.map((quiz) => (
                <li key={quiz.slug}>
                  <Link
                    to={`/quizzes/${quiz.slug}`}
                    className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-border-strong"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold">{quiz.title}</h3>
                      <LevelBadge level={quiz.level} />
                    </div>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">{quiz.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <ListChecks className="size-3.5" aria-hidden />
                        {quiz.questionCount} soru
                      </span>
                      {quiz.timeLimitMinutes && (
                        <span className="inline-flex items-center gap-1">
                          <Timer className="size-3.5" aria-hidden />
                          {quiz.timeLimitMinutes} dk
                        </span>
                      )}
                      {quiz.bestScore !== undefined && (
                        <span className="ml-auto font-medium text-emerald-700 dark:text-emerald-400">En iyi: %{quiz.bestScore}</span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
