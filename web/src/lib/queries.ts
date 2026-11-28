import { QueryClient, useMutation, useQuery, useQueryClient, type Query } from '@tanstack/react-query';
import { type Locale, useLocale } from '@/i18n/locale';
import { api, ApiError, loadSession } from './api';
import type {
  Dashboard,
  Editorial,
  ExecutionResult,
  JudgeResponse,
  Language,
  LessonDetail,
  ProblemDetail,
  ProblemListItem,
  QuizAttemptResult,
  QuizDetail,
  QuizSummary,
  SearchResults,
  Session,
  SubmissionDetail,
  SubmissionSummary,
  TrackDetail,
  TrackSummary,
} from './types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // İçerik seyrek değişir; gereksiz yeniden isteklerden kaçınıyoruz.
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // 4xx yanıtları yeniden denemek anlamsızdır; yalnızca ağ ve sunucu hatalarında tekrar dene.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
    },
    mutations: { retry: false },
  },
});

// Sunucu yanıtları dile göre değişir. Dil, sorgu anahtarının SON öğesidir ve istek de o anahtardaki
// dille yapılır: böylece bir dilin önbellek kaydı asla öbür dilin verisini almaz (yeniden çekilse bile).
// Dile bağlı hook'lar dili kendileri izler; dil değişince bileşen yeni dilin kaydına bağlanır, geri
// dönüldüğünde önceki dilin verisi hazırdır. Ön ek ile geçersiz kılma her iki dilin kaydını da kapsar.
// Oturum dilden bağımsızdır ve tek kopya tutulur.
const keys = {
  session: ['session'] as const,
  tracks: ['tracks'] as const,
  track: (slug: string) => ['tracks', slug] as const,
  lesson: (track: string, lesson: string) => ['tracks', track, 'lessons', lesson] as const,
  quizzes: ['quizzes'] as const,
  quiz: (slug: string) => ['quizzes', slug] as const,
  problems: ['problems'] as const,
  problem: (slug: string) => ['problems', slug] as const,
  editorial: (slug: string) => ['problems', slug, 'editorial'] as const,
  submissions: (slug: string) => ['problems', slug, 'submissions'] as const,
  submission: (id: string) => ['submissions', id] as const,
  dashboard: ['dashboard'] as const,
  search: (query: string) => ['search', query] as const,
};

const localized = <const T extends readonly unknown[]>(key: T, locale: Locale) => [...key, locale] as const;

/** Anahtarı, dil öğesi dışında verilen anahtarla birebir aynı olan sorgular (bütün dillerde). */
const exactly =
  (key: readonly unknown[]) =>
  (query: Query): boolean =>
    query.queryKey.length === key.length + 1 && key.every((part, index) => query.queryKey[index] === part);

// ------------------------------------------------------------------ oturum

export function useSession() {
  return useQuery({ queryKey: keys.session, queryFn: loadSession, staleTime: 5 * 60_000 });
}

export function useUser() {
  const session = useSession();
  return { user: session.data?.user, isLoading: session.isPending };
}

/** Giriş/çıkıştan sonra kullanıcıya özel bütün veriler (ilerleme, durumlar) bayatlar. */
function useSessionMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<Session>) {
  const client = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async (session) => {
      client.setQueryData(keys.session, session);
      await client.invalidateQueries({ predicate: (query) => query.queryKey[0] !== 'session' });
    },
  });
}

export const useLogin = () =>
  useSessionMutation((body: { email: string; password: string; rememberMe: boolean }) =>
    api.post<Session>('/auth/login', body),
  );

export const useRegister = () =>
  useSessionMutation((body: { email: string; password: string; displayName: string }) =>
    api.post<Session>('/auth/register', body),
  );

export const useLogout = () => useSessionMutation(() => api.post<Session>('/auth/logout'));

// ------------------------------------------------------------------ katalog

export function useTracks() {
  const locale = useLocale();
  return useQuery({ queryKey: localized(keys.tracks, locale), queryFn: () => api.get<TrackSummary[]>('/tracks', locale) });
}

export function useTrack(slug: string) {
  const locale = useLocale();
  return useQuery({ queryKey: localized(keys.track(slug), locale), queryFn: () => api.get<TrackDetail>(`/tracks/${slug}`, locale) });
}

export function useLesson(track: string, lesson: string) {
  const locale = useLocale();
  return useQuery({
    queryKey: localized(keys.lesson(track, lesson), locale),
    queryFn: () => api.get<LessonDetail>(`/tracks/${track}/lessons/${lesson}`, locale),
  });
}

export function useSetLessonProgress(track: string, lesson: string) {
  const client = useQueryClient();
  const key = localized(keys.lesson(track, lesson), useLocale());

  return useMutation({
    mutationFn: (completed: boolean) => api.put<void>(`/tracks/${track}/lessons/${lesson}/progress`, { completed }),
    // İyimser güncelleme: onay kutusu anında tepki verir, hata olursa geri alınır.
    onMutate: async (completed) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<LessonDetail>(key);
      if (previous) client.setQueryData(key, { ...previous, completed });
      return { previous };
    },
    onError: (_error, _completed, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
    },
    onSettled: () =>
      Promise.all([
        // Dersin öbür dildeki kaydı da güncel durumu göstermeli.
        client.invalidateQueries({ queryKey: keys.lesson(track, lesson) }),
        client.invalidateQueries({ queryKey: keys.tracks }),
        client.invalidateQueries({ queryKey: keys.dashboard }),
      ]),
  });
}

// ------------------------------------------------------------------ testler (quiz)

export function useQuizzes() {
  const locale = useLocale();
  return useQuery({ queryKey: localized(keys.quizzes, locale), queryFn: () => api.get<QuizSummary[]>('/quizzes', locale) });
}

export function useQuiz(slug: string) {
  const locale = useLocale();
  return useQuery({
    queryKey: localized(keys.quiz(slug), locale),
    queryFn: () => api.get<QuizDetail>(`/quizzes/${slug}`, locale),
    // Dil değişirken aynı testin önceki dildeki verisi gösterilmeye devam eder: soru ve şık kimlikleri
    // iki dilde aynıdır, yarıdaki test ve verilen cevaplar korunur.
    placeholderData: (previous, previousQuery) => (previousQuery?.queryKey[1] === slug ? previous : undefined),
  });
}

export function useSubmitQuiz(slug: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (body: { answers: Record<number, number[]>; durationSeconds: number }) =>
      api.post<QuizAttemptResult>(`/quizzes/${slug}/attempts`, body),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ predicate: exactly(keys.quizzes) }),
        client.invalidateQueries({ queryKey: keys.tracks }),
        client.invalidateQueries({ queryKey: keys.dashboard }),
      ]),
  });
}

// ------------------------------------------------------------------ problemler

export function useProblems() {
  const locale = useLocale();
  return useQuery({ queryKey: localized(keys.problems, locale), queryFn: () => api.get<ProblemListItem[]>('/problems', locale) });
}

export function useProblem(slug: string) {
  const locale = useLocale();
  return useQuery({
    queryKey: localized(keys.problem(slug), locale),
    queryFn: () => api.get<ProblemDetail>(`/problems/${slug}`, locale),
    // Dil değişirken aynı problemin önceki dildeki verisi gösterilmeye devam eder; editör ve sonuçlar korunur.
    placeholderData: (previous, previousQuery) => (previousQuery?.queryKey[1] === slug ? previous : undefined),
  });
}

export function useEditorial(slug: string, enabled: boolean) {
  const locale = useLocale();
  return useQuery({
    queryKey: localized(keys.editorial(slug), locale),
    queryFn: () => api.get<Editorial>(`/problems/${slug}/editorial`, locale),
    enabled,
    staleTime: Infinity,
  });
}

export function useSubmissions(slug: string, enabled: boolean) {
  const locale = useLocale();
  return useQuery({
    queryKey: localized(keys.submissions(slug), locale),
    queryFn: () => api.get<SubmissionSummary[]>(`/problems/${slug}/submissions`, locale),
    enabled,
  });
}

export function useSubmission(id: string | null) {
  const locale = useLocale();
  return useQuery({
    queryKey: localized(keys.submission(id ?? ''), locale),
    queryFn: () => api.get<SubmissionDetail>(`/submissions/${id}`, locale),
    enabled: id !== null,
    staleTime: Infinity,
  });
}

export function useJudge(slug: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ mode, language, code }: { mode: 'run' | 'submit'; language: Language; code: string }) =>
      api.post<JudgeResponse>(`/problems/${slug}/${mode}`, { language, code }),
    onSuccess: (_result, { mode }) => {
      if (mode !== 'submit') return;

      return Promise.all([
        client.invalidateQueries({ queryKey: keys.submissions(slug) }),
        client.invalidateQueries({ predicate: exactly(keys.problem(slug)) }),
        client.invalidateQueries({ predicate: exactly(keys.problems) }),
        client.invalidateQueries({ queryKey: keys.dashboard }),
      ]);
    },
  });
}

export const useRunPlayground = () =>
  useMutation({
    mutationFn: (body: { language: Language; code: string }) => api.post<ExecutionResult>('/playground/run', body),
  });

// ------------------------------------------------------------------ panel ve arama

export function useDashboard(enabled: boolean) {
  const locale = useLocale();
  return useQuery({
    queryKey: localized(keys.dashboard, locale),
    queryFn: () => api.get<Dashboard>('/me/dashboard', locale),
    enabled,
    staleTime: 10_000,
  });
}

export function useSearch(query: string) {
  const locale = useLocale();
  return useQuery({
    queryKey: localized(keys.search(query), locale),
    queryFn: () => api.get<SearchResults>(`/search?q=${encodeURIComponent(query)}`, locale),
    enabled: query.trim().length >= 2,
    placeholderData: (previous) => previous,
  });
}
