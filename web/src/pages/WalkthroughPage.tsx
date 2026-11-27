import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router';
import { useLocale } from '@/i18n/locale';
import { defineMessages, useMessages } from '@/i18n/messages';
import { useProblem } from '@/lib/queries';
import { useTheme } from '@/lib/theme';
import { hasWalkthrough, walkthroughFileUrl } from '@/lib/walkthroughs';
import NotFoundPage from './NotFoundPage';

const messages = defineMessages({
  tr: {
    backToProblem: 'Probleme dön',
    pageTitle: (problem: string) => `${problem}: adım adım — Zirve`,
    fallbackPageTitle: 'Adım adım anlatım — Zirve',
    heading: 'Adım adım anlatım',
    openInNewTab: 'Yeni sekmede aç',
    frameTitle: (problem: string) => `${problem}: adım adım anlatım`,
  },
  en: {
    backToProblem: 'Back to problem',
    pageTitle: (problem: string) => `${problem}: step by step — Zirve`,
    fallbackPageTitle: 'Step-by-step walkthrough — Zirve',
    heading: 'Step-by-step walkthrough',
    openInNewTab: 'Open in new tab',
    frameTitle: (problem: string) => `${problem}: step-by-step walkthrough`,
  },
});

/** Bir problemin çözümünü adım adım izleten etkileşimli anlatım; statik sayfa bir çerçevede gösterilir. */
export default function WalkthroughPage() {
  const { problemSlug = '' } = useParams();
  const t = useMessages(messages);
  const locale = useLocale();
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

  const problemTitle = problem.data ? `${problem.data.number}. ${problem.data.title}` : t.backToProblem;
  // Dil değişince adres de değişir; çerçeve (key sayesinde) o dildeki anlatımla yeniden yüklenir.
  const fileUrl = walkthroughFileUrl(problemSlug, locale);

  return (
    <div className="flex h-[calc(100dvh-4rem-1px)] flex-col">
      <title>{problem.data ? t.pageTitle(problem.data.title) : t.fallbackPageTitle}</title>

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
        <h1 className="font-medium">{t.heading}</h1>
        <a href={fileUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-muted hover:text-fg">
          {t.openInNewTab}
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>

      <iframe
        key={fileUrl}
        ref={frameRef}
        src={fileUrl}
        title={problem.data ? t.frameTitle(problem.data.title) : t.heading}
        onLoad={applyTheme}
        className="min-h-0 w-full flex-1 border-0 bg-bg"
      />
    </div>
  );
}
