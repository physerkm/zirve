import { Search } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useDebouncedValue } from '@/lib/hooks';
import { useSearch } from '@/lib/queries';
import { DifficultyBadge, Spinner } from './ui';

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const debounced = useDebouncedValue(query.trim(), 250);
  const search = useSearch(debounced);
  const results = debounced.length >= 2 ? search.data : undefined;
  const isEmpty = results && results.lessons.length + results.problems.length + results.quizzes.length === 0;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
      const editing = event.target instanceof HTMLElement && event.target.isContentEditable;

      if ((event.key === '/' && !typing && !editing) || (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey))) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  const close = () => {
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const showPanel = open && debounced.length >= 2;
  const itemClass = 'flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-surface-2 focus-visible:bg-surface-2';

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <label className="relative block">
        <span className="sr-only">Derslerde, problemlerde ve testlerde ara</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') close();
          }}
          placeholder="Ara…"
          className="h-9 w-full rounded-lg border border-border bg-surface pr-9 pl-9 text-sm outline-none transition-colors placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/25 [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-border px-1.5 font-mono text-[10px] text-subtle sm:block">
          /
        </kbd>
      </label>

      {showPanel && (
        <div
          id={listId}
          className="scrollbar-thin absolute top-full right-0 left-0 z-50 mt-2 max-h-[70vh] min-w-72 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-card sm:left-auto sm:w-96"
        >
          {search.isFetching && !results && (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}

          {isEmpty && <p className="px-3 py-6 text-center text-sm text-muted">"{debounced}" için sonuç bulunamadı.</p>}

          {results && results.lessons.length > 0 && (
            <section aria-label="Dersler">
              <h3 className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-subtle uppercase">Dersler</h3>
              {results.lessons.map((lesson) => (
                <Link key={`${lesson.trackSlug}/${lesson.slug}`} to={`/tracks/${lesson.trackSlug}/${lesson.slug}`} onClick={close} className={itemClass}>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{lesson.title}</span>
                    <span className="block truncate text-xs text-muted">{lesson.trackTitle}</span>
                  </span>
                </Link>
              ))}
            </section>
          )}

          {results && results.problems.length > 0 && (
            <section aria-label="Problemler">
              <h3 className="px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-subtle uppercase">Problemler</h3>
              {results.problems.map((problem) => (
                <Link key={problem.slug} to={`/problems/${problem.slug}`} onClick={close} className={itemClass}>
                  <span className="truncate font-medium">
                    {problem.number}. {problem.title}
                  </span>
                  <DifficultyBadge difficulty={problem.difficulty} />
                </Link>
              ))}
            </section>
          )}

          {results && results.quizzes.length > 0 && (
            <section aria-label="Testler">
              <h3 className="px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-subtle uppercase">Testler</h3>
              {results.quizzes.map((quiz) => (
                <Link key={quiz.slug} to={`/quizzes/${quiz.slug}`} onClick={close} className={itemClass}>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{quiz.title}</span>
                    <span className="block truncate text-xs text-muted">{quiz.trackTitle}</span>
                  </span>
                </Link>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
