import { TrackCard } from '@/components/TrackCard';
import { PageError, PageHeader, PageLoading } from '@/components/ui';
import { defineMessages, useMessages } from '@/i18n/messages';
import { useTracks } from '@/lib/queries';

const messages = defineMessages({
  tr: {
    pageTitle: 'Öğrenme Yolları — Zirve',
    title: 'Öğrenme Yolları',
    description: 'Bir alanı baştan sona çalışmak için sıralı dersler. Her yolun sonunda konuyu sınayan testler bulunur.',
  },
  en: {
    pageTitle: 'Learning Tracks — Zirve',
    title: 'Learning Tracks',
    description: 'Ordered lessons for studying a topic from start to finish. Each track ends with quizzes that test what you learned.',
  },
});

export default function TracksPage() {
  const t = useMessages(messages);
  const tracks = useTracks();

  if (tracks.isPending) return <PageLoading />;
  if (tracks.isError) return <PageError error={tracks.error} onRetry={() => tracks.refetch()} />;

  return (
    <div className="container-page py-10">
      <title>{t.pageTitle}</title>
      <PageHeader title={t.title} description={t.description} />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.data.map((track) => (
          <TrackCard key={track.slug} track={track} />
        ))}
      </div>
    </div>
  );
}
