import { QueryClientProvider } from '@tanstack/react-query';
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { Layout } from '@/components/Layout';
import { queryClient } from '@/lib/queries';
import HomePage from '@/pages/HomePage';
import NotFoundPage, { RouteErrorPage } from '@/pages/NotFoundPage';

// Ana sayfa dışındaki sayfalar ayrı parçalar olarak, gerektiğinde yüklenir.
const TracksPage = lazy(() => import('@/pages/TracksPage'));
const TrackPage = lazy(() => import('@/pages/TrackPage'));
const LessonPage = lazy(() => import('@/pages/LessonPage'));
const QuizzesPage = lazy(() => import('@/pages/QuizzesPage'));
const QuizPage = lazy(() => import('@/pages/QuizPage'));
const ProblemsPage = lazy(() => import('@/pages/ProblemsPage'));
const ProblemPage = lazy(() => import('@/pages/ProblemPage'));
const WalkthroughPage = lazy(() => import('@/pages/WalkthroughPage'));
const PlaygroundPage = lazy(() => import('@/pages/PlaygroundPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tracks', element: <TracksPage /> },
      { path: 'tracks/:trackSlug', element: <TrackPage /> },
      { path: 'tracks/:trackSlug/:lessonSlug', element: <LessonPage /> },
      { path: 'quizzes', element: <QuizzesPage /> },
      { path: 'quizzes/:quizSlug', element: <QuizPage /> },
      { path: 'problems', element: <ProblemsPage /> },
      { path: 'problems/:problemSlug', element: <ProblemPage /> },
      { path: 'problems/:problemSlug/adim-adim', element: <WalkthroughPage /> },
      { path: 'playground', element: <PlaygroundPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'login', element: <AuthPage key="login" mode="login" /> },
      { path: 'register', element: <AuthPage key="register" mode="register" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
