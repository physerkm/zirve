import { ArrowRight, BookOpen, CircleCheck, Code2, ListChecks, SquareTerminal, Target } from 'lucide-react';
import type { ReactNode } from 'react';
import { TrackCard } from '@/components/TrackCard';
import { ButtonLink, Card, ErrorNotice } from '@/components/ui';
import { defineMessages, useMessages } from '@/i18n/messages';
import { useProblems, useQuizzes, useTracks, useUser } from '@/lib/queries';

const messages = defineMessages({
  tr: {
    pageTitle: 'Zirve — Yazılım Mühendisliği Mülakat Hazırlığı',
    hero: {
      badge: 'Google, Meta, Amazon, Microsoft, Apple ve benzeri şirketler için',
      titleBefore: 'Yazılım mühendisliği mülakatlarına ',
      titleHighlight: 'uçtan uca',
      titleAfter: ' hazırlanın.',
      lead: 'Algoritmalar, sistem tasarımı, C#, .NET, JavaScript, TypeScript ve React. Konuyu öğrenin, testle sınayın, gerçek kod yazarak pekiştirin.',
      continue: 'Kaldığım yerden devam et',
      start: 'Öğrenmeye başla',
      browseProblems: 'Problemlere göz at',
    },
    stats: {
      tracks: 'Öğrenme yolu',
      lessons: 'Ders',
      problems: 'Kodlama problemi',
      questions: 'Test sorusu',
    },
    tracks: {
      heading: 'Öğrenme yolları',
      description: 'Her yol, temelden ileri konulara doğru sıralanmış derslerden oluşur.',
      viewAll: 'Tümünü gör',
    },
    featuresHeading: 'Okumak yetmez; yaparak öğrenirsiniz',
    features: {
      lessons: {
        title: 'Mülakat odaklı konu anlatımları',
        text: 'Her ders, mülakatta sorulan "neden" ve "nasıl" sorularına odaklanır: kavram, örnek kod, sık yapılan hatalar ve özet.',
      },
      coding: {
        title: 'Tarayıcıda gerçek kodlama pratiği',
        text: 'Problemleri C#, JavaScript ya da TypeScript ile çözün. Kodunuz yalıtılmış bir ortamda derlenir ve gizli testlerle değerlendirilir.',
      },
      quizzes: {
        title: 'Açıklamalı testler',
        text: 'Her sorunun yanıtıyla birlikte neden doğru olduğu da anlatılır. Yanlışlarınız en hızlı öğrendiğiniz yerdir.',
      },
      playground: {
        title: 'Deneme alanı',
        text: 'Derslerdeki kod örneklerini tek tıkla açın, değiştirin ve çalıştırın. Bir dil özelliğini anlamanın en kısa yolu denemektir.',
      },
    },
    stepsHeading: 'Nasıl çalışılır',
    steps: [
      { title: 'Bir yol seçin', text: 'Eksik olduğunuz alandan başlayın ya da "Mülakat Hazırlığı" yolundaki çalışma planını izleyin.' },
      { title: 'Öğrenin ve pekiştirin', text: 'Dersi okuyun, örnekleri deneme alanında çalıştırın, bölüm testini çözün.' },
      { title: 'Problem çözün', text: 'Konuyu problemlerle uygulayın. Takılırsanız ipuçlarına, sonra çözüm anlatımına bakın.' },
      { title: 'İlerlemenizi izleyin', text: 'Paneliniz tamamladığınız dersleri, çözdüğünüz problemleri ve çalışma serinizi gösterir.' },
    ],
    signup: {
      title: 'Ücretsiz hesap oluşturun',
      text: 'Dersleri hesap açmadan okuyabilirsiniz. Kod çalıştırmak ve ilerlemenizi kaydetmek için hesap gerekir.',
      button: 'Kayıt ol',
    },
  },
  en: {
    pageTitle: 'Zirve — Software Engineering Interview Prep',
    hero: {
      badge: 'For Google, Meta, Amazon, Microsoft, Apple and similar companies',
      titleBefore: 'Prepare for software engineering interviews ',
      titleHighlight: 'end to end',
      titleAfter: '.',
      lead: 'Algorithms, system design, C#, .NET, JavaScript, TypeScript and React. Learn the topic, test yourself with quizzes, and reinforce it by writing real code.',
      continue: 'Continue where I left off',
      start: 'Start learning',
      browseProblems: 'Browse problems',
    },
    stats: {
      tracks: 'Learning tracks',
      lessons: 'Lessons',
      problems: 'Coding problems',
      questions: 'Quiz questions',
    },
    tracks: {
      heading: 'Learning tracks',
      description: 'Each track is made up of lessons ordered from the fundamentals to advanced topics.',
      viewAll: 'View all',
    },
    featuresHeading: "Reading isn't enough; you learn by doing",
    features: {
      lessons: {
        title: 'Interview-focused lessons',
        text: 'Every lesson focuses on the "why" and "how" questions interviewers ask: the concept, sample code, common mistakes and a summary.',
      },
      coding: {
        title: 'Real coding practice in your browser',
        text: 'Solve problems in C#, JavaScript or TypeScript. Your code is compiled in an isolated environment and checked against hidden tests.',
      },
      quizzes: {
        title: 'Quizzes with explanations',
        text: 'Every answer comes with an explanation of why it is correct. Your mistakes are where you learn the fastest.',
      },
      playground: {
        title: 'Playground',
        text: 'Open the code samples from lessons in one click, change them and run them. Trying things out is the fastest way to understand a language feature.',
      },
    },
    stepsHeading: 'How it works',
    steps: [
      { title: 'Pick a track', text: 'Start with the area where you are weakest, or follow the study plan in the "Interview Preparation" track.' },
      { title: 'Learn and reinforce', text: 'Read the lesson, run the samples in the playground, and take the module quiz.' },
      { title: 'Solve problems', text: 'Apply the topic with problems. If you get stuck, check the hints, then the solution walkthrough.' },
      { title: 'Track your progress', text: 'Your dashboard shows the lessons you completed, the problems you solved and your study streak.' },
    ],
    signup: {
      title: 'Create a free account',
      text: 'You can read lessons without an account. You need one to run code and save your progress.',
      button: 'Sign up',
    },
  },
});

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{value}</dd>
    </div>
  );
}

const features = [
  { icon: BookOpen, key: 'lessons' },
  { icon: Code2, key: 'coding' },
  { icon: ListChecks, key: 'quizzes' },
  { icon: SquareTerminal, key: 'playground' },
] as const;

export default function HomePage() {
  const t = useMessages(messages);
  const tracks = useTracks();
  const problems = useProblems();
  const quizzes = useQuizzes();
  const { user } = useUser();

  const lessonCount = tracks.data?.reduce((total, track) => total + track.lessonCount, 0);
  const questionCount = quizzes.data?.reduce((total, quiz) => total + quiz.questionCount, 0);

  return (
    <>
      <title>{t.pageTitle}</title>

      {/* ---------------------------------------------------------- kahraman bölümü */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_70%_-10%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent)]"
        />
        <div className="container-page relative py-16 sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
            <Target className="size-3.5 text-primary-text" aria-hidden />
            {t.hero.badge}
          </p>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            {t.hero.titleBefore}
            <span className="text-primary-text">{t.hero.titleHighlight}</span>
            {t.hero.titleAfter}
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted text-pretty">{t.hero.lead}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to={user ? '/dashboard' : '/tracks'} size="lg">
              {user ? t.hero.continue : t.hero.start}
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink to="/problems" variant="secondary" size="lg">
              {t.hero.browseProblems}
            </ButtonLink>
          </div>

          <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-8 sm:grid-cols-4">
            <Stat value={tracks.data?.length ?? '—'} label={t.stats.tracks} />
            <Stat value={lessonCount ?? '—'} label={t.stats.lessons} />
            <Stat value={problems.data?.length ?? '—'} label={t.stats.problems} />
            <Stat value={questionCount ?? '—'} label={t.stats.questions} />
          </dl>
        </div>
      </section>

      {/* ---------------------------------------------------------- yollar */}
      <section className="container-page py-16" aria-labelledby="tracks-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="tracks-heading" className="text-2xl font-bold tracking-tight">
              {t.tracks.heading}
            </h2>
            <p className="mt-1 text-muted">{t.tracks.description}</p>
          </div>
          <ButtonLink to="/tracks" variant="ghost" size="sm" className="hidden sm:inline-flex">
            {t.tracks.viewAll}
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
            {t.featuresHeading}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, key }) => (
              <Card key={key} className="p-6">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary-text">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{t.features[key].title}</h3>
                <p className="mt-1.5 text-sm text-muted">{t.features[key].text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- nasıl çalışır */}
      <section className="container-page py-16" aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="text-2xl font-bold tracking-tight">
          {t.stepsHeading}
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.steps.map((step, index) => (
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
                {t.signup.title}
              </h3>
              <p className="mt-1 text-sm text-muted">{t.signup.text}</p>
            </div>
            <ButtonLink to="/register" className="shrink-0">
              {t.signup.button}
            </ButtonLink>
          </Card>
        )}
      </section>
    </>
  );
}
