import { CircleCheck, CircleDot, Search } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Card, DifficultyBadge, EmptyState, PageError, PageHeader, PageLoading, ProgressBar } from '@/components/ui';
import { cn, difficultyLabels, percent, tagLabel } from '@/lib/format';
import { useProblems, useUser } from '@/lib/queries';
import type { Difficulty, ProblemListItem } from '@/lib/types';

const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
const statuses = [
  { value: 'todo', label: 'Çözülmedi' },
  { value: 'attempted', label: 'Denendi' },
  { value: 'solved', label: 'Çözüldü' },
];

const selectClass =
  'h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25';

function StatusIcon({ status }: { status: ProblemListItem['status'] }) {
  if (status === 'solved') return <CircleCheck className="size-4.5 text-emerald-600 dark:text-emerald-400" aria-label="Çözüldü" />;
  if (status === 'attempted') return <CircleDot className="size-4.5 text-amber-600 dark:text-amber-400" aria-label="Denendi" />;
  return <span className="block size-4.5" aria-label="Çözülmedi" />;
}

export default function ProblemsPage() {
  const problems = useProblems();
  const { user } = useUser();
  // Süzgeçler adres çubuğunda tutulur: bağlantı paylaşılabilir, geri tuşu beklendiği gibi çalışır.
  const [params, setParams] = useSearchParams();

  const query = params.get('q') ?? '';
  const difficulty = params.get('difficulty') ?? '';
  const tag = params.get('tag') ?? '';
  const status = params.get('status') ?? '';

  const setFilter = (key: string, value: string) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  };

  const all = problems.data;

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const problem of all ?? []) {
      for (const item of problem.tags) counts.set(item, (counts.get(item) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => tagLabel(a[0]).localeCompare(tagLabel(b[0]), 'tr'));
  }, [all]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr');

    return (all ?? []).filter((problem) => {
      if (difficulty && problem.difficulty !== difficulty) return false;
      if (tag && !problem.tags.includes(tag)) return false;
      if (status && (problem.status ?? 'todo') !== status) return false;
      if (needle && !problem.title.toLocaleLowerCase('tr').includes(needle) && String(problem.number) !== needle) return false;
      return true;
    });
  }, [all, query, difficulty, tag, status]);

  if (problems.isPending) return <PageLoading />;
  if (problems.isError) return <PageError error={problems.error} onRetry={() => problems.refetch()} />;

  const solved = problems.data.filter((problem) => problem.status === 'solved').length;
  const hasFilters = Boolean(query || difficulty || tag || status);

  return (
    <div className="container-page py-10">
      <title>Problemler — Zirve</title>
      <PageHeader
        title="Problemler"
        description="Mülakatlarda en sık karşılaşılan kalıpları kapsayan kodlama problemleri. C#, JavaScript ya da TypeScript ile çözün."
        actions={
          user && (
            <Card className="w-56 px-4 py-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Çözülen</span>
                <span className="font-medium tabular-nums">
                  {solved} / {problems.data.length}
                </span>
              </div>
              <ProgressBar value={percent(solved, problems.data.length)} className="mt-2" barClassName="bg-emerald-500" label="Çözülen problem oranı" />
            </Card>
          )
        }
      />

      <form role="search" className="mt-8 flex flex-wrap gap-3" onSubmit={(event) => event.preventDefault()}>
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Problem ara</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setFilter('q', event.target.value)}
            placeholder="Ada ya da numaraya göre ara"
            className={cn(selectClass, 'w-full pl-9')}
          />
        </label>

        <label>
          <span className="sr-only">Zorluk</span>
          <select value={difficulty} onChange={(event) => setFilter('difficulty', event.target.value)} className={selectClass}>
            <option value="">Tüm zorluklar</option>
            {difficulties.map((value) => (
              <option key={value} value={value}>
                {difficultyLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="sr-only">Konu</span>
          <select value={tag} onChange={(event) => setFilter('tag', event.target.value)} className={selectClass}>
            <option value="">Tüm konular</option>
            {tags.map(([value, count]) => (
              <option key={value} value={value}>
                {tagLabel(value)} ({count})
              </option>
            ))}
          </select>
        </label>

        {user && (
          <label>
            <span className="sr-only">Durum</span>
            <select value={status} onChange={(event) => setFilter('status', event.target.value)} className={selectClass}>
              <option value="">Tüm durumlar</option>
              {statuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </form>

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {filtered.length} problem
        {hasFilters && (
          <>
            {' · '}
            <button type="button" onClick={() => setParams({}, { replace: true })} className="font-medium text-primary-text hover:underline">
              Süzgeçleri temizle
            </button>
          </>
        )}
      </p>

      {filtered.length === 0 ? (
        <EmptyState title="Eşleşen problem yok" description="Süzgeçleri değiştirerek tekrar deneyin." />
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-xs text-muted">
              <tr>
                <th scope="col" className="w-12 px-4 py-3">
                  <span className="sr-only">Durum</span>
                </th>
                <th scope="col" className="px-2 py-3 font-medium">
                  Problem
                </th>
                <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">
                  Konular
                </th>
                <th scope="col" className="w-24 px-4 py-3 font-medium">
                  Zorluk
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((problem) => (
                <tr key={problem.slug} className="transition-colors hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <StatusIcon status={problem.status} />
                  </td>
                  <td className="px-2 py-3">
                    <Link to={`/problems/${problem.slug}`} className="font-medium hover:text-primary-text">
                      <span className="mr-2 font-mono text-xs text-subtle tabular-nums">{problem.number}.</span>
                      {problem.title}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      {problem.tags.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setFilter('tag', item)}
                          className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted hover:text-fg"
                        >
                          {tagLabel(item)}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
