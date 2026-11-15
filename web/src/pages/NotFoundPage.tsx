import { Mountain } from 'lucide-react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { ButtonLink, EmptyState } from '@/components/ui';

export default function NotFoundPage() {
  return (
    <div className="container-page py-16">
      <title>Sayfa bulunamadı — Zirve</title>
      <EmptyState
        icon={<Mountain className="size-10" aria-hidden />}
        title="Bu patika bir yere çıkmıyor"
        description="Aradığınız sayfa bulunamadı. Adresi kontrol edin ya da ana sayfadan devam edin."
        action={<ButtonLink to="/">Ana sayfaya dön</ButtonLink>}
      />
    </div>
  );
}

/** Yönlendirici düzeyindeki hatalar (ör. yüklenemeyen sayfa parçası) için son savunma hattı. */
export function RouteErrorPage() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  if (notFound) return <NotFoundPage />;

  return (
    <div className="container-page py-16">
      <title>Bir sorun oluştu — Zirve</title>
      <EmptyState
        title="Bir şeyler ters gitti"
        description="Sayfa yüklenirken beklenmeyen bir hata oluştu. Sayfayı yenilemek çoğu zaman sorunu çözer."
        action={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-primary-hover"
          >
            Sayfayı yenile
          </button>
        }
      />
    </div>
  );
}
