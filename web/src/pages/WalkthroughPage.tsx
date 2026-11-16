import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router';
import { useProblem } from '@/lib/queries';
import { useTheme } from '@/lib/theme';
import { hasWalkthrough, walkthroughFileUrl } from '@/lib/walkthroughs';
import NotFoundPage from './NotFoundPage';

/** Bir problemin çözümünü adım adım izleten etkileşimli anlatım; statik sayfa bir çerçevede gösterilir. */
export default function WalkthroughPage() {
  const { problemSlug = '' } = useParams();
  const problem = useProblem(problemSlug);
  const { theme } = useTheme();
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Anlatım sayfaları temayı <html data-theme> üzerinden okur; sitenin temasını oraya yansıtırız.
  const applyTheme = useCallback(() => {
    const root = frameRef.current?.contentDocument?.documentElement;
    if (root) root.dataset.theme = theme;
  }, [theme]);

  useEffect(applyTheme, [applyTheme]);

  if (!hasWalkthrough(problemSlug)) return <NotFoundPage />;

  const problemTitle = problem.data ? `${problem.data.number}. ${problem.data.title}` : 'Probleme dön';
  const fileUrl = walkthroughFileUrl(problemSlug);

  return (
    <div className="flex h-[calc(100dvh-4rem-1px)] flex-col">
      <title>{problem.data ? `${problem.data.title}: adım adım — Zirve` : 'Adım adım anlatım — Zirve'}</title>

      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b border-border bg-surface px-4 py-2.5 text-sm">
        {/* state: probleme dönüldüğünde cevap açık gelsin; kullanıcı zaten "Cevabı göster"e basmıştı. */}
        <Link
          to={`/problems/${problemSlug}`}
          state={{ showAnswer: true }}
          className="inline-flex min-w-0 items-center gap-1 font-medium text-muted hover:text-fg"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{problemTitle}</span>
        </Link>
        <span className="text-subtle" aria-hidden>
          /
        </span>
        <h1 className="font-medium">Adım adım anlatım</h1>
        <a href={fileUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-muted hover:text-fg">
          Yeni sekmede aç
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>

      <iframe
        ref={frameRef}
        src={fileUrl}
        title={problem.data ? `${problem.data.title}: adım adım anlatım` : 'Adım adım anlatım'}
        onLoad={applyTheme}
        className="min-h-0 w-full flex-1 border-0 bg-bg"
      />
    </div>
  );
}
