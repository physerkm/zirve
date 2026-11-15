import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export const useTracks = () => useQuery({ queryKey: keys.tracks, queryFn: () => api.get<TrackSummary[]>('/tracks') });

export const useTrack = (slug: string) =>
  useQuery({ queryKey: keys.track(slug), queryFn: () => api.get<TrackDetail>(`/tracks/${slug}`) });

export const useLesson = (track: string, lesson: string) =>
  useQuery({
    queryKey: keys.lesson(track, lesson),
    queryFn: () => api.get<LessonDetail>(`/tracks/${track}/lessons/${lesson}`),
  });

export function useSetLessonProgress(track: string, lesson: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (completed: boolean) => api.put<void>(`/tracks/${track}/lessons/${lesson}/progress`, { completed }),
    // İyimser güncelleme: onay kutusu anında tepki verir, hata olursa geri alınır.
    onMutate: async (completed) => {
      await client.cancelQueries({ queryKey: keys.lesson(track, lesson) });
      const previous = client.getQueryData<LessonDetail>(keys.lesson(track, lesson));
      if (previous) client.setQueryData(keys.lesson(track, lesson), { ...previous, completed });
      return { previous };
    },
    onError: (_error, _completed, context) => {
      if (context?.previous) client.setQueryData(keys.lesson(track, lesson), context.previous);
    },
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: keys.tracks }),
        client.invalidateQueries({ queryKey: keys.dashboard }),
      ]),
  });
}

// ------------------------------------------------------------------ testler (quiz)

export const useQuizzes = () =>
  useQuery({ queryKey: keys.quizzes, queryFn: () => api.get<QuizSummary[]>('/quizzes') });

export const useQuiz = (slug: string) =>
  useQuery({ queryKey: keys.quiz(slug), queryFn: () => api.get<QuizDetail>(`/quizzes/${slug}`) });

export function useSubmitQuiz(slug: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (body: { answers: Record<number, number[]>; durationSeconds: number }) =>
      api.post<QuizAttemptResult>(`/quizzes/${slug}/attempts`, body),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: keys.quizzes, exact: true }),
        client.invalidateQueries({ queryKey: keys.tracks }),
        client.invalidateQueries({ queryKey: keys.dashboard }),
      ]),
  });
}

// ------------------------------------------------------------------ problemler

export const useProblems = () =>
  useQuery({ queryKey: keys.problems, queryFn: () => api.get<ProblemListItem[]>('/problems') });

export const useProblem = (slug: string) =>
  useQuery({ queryKey: keys.problem(slug), queryFn: () => api.get<ProblemDetail>(`/problems/${slug}`) });

export const useEditorial = (slug: string, enabled: boolean) =>
  useQuery({
    queryKey: keys.editorial(slug),
    queryFn: () => api.get<Editorial>(`/problems/${slug}/editorial`),
    enabled,
    staleTime: Infinity,
  });

export const useSubmissions = (slug: string, enabled: boolean) =>
  useQuery({
    queryKey: keys.submissions(slug),
    queryFn: () => api.get<SubmissionSummary[]>(`/problems/${slug}/submissions`),
    enabled,
  });

export const useSubmission = (id: string | null) =>
  useQuery({
    queryKey: keys.submission(id ?? ''),
    queryFn: () => api.get<SubmissionDetail>(`/submissions/${id}`),
    enabled: id !== null,
    staleTime: Infinity,
  });

export function useJudge(slug: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ mode, language, code }: { mode: 'run' | 'submit'; language: Language; code: string }) =>
      api.post<JudgeResponse>(`/problems/${slug}/${mode}`, { language, code }),
    onSuccess: (_result, { mode }) => {
      if (mode !== 'submit') return;

      return Promise.all([
        client.invalidateQueries({ queryKey: keys.submissions(slug) }),
        client.invalidateQueries({ queryKey: keys.problem(slug), exact: true }),
        client.invalidateQueries({ queryKey: keys.problems, exact: true }),
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

export const useDashboard = (enabled: boolean) =>
  useQuery({ queryKey: keys.dashboard, queryFn: () => api.get<Dashboard>('/me/dashboard'), enabled, staleTime: 10_000 });

export const useSearch = (query: string) =>
  useQuery({
    queryKey: keys.search(query),
    queryFn: () => api.get<SearchResults>(`/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length >= 2,
    placeholderData: (previous) => previous,
  });
