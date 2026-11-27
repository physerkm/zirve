import { Mountain } from 'lucide-react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { ButtonLink, EmptyState } from '@/components/ui';
import { defineMessages, useMessages } from '@/i18n/messages';

const messages = defineMessages({
  tr: {
    notFound: {
      pageTitle: 'Sayfa bulunamadı — Zirve',
      title: 'Bu patika bir yere çıkmıyor',
      description: 'Aradığınız sayfa bulunamadı. Adresi kontrol edin ya da ana sayfadan devam edin.',
      home: 'Ana sayfaya dön',
    },
    error: {
      pageTitle: 'Bir sorun oluştu — Zirve',
      title: 'Bir şeyler ters gitti',
      description: 'Sayfa yüklenirken beklenmeyen bir hata oluştu. Sayfayı yenilemek çoğu zaman sorunu çözer.',
      reload: 'Sayfayı yenile',
    },
  },
  en: {
    notFound: {
      pageTitle: 'Page not found — Zirve',
      title: 'This trail leads nowhere',
      description: "We couldn't find the page you're looking for. Check the address or continue from the home page.",
      home: 'Back to home',
    },
    error: {
      pageTitle: 'Something went wrong — Zirve',
      title: 'Something went wrong',
      description: 'An unexpected error occurred while loading the page. Reloading the page usually fixes it.',
      reload: 'Reload page',
    },
  },
});

export default function NotFoundPage() {
  const t = useMessages(messages).notFound;

  return (
    <div className="container-page py-16">
      <title>{t.pageTitle}</title>
      <EmptyState
        icon={<Mountain className="size-10" aria-hidden />}
        title={t.title}
        description={t.description}
        action={<ButtonLink to="/">{t.home}</ButtonLink>}
      />
    </div>
  );
}

/** Yönlendirici düzeyindeki hatalar (ör. yüklenemeyen sayfa parçası) için son savunma hattı. */
export function RouteErrorPage() {
  const t = useMessages(messages).error;
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  if (notFound) return <NotFoundPage />;

  return (
    <div className="container-page py-16">
      <title>{t.pageTitle}</title>
      <EmptyState
        title={t.title}
        description={t.description}
        action={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-primary-hover"
          >
            {t.reload}
          </button>
        }
      />
    </div>
  );
}
