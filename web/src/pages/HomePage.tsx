import { ArrowRight, BookOpen, CircleCheck, Code2, ListChecks, SquareTerminal, Target } from 'lucide-react';
import type { ReactNode } from 'react';
import { TrackCard } from '@/components/TrackCard';
import { ButtonLink, Card, ErrorNotice } from '@/components/ui';
import { useProblems, useQuizzes, useTracks, useUser } from '@/lib/queries';

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{value}</dd>
    </div>
  );
}

const features = [
  {
    icon: BookOpen,
    title: 'Mülakat odaklı konu anlatımları',
    text: 'Her ders, mülakatta sorulan "neden" ve "nasıl" sorularına odaklanır: kavram, örnek kod, sık yapılan hatalar ve özet.',
  },
  {
    icon: Code2,
    title: 'Tarayıcıda gerçek kodlama pratiği',
    text: 'Problemleri C#, JavaScript ya da TypeScript ile çözün. Kodunuz yalıtılmış bir ortamda derlenir ve gizli testlerle değerlendirilir.',
  },
  {
    icon: ListChecks,
    title: 'Açıklamalı testler',
    text: 'Her sorunun yanıtıyla birlikte neden doğru olduğu da anlatılır. Yanlışlarınız en hızlı öğrendiğiniz yerdir.',
  },
  {
    icon: SquareTerminal,
    title: 'Deneme alanı',
    text: 'Derslerdeki kod örneklerini tek tıkla açın, değiştirin ve çalıştırın. Bir dil özelliğini anlamanın en kısa yolu denemektir.',
  },
];

const steps = [
  { title: 'Bir yol seçin', text: 'Eksik olduğunuz alandan başlayın ya da "Mülakat Hazırlığı" yolundaki çalışma planını izleyin.' },
  { title: 'Öğrenin ve pekiştirin', text: 'Dersi okuyun, örnekleri deneme alanında çalıştırın, bölüm testini çözün.' },
  { title: 'Problem çözün', text: 'Konuyu problemlerle uygulayın. Takılırsanız ipuçlarına, sonra çözüm anlatımına bakın.' },
  { title: 'İlerlemenizi izleyin', text: 'Paneliniz tamamladığınız dersleri, çözdüğünüz problemleri ve çalışma serinizi gösterir.' },
];

export default function HomePage() {
  const tracks = useTracks();
  const problems = useProblems();
  const quizzes = useQuizzes();
  const { user } = useUser();

  const lessonCount = tracks.data?.reduce((total, track) => total + track.lessonCount, 0);
  const questionCount = quizzes.data?.reduce((total, quiz) => total + quiz.questionCount, 0);

  return (
    <>
      <title>Zirve — Yazılım Mühendisliği Mülakat Hazırlığı</title>

      {/* ---------------------------------------------------------- kahraman bölümü */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_70%_-10%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent)]"
        />
        <div className="container-page relative py-16 sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
            <Target className="size-3.5 text-primary-text" aria-hidden />
            Google, Meta, Amazon, Microsoft, Apple ve benzeri şirketler için
          </p>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Yazılım mühendisliği mülakatlarına <span className="text-primary-text">uçtan uca</span> hazırlanın.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted text-pretty">
            Algoritmalar, sistem tasarımı, C#, .NET, JavaScript, TypeScript ve React. Konuyu öğrenin, testle sınayın, gerçek
            kod yazarak pekiştirin.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to={user ? '/dashboard' : '/tracks'} size="lg">
              {user ? 'Kaldığım yerden devam et' : 'Öğrenmeye başla'}
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink to="/problems" variant="secondary" size="lg">
              Problemlere göz at
            </ButtonLink>
          </div>

          <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-8 sm:grid-cols-4">
            <Stat value={tracks.data?.length ?? '—'} label="Öğrenme yolu" />
            <Stat value={lessonCount ?? '—'} label="Ders" />
            <Stat value={problems.data?.length ?? '—'} label="Kodlama problemi" />
            <Stat value={questionCount ?? '—'} label="Test sorusu" />
          </dl>
        </div>
      </section>

      {/* ---------------------------------------------------------- yollar */}
      <section className="container-page py-16" aria-labelledby="tracks-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="tracks-heading" className="text-2xl font-bold tracking-tight">
              Öğrenme yolları
            </h2>
            <p className="mt-1 text-muted">Her yol, temelden ileri konulara doğru sıralanmış derslerden oluşur.</p>
          </div>
          <ButtonLink to="/tracks" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Tümünü gör
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>

        {tracks.isError && <ErrorNotice error={tracks.error} onRetry={() => tracks.refetch()} className="mt-6" />}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.isPending
            ? Array.from({ length: 6 }, (_, index) => <div key={index} className="h-52 animate-pulse rounded-xl bg-surface-2" />)
            : tracks.data?.map((track) => <TrackCard key={track.slug} track={track} />)}
        </div>
      </section>

      {/* ---------------------------------------------------------- özellikler */}
      <section className="border-y border-border bg-surface/50" aria-labelledby="features-heading">
        <div className="container-page py-16">
          <h2 id="features-heading" className="text-2xl font-bold tracking-tight">
            Okumak yetmez; yaparak öğrenirsiniz
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="p-6">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary-text">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- nasıl çalışır */}
      <section className="container-page py-16" aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="text-2xl font-bold tracking-tight">
          Nasıl çalışılır
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="relative">
              <span className="font-mono text-sm font-semibold text-primary-text">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{step.text}</p>
            </li>
          ))}
        </ol>

        {!user && (
          <Card className="mt-12 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <CircleCheck className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                Ücretsiz hesap oluşturun
              </h3>
              <p className="mt-1 text-sm text-muted">
                Dersleri hesap açmadan okuyabilirsiniz. Kod çalıştırmak ve ilerlemenizi kaydetmek için hesap gerekir.
              </p>
            </div>
            <ButtonLink to="/register" className="shrink-0">
              Kayıt ol
            </ButtonLink>
          </Card>
        )}
      </section>
    </>
  );
}
