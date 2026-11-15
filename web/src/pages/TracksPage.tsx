import { TrackCard } from '@/components/TrackCard';
import { PageError, PageHeader, PageLoading } from '@/components/ui';
import { useTracks } from '@/lib/queries';

export default function TracksPage() {
  const tracks = useTracks();

  if (tracks.isPending) return <PageLoading />;
  if (tracks.isError) return <PageError error={tracks.error} onRetry={() => tracks.refetch()} />;

  return (
    <div className="container-page py-10">
      <title>Öğrenme Yolları — Zirve</title>
      <PageHeader
        title="Öğrenme Yolları"
        description="Bir alanı baştan sona çalışmak için sıralı dersler. Her yolun sonunda konuyu sınayan testler bulunur."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.data.map((track) => (
          <TrackCard key={track.slug} track={track} />
        ))}
      </div>
    </div>
  );
}
